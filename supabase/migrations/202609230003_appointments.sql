create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('pending','confirmed','cancelled','completed')),
  created_at timestamptz not null default now()
);

create index if not exists appointments_business_start_idx on public.appointments(business_id, start_at);
alter table public.appointments enable row level security;

drop policy if exists "Owners can manage appointments" on public.appointments;
create policy "Owners can manage appointments" on public.appointments
for all to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
