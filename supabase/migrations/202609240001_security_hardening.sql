alter table public.appointments
  drop constraint if exists appointments_time_order_check;

alter table public.appointments
  add constraint appointments_time_order_check check (end_at > start_at);

create index if not exists notification_logs_appointment_type_idx
  on public.notification_logs(appointment_id, notification_type);

drop policy if exists "Owners can view notification logs" on public.notification_logs;
create policy "Owners can view notification logs"
on public.notification_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.appointments a
    join public.businesses b on b.id = a.business_id
    where a.id = notification_logs.appointment_id
      and b.owner_id = (select auth.uid())
  )
);
