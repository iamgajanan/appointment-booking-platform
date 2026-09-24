-- Prevent duplicate reminder delivery claims, including concurrent cron runs.
with ranked_logs as (
  select
    ctid,
    row_number() over (
      partition by appointment_id, notification_type
      order by created_at asc nulls last, id asc
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
