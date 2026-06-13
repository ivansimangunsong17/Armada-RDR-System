-- Running Discharge Report System (RDRS)
-- Supabase schema documentation / migration draft.
--
-- Do not run this file blindly against production. Review it against the
-- current Supabase project before applying.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_discharge_gate_out_fields()
returns trigger
language plpgsql
as $$
begin
  if new.gate_out_at is null then
    new.gate_out_at = now();
  end if;

  new.gate_out_date = (new.gate_out_at at time zone 'Asia/Jakarta')::date;
  new.gate_out_time = (new.gate_out_at at time zone 'Asia/Jakarta')::time;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  username text,
  role text not null check (role in ('admin', 'checker', 'supervisor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format_check
    check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,31}$')
);

create unique index if not exists profiles_email_unique_idx
on public.profiles (email)
where email is not null;

create unique index if not exists profiles_username_unique_idx
on public.profiles (username)
where username is not null;

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint destinations_name_unique unique (name)
);

create table if not exists public.vessels (
  id uuid primary key default gen_random_uuid(),
  vessel_name text not null,
  cargo_owner text not null,
  cargo_type text not null,
  destination_id uuid not null references public.destinations(id),
  total_hatch integer not null check (total_hatch > 0),
  eta date,
  start_discharge_date date not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vessel_destinations (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  destination_id uuid not null references public.destinations(id),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  deactivated_at timestamptz,
  constraint vessel_destinations_vessel_destination_unique
    unique (vessel_id, destination_id)
);

create table if not exists public.hatch_cargo (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  hatch_no integer not null check (hatch_no > 0),
  hatch_label text generated always as ('H' || hatch_no::text) stored,
  initial_cargo numeric(14, 3) not null default 0 check (initial_cargo >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hatch_cargo_vessel_hatch_unique unique (vessel_id, hatch_no)
);

create table if not exists public.checker_assignments (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id) on delete cascade,
  checker_id uuid not null references public.profiles(id),
  assigned_by uuid references public.profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checker_assignments_vessel_checker_unique unique (vessel_id, checker_id)
);

create unique index if not exists checker_assignments_one_active_checker_per_vessel
on public.checker_assignments (vessel_id)
where is_active = true;

comment on index public.checker_assignments_one_active_checker_per_vessel is
  'Foundation decision: one checker can handle many vessels, but one vessel has only one active checker for now.';

create table if not exists public.discharge_entries (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id),
  hatch_cargo_id uuid not null references public.hatch_cargo(id),
  destination_id uuid references public.destinations(id),
  checker_id uuid not null references public.profiles(id),
  plate_number text not null,
  tonnage numeric(14, 3) not null check (tonnage > 0),
  delivery_order_number text not null,
  scale_ticket_number text not null,
  gate_in_at timestamptz,
  gate_in_date date,
  gate_in_time time,
  gate_out_at timestamptz not null default now(),
  gate_out_date date,
  gate_out_time time,
  barcode_photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discharge_entries_delivery_order_per_vessel_unique
    unique (vessel_id, delivery_order_number),
  constraint discharge_entries_scale_ticket_per_vessel_unique
    unique (vessel_id, scale_ticket_number)
);

create index if not exists hatch_cargo_vessel_id_idx
on public.hatch_cargo (vessel_id);

create index if not exists vessel_destinations_vessel_id_idx
on public.vessel_destinations (vessel_id);

create index if not exists vessel_destinations_destination_id_idx
on public.vessel_destinations (destination_id);

create index if not exists vessel_destinations_active_idx
on public.vessel_destinations (vessel_id, is_active);

create index if not exists checker_assignments_checker_id_idx
on public.checker_assignments (checker_id);

create index if not exists discharge_entries_vessel_id_idx
on public.discharge_entries (vessel_id);

create index if not exists discharge_entries_checker_id_idx
on public.discharge_entries (checker_id);

create index if not exists discharge_entries_destination_id_idx
on public.discharge_entries (destination_id);

create index if not exists discharge_entries_gate_out_at_idx
on public.discharge_entries (gate_out_at);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists destinations_set_updated_at on public.destinations;
create trigger destinations_set_updated_at
before update on public.destinations
for each row execute function public.set_updated_at();

drop trigger if exists vessels_set_updated_at on public.vessels;
create trigger vessels_set_updated_at
before update on public.vessels
for each row execute function public.set_updated_at();

