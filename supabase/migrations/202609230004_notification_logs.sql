create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  notification_type text not null,
  sent_at timestamptz not null default now(),
  unique (appointment_id, notification_type)
);

alter table public.notification_logs enable row level security;
