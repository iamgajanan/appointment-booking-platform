create extension if not exists btree_gist;

create or replace function public.validate_appointment_booking()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  business_record record;
  settings_record record;
  service_record record;
  local_start timestamp;
  local_end timestamp;
  local_day_of_week integer;
  requested_duration integer;
  within_business_hours boolean;
begin
  if new.end_at <= new.start_at then
    raise exception 'Appointment end time must be after start time';
  end if;

  if new.start_at <= now() then
    raise exception 'Appointments must be scheduled in the future';
  end if;

  select b.id, b.timezone, b.is_active
    into business_record
  from public.businesses b
  where b.id = new.business_id;

  if not found then
    raise exception 'Business not found';
  end if;

  if coalesce(business_record.is_active, true) = false then
    raise exception 'Business is not accepting appointments';
  end if;

  select s.appointment_duration_minutes, s.advance_booking_days
    into settings_record
  from public.business_booking_settings s
  where s.business_id = new.business_id;

  if settings_record is null then
    raise exception 'Booking settings are not configured';
  end if;

  if new.start_at > now() + make_interval(days => settings_record.advance_booking_days) then
    raise exception 'Appointment is outside the booking window';
  end if;

  if new.service_id is not null then
    select s.id, s.duration_minutes, s.is_active
      into service_record
    from public.services s
    where s.id = new.service_id
      and s.business_id = new.business_id;

    if not found or service_record.is_active = false then
      raise exception 'Selected service is not available for this business';
    end if;

    requested_duration := service_record.duration_minutes;
  else
    requested_duration := settings_record.appointment_duration_minutes;
  end if;

  if extract(epoch from (new.end_at - new.start_at)) <> requested_duration * 60 then
    raise exception 'Appointment duration does not match the configured service duration';
  end if;

  local_start := new.start_at at time zone coalesce(business_record.timezone, 'UTC');
  local_end := new.end_at at time zone coalesce(business_record.timezone, 'UTC');

  if local_start::date <> local_end::date then
    raise exception 'Appointments cannot cross local calendar days';
  end if;

  local_day_of_week := extract(dow from local_start)::integer;

  select exists (
    select 1
    from public.business_hours h
    where h.business_id = new.business_id
      and h.day_of_week = local_day_of_week
      and local_start::time >= h.start_time
      and local_end::time <= h.end_time
  ) into within_business_hours;

  if not within_business_hours then
    raise exception 'Appointment is outside business hours';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_appointment_booking_trigger on public.appointments;
create trigger validate_appointment_booking_trigger
before insert or update of business_id, service_id, start_at, end_at, status
on public.appointments
for each row
when (new.status <> 'cancelled')
execute function public.validate_appointment_booking();

alter table public.appointments
  drop constraint if exists appointments_no_overlapping_active;

alter table public.appointments
  add constraint appointments_no_overlapping_active
  exclude using gist (
    business_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status <> 'cancelled');
