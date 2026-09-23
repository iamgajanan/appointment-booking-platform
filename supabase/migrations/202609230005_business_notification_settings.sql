create table if not exists public.business_notification_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  email_booking_confirmation boolean not null default true,
  email_status_updates boolean not null default true,
  email_reminders boolean not null default true,
  reminder_hours integer not null default 24 check (reminder_hours between 1 and 72),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_notification_settings enable row level security;

create policy "Owners can manage notification settings"
on public.business_notification_settings
for all
using (
  exists (
    select 1
    from public.businesses
    where businesses.id = business_notification_settings.business_id
      and businesses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.businesses
    where businesses.id = business_notification_settings.business_id
      and businesses.owner_id = auth.uid()
  )
);