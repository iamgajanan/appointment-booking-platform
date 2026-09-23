create table if not exists public.business_booking_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  appointment_duration_minutes integer not null default 30 check (appointment_duration_minutes between 5 and 480),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes between 5 and 480),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 240),
  advance_booking_days integer not null default 30 check (advance_booking_days between 1 and 365),
  cancellation_notice_hours integer not null default 2 check (cancellation_notice_hours between 0 and 168),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 480),
  price numeric(12,2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_business_id_idx on public.services(business_id);
alter table public.business_booking_settings enable row level security;
alter table public.services enable row level security;

create policy "Owners manage booking settings" on public.business_booking_settings for all to authenticated
using (exists (select 1 from public.businesses b where b.id = business_booking_settings.business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = business_booking_settings.business_id and b.owner_id = (select auth.uid())));

create policy "Owners manage services" on public.services for all to authenticated
using (exists (select 1 from public.businesses b where b.id = services.business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = services.business_id and b.owner_id = (select auth.uid())));

insert into public.business_booking_settings (business_id)
select b.id from public.businesses b
on conflict (business_id) do nothing;
