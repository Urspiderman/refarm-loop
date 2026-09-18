-- ReFarm Loop initial schema. No seed/dummy data.
create extension if not exists "pgcrypto";

create type public.user_role as enum ('supplier_farmer','supplier_market','recovery_partner','collector','admin');
create type public.surplus_status as enum ('listed','matched','accepted','scheduled','picked_up','received','completed','rejected','cancelled');
create type public.transaction_status as enum ('pending','awaiting_payment','paid','in_collection','completed','cancelled','refunded');
create type public.pickup_status as enum ('scheduled','accepted','on_the_way','picked_up','delivered','cancelled');
create type public.pathway_type as enum ('animal_feed','compost','organic_fertilizer','food_processing','bioconversion','other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  phone text,
  address text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.surplus_listings (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  material_name text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null default 'kg',
  condition text not null,
  photo_path text,
  status public.surplus_status not null default 'listed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.material_assessments (
  id uuid primary key default gen_random_uuid(),
  surplus_id uuid not null unique references public.surplus_listings(id) on delete cascade,
  material_type text,
  condition text,
  recovery_potential numeric(5,2),
  recommended_pathways public.pathway_type[] default '{}',
  explanation text,
  confidence numeric(4,3),
  model_name text,
  created_at timestamptz not null default now()
);

create table public.recovery_partner_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  organization_name text not null,
  description text,
  capacity_kg_per_week numeric(14,3),
  service_radius_km numeric(8,2),
  verified boolean not null default false
);

