create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create index if not exists vessel_destinations_vessel_id_idx
on public.vessel_destinations (vessel_id);

create index if not exists vessel_destinations_destination_id_idx
on public.vessel_destinations (destination_id);

create index if not exists vessel_destinations_active_idx
on public.vessel_destinations (vessel_id, is_active);

drop trigger if exists vessel_destinations_set_updated_at on public.vessel_destinations;
create trigger vessel_destinations_set_updated_at
before update on public.vessel_destinations
for each row execute function public.set_updated_at();

alter table public.discharge_entries
add column if not exists destination_id uuid references public.destinations(id);

create index if not exists discharge_entries_destination_id_idx
on public.discharge_entries (destination_id);

insert into public.vessel_destinations (vessel_id, destination_id, is_active)
select id, destination_id, true
from public.vessels
where destination_id is not null
on conflict (vessel_id, destination_id) do update
set is_active = true,
    deactivated_at = null;

update public.discharge_entries de
set destination_id = v.destination_id
from public.vessels v
where de.vessel_id = v.id
  and de.destination_id is null
  and v.destination_id is not null;