drop trigger if exists vessel_destinations_set_updated_at on public.vessel_destinations;
create trigger vessel_destinations_set_updated_at
before update on public.vessel_destinations
for each row execute function public.set_updated_at();

drop trigger if exists hatch_cargo_set_updated_at on public.hatch_cargo;
create trigger hatch_cargo_set_updated_at
before update on public.hatch_cargo
for each row execute function public.set_updated_at();

drop trigger if exists checker_assignments_set_updated_at on public.checker_assignments;
create trigger checker_assignments_set_updated_at
before update on public.checker_assignments
for each row execute function public.set_updated_at();

drop trigger if exists discharge_entries_set_updated_at on public.discharge_entries;
create trigger discharge_entries_set_updated_at
before update on public.discharge_entries
for each row execute function public.set_updated_at();

drop trigger if exists discharge_entries_set_gate_out_fields on public.discharge_entries;
create trigger discharge_entries_set_gate_out_fields
before insert or update of gate_out_at on public.discharge_entries
for each row execute function public.set_discharge_gate_out_fields();

create or replace view public.running_report as
select
  v.id as vessel_id,
  v.vessel_name,
  d.name as destination,
  hc.id as hatch_cargo_id,
  hc.hatch_no,
  hc.hatch_label,
  hc.initial_cargo,
  coalesce(sum(de.tonnage), 0)::numeric(14, 3) as total_discharge,
  count(de.id)::integer as total_dt,
  case
    when count(de.id) > 0 then (sum(de.tonnage) / count(de.id))::numeric(14, 3)
    else 0::numeric(14, 3)
  end as average_tonnage,
  greatest(hc.initial_cargo - coalesce(sum(de.tonnage), 0), 0)::numeric(14, 3) as remaining_cargo,
  case
    when hc.initial_cargo > 0 then
      least((coalesce(sum(de.tonnage), 0) / hc.initial_cargo) * 100, 100)::numeric(8, 2)
    else 0::numeric(8, 2)
  end as progress_percentage
from public.hatch_cargo hc
join public.vessels v on v.id = hc.vessel_id
join public.destinations d on d.id = v.destination_id
left join public.discharge_entries de on de.hatch_cargo_id = hc.id
group by
  v.id,
  v.vessel_name,
  d.name,
  hc.id,
  hc.hatch_no,
  hc.hatch_label,
  hc.initial_cargo;

create or replace view public.shift_report as
select
  v.id as vessel_id,
  v.vessel_name,
  d.name as destination,
  de.gate_out_date,
  case
    when extract(hour from de.gate_out_time) >= 8
      and extract(hour from de.gate_out_time) < 16 then 'shift_1'
    when extract(hour from de.gate_out_time) >= 16 then 'shift_2'
    else 'shift_3'
  end as shift_name,
  hc.id as hatch_cargo_id,
  hc.hatch_no,
  hc.hatch_label,
  sum(de.tonnage)::numeric(14, 3) as total_discharge,
  count(de.id)::integer as total_dt,
  (sum(de.tonnage) / count(de.id))::numeric(14, 3) as average_tonnage
from public.discharge_entries de
join public.vessels v on v.id = de.vessel_id
join public.destinations d on d.id = v.destination_id
join public.hatch_cargo hc on hc.id = de.hatch_cargo_id
group by
  v.id,
  v.vessel_name,
  d.name,
  de.gate_out_date,
  shift_name,
  hc.id,
  hc.hatch_no,
  hc.hatch_label;

create or replace view public.period_2_hour_report as
select
  v.id as vessel_id,
  v.vessel_name,
  d.name as destination,
  de.gate_out_date,
  (floor(extract(hour from de.gate_out_time) / 2) * 2)::integer as period_start_hour,
  ((floor(extract(hour from de.gate_out_time) / 2) * 2) + 2)::integer as period_end_hour,
  hc.id as hatch_cargo_id,
  hc.hatch_no,
  hc.hatch_label,
  sum(de.tonnage)::numeric(14, 3) as total_discharge,
  count(de.id)::integer as total_dt,
  (sum(de.tonnage) / count(de.id))::numeric(14, 3) as average_tonnage
from public.discharge_entries de
join public.vessels v on v.id = de.vessel_id
join public.destinations d on d.id = v.destination_id
join public.hatch_cargo hc on hc.id = de.hatch_cargo_id
group by
  v.id,
  v.vessel_name,
  d.name,
  de.gate_out_date,
  period_start_hour,
  period_end_hour,
  hc.id,
  hc.hatch_no,
  hc.hatch_label;