create table public.material_demands (
  id uuid primary key default gen_random_uuid(),
  recovery_partner_id uuid not null references public.recovery_partner_profiles(id) on delete cascade,
  material_name text not null,
  pathway public.pathway_type not null,
  quantity_needed numeric(14,3) not null check (quantity_needed > 0),
  capacity_available_kg numeric(14,3),
  min_condition text,
  latitude double precision,
  longitude double precision,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  surplus_id uuid not null references public.surplus_listings(id) on delete cascade,
  demand_id uuid not null references public.material_demands(id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  compatibility_score numeric(5,2),
  quantity_score numeric(5,2),
  distance_score numeric(5,2),
  capacity_score numeric(5,2),
  status text not null default 'proposed',
  created_at timestamptz not null default now(),
  unique(surplus_id,demand_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  surplus_id uuid not null references public.surplus_listings(id),
  buyer_id uuid not null references public.profiles(id),
  supplier_id uuid not null references public.profiles(id),
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  gross_amount numeric(14,2) generated always as (quantity * unit_price) stored,
  platform_fee numeric(14,2) not null default 0,
  payment_fee numeric(14,2) not null default 0,
  supplier_amount numeric(14,2) generated always as ((quantity * unit_price) - platform_fee - payment_fee) stored,
  status public.transaction_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  order_id text not null unique,
  provider text not null default 'midtrans',
  amount numeric(14,2) not null,
  status text not null default 'pending',
  payment_type text,
  transaction_time timestamptz,
  settlement_time timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  order_id text not null,
  status_code text not null,
  transaction_status text,
  fraud_status text,
  signature_valid boolean not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  collector_id uuid references public.profiles(id),
  status public.pickup_status not null default 'scheduled',
  scheduled_at timestamptz,
  pickup_latitude double precision,
  pickup_longitude double precision,
  delivery_latitude double precision,
  delivery_longitude double precision,
  actual_quantity numeric(14,3),
  pickup_proof_path text,
  delivery_proof_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pickup_events (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references public.pickups(id) on delete cascade,
  status public.pickup_status not null,
  latitude double precision,
  longitude double precision,
  note text,
  proof_path text,
  created_at timestamptz not null default now()
);

create table public.recovery_records (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  recovery_partner_id uuid not null references public.recovery_partner_profiles(id),
  pathway public.pathway_type not null,
  input_quantity numeric(14,3) not null,
  output_quantity numeric(14,3),
  recovered_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.impact_records (
  id uuid primary key default gen_random_uuid(),
  recovery_record_id uuid not null references public.recovery_records(id) on delete cascade,
  material_recovered_kg numeric(14,3) not null default 0,
  estimated_co2e_avoided_kg numeric(14,3),
  methodology_note text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index surplus_supplier_idx on public.surplus_listings(supplier_id);
create index surplus_status_idx on public.surplus_listings(status);
create index demands_partner_idx on public.material_demands(recovery_partner_id);
create index matches_surplus_idx on public.matches(surplus_id);
create index transactions_supplier_idx on public.transactions(supplier_id);
create index transactions_buyer_idx on public.transactions(buyer_id);
create index pickups_collector_idx on public.pickups(collector_id);

alter table public.profiles enable row level security;
alter table public.surplus_listings enable row level security;
alter table public.material_assessments enable row level security;
alter table public.recovery_partner_profiles enable row level security;
alter table public.material_demands enable row level security;
alter table public.matches enable row level security;
alter table public.transactions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.pickups enable row level security;
alter table public.pickup_events enable row level security;
alter table public.recovery_records enable row level security;
alter table public.impact_records enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;

create policy "profile self read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "profile self insert" on public.profiles for insert with check (id=auth.uid());
create policy "profile self update" on public.profiles for update using (id=auth.uid() or public.is_admin());

create policy "surplus own read" on public.surplus_listings for select using (supplier_id=auth.uid() or public.is_admin());
create policy "surplus own insert" on public.surplus_listings for insert with check (supplier_id=auth.uid());
create policy "surplus own update" on public.surplus_listings for update using (supplier_id=auth.uid() or public.is_admin());
create policy "surplus own delete" on public.surplus_listings for delete using (supplier_id=auth.uid() or public.is_admin());

create policy "assessment related read" on public.material_assessments for select using (exists(select 1 from public.surplus_listings s where s.id=surplus_id and (s.supplier_id=auth.uid() or public.is_admin())) or public.is_admin());

create policy "partner public read verified" on public.recovery_partner_profiles for select using (verified=true or id=auth.uid() or public.is_admin());
create policy "partner self manage" on public.recovery_partner_profiles for all using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());

create policy "demand read active" on public.material_demands for select using (active=true or public.is_admin());
create policy "demand partner manage" on public.material_demands for all using (recovery_partner_id=auth.uid() or public.is_admin()) with check (recovery_partner_id=auth.uid() or public.is_admin());

create policy "matches participants read" on public.matches for select using (
  exists(select 1 from public.surplus_listings s where s.id=surplus_id and s.supplier_id=auth.uid())
  or exists(select 1 from public.material_demands d join public.recovery_partner_profiles p on p.id=d.recovery_partner_id where d.id=demand_id and p.id=auth.uid())
  or public.is_admin()
);

create policy "transactions participants read" on public.transactions for select using (supplier_id=auth.uid() or buyer_id=auth.uid() or public.is_admin());
create policy "transactions supplier insert" on public.transactions for insert with check (supplier_id=auth.uid());
create policy "transactions participants update" on public.transactions for update using (supplier_id=auth.uid() or buyer_id=auth.uid() or public.is_admin());

create policy "payments participant read" on public.payments for select using (exists(select 1 from public.transactions t where t.id=transaction_id and (t.supplier_id=auth.uid() or t.buyer_id=auth.uid())) or public.is_admin());

create policy "pickups participants read" on public.pickups for select using (
  collector_id=auth.uid()
  or exists(select 1 from public.transactions t where t.id=transaction_id and (t.supplier_id=auth.uid() or t.buyer_id=auth.uid()))
  or public.is_admin()
);
create policy "pickup collector update" on public.pickups for update using (collector_id=auth.uid() or public.is_admin());

create policy "recovery participants read" on public.recovery_records for select using (
  recovery_partner_id=auth.uid()
  or exists(select 1 from public.transactions t where t.id=transaction_id and (t.supplier_id=auth.uid() or t.buyer_id=auth.uid()))
  or public.is_admin()
);

create policy "impact participant read" on public.impact_records for select using (
  exists(select 1 from public.recovery_records r join public.transactions t on t.id=r.transaction_id where r.id=recovery_record_id and (r.recovery_partner_id=auth.uid() or t.supplier_id=auth.uid() or t.buyer_id=auth.uid()))
  or public.is_admin()
);

create policy "audit admin read" on public.audit_logs for select using (public.is_admin());

-- Trigger: create profile from signup metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','User'), coalesce((new.raw_user_meta_data->>'role')::public.user_role,'supplier_farmer'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Storage bucket (empty).
insert into storage.buckets (id,name,public) values ('refarm-media','refarm-media',false)
on conflict (id) do nothing;

create policy "media own read" on storage.objects for select using (bucket_id='refarm-media' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "media own upload" on storage.objects for insert with check (bucket_id='refarm-media' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "media own delete" on storage.objects for delete using (bucket_id='refarm-media' and auth.uid()::text = (storage.foldername(name))[1]);
