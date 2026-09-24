-- Ensure notification claim storage exists even if legacy migration history was repaired.
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  notification_type text not null,
  sent_at timestamptz not null default now()
);

alter table public.notification_logs enable row level security;

-- Remove duplicate legacy claims before enforcing uniqueness.
with ranked_logs as (
  select
    ctid,
    row_number() over (
      partition by appointment_id, notification_type
      order by sent_at asc nulls last, id asc
    ) as row_number
  from public.notification_logs
)
delete from public.notification_logs logs
using ranked_logs duplicates
where logs.ctid = duplicates.ctid
  and duplicates.row_number > 1;

create unique index if not exists notification_logs_appointment_type_unique_idx
  on public.notification_logs(appointment_id, notification_type);

create index if not exists appointments_reminder_lookup_idx
  on public.appointments(status, start_at)
  where status in ('pending', 'confirmed');
