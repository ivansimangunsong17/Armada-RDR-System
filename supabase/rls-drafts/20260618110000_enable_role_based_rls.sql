-- Phase 1 production RLS.
-- Keeps report reads available to active authenticated users while restricting
-- operational writes to the appropriate application roles.

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
    and p.is_active = true
  limit 1;
$$;

create or replace function public.current_profile_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
  );
$$;

create or replace function public.resolve_login_email(login_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email
  from public.profiles p
  where p.username = lower(trim(login_username))
    and p.is_active = true
  limit 1;
$$;

revoke all on function public.current_profile_role() from public;
revoke all on function public.current_profile_is_active() from public;
revoke all on function public.resolve_login_email(text) from public;

grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_is_active() to authenticated;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.vessels enable row level security;
alter table public.vessel_destinations enable row level security;
alter table public.hatch_cargo enable row level security;
alter table public.checker_assignments enable row level security;
alter table public.discharge_entries enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.destinations from anon;
revoke all on table public.vessels from anon;
revoke all on table public.vessel_destinations from anon;
revoke all on table public.hatch_cargo from anon;
revoke all on table public.checker_assignments from anon;
revoke all on table public.discharge_entries from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.destinations to authenticated;
grant select, insert, update on table public.vessels to authenticated;
grant select, insert, update on table public.vessel_destinations to authenticated;
grant select, insert, update, delete on table public.hatch_cargo to authenticated;
grant select, insert, update on table public.checker_assignments to authenticated;
grant select, insert, update, delete on table public.discharge_entries to authenticated;

drop policy if exists profiles_select_active_users on public.profiles;
create policy profiles_select_active_users
on public.profiles
for select
to authenticated
using ((select public.current_profile_is_active()));

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
on public.profiles
for update
to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists destinations_select_active_users on public.destinations;
create policy destinations_select_active_users
on public.destinations
for select
to authenticated
using ((select public.current_profile_is_active()));

drop policy if exists destinations_insert_admin on public.destinations;
create policy destinations_insert_admin
on public.destinations
for insert
to authenticated
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists destinations_update_admin on public.destinations;
create policy destinations_update_admin
on public.destinations
for update
to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists vessels_select_by_role on public.vessels;
create policy vessels_select_by_role
on public.vessels
for select
to authenticated
using (
  (select public.current_profile_role()) in ('admin', 'viewer')
  or exists (
    select 1
    from public.checker_assignments ca
    where ca.vessel_id = vessels.id
      and ca.checker_id = (select auth.uid())
      and ca.is_active = true
  )
);

drop policy if exists vessels_insert_admin on public.vessels;
create policy vessels_insert_admin
on public.vessels
for insert
to authenticated
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists vessels_update_admin on public.vessels;
create policy vessels_update_admin
on public.vessels
for update
to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists vessel_destinations_select_visible_vessel on public.vessel_destinations;
create policy vessel_destinations_select_visible_vessel
on public.vessel_destinations
for select
to authenticated
using (
  exists (
    select 1
    from public.vessels v
    where v.id = vessel_destinations.vessel_id
  )
);

drop policy if exists vessel_destinations_insert_admin on public.vessel_destinations;
create policy vessel_destinations_insert_admin
on public.vessel_destinations
for insert
to authenticated
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists vessel_destinations_update_admin on public.vessel_destinations;
create policy vessel_destinations_update_admin
on public.vessel_destinations
for update
to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists hatch_cargo_select_visible_vessel on public.hatch_cargo;
create policy hatch_cargo_select_visible_vessel
on public.hatch_cargo
for select
to authenticated
using (
  exists (
    select 1
    from public.vessels v
    where v.id = hatch_cargo.vessel_id
  )
);

drop policy if exists hatch_cargo_insert_admin on public.hatch_cargo;
create policy hatch_cargo_insert_admin
on public.hatch_cargo
for insert
to authenticated
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists hatch_cargo_update_admin on public.hatch_cargo;
create policy hatch_cargo_update_admin
on public.hatch_cargo
for update
to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists hatch_cargo_delete_admin on public.hatch_cargo;
create policy hatch_cargo_delete_admin
on public.hatch_cargo
for delete
to authenticated
using ((select public.current_profile_role()) = 'admin');

drop policy if exists checker_assignments_select_admin_or_self on public.checker_assignments;
create policy checker_assignments_select_admin_or_self
on public.checker_assignments
for select
to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or checker_id = (select auth.uid())
);

drop policy if exists checker_assignments_insert_admin on public.checker_assignments;
create policy checker_assignments_insert_admin
on public.checker_assignments
for insert
to authenticated
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists checker_assignments_update_admin on public.checker_assignments;
create policy checker_assignments_update_admin
on public.checker_assignments
for update
to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

drop policy if exists discharge_entries_select_by_role on public.discharge_entries;
create policy discharge_entries_select_by_role
on public.discharge_entries
for select
to authenticated
using (
  (select public.current_profile_role()) in ('admin', 'viewer')
  or checker_id = (select auth.uid())
);

drop policy if exists discharge_entries_insert_checker on public.discharge_entries;
create policy discharge_entries_insert_checker
on public.discharge_entries
for insert
to authenticated
with check (
  (select public.current_profile_role()) = 'checker'
  and checker_id = (select auth.uid())
  and exists (
    select 1
    from public.checker_assignments ca
    where ca.vessel_id = discharge_entries.vessel_id
      and ca.checker_id = (select auth.uid())
      and ca.is_active = true
  )
);

drop policy if exists discharge_entries_update_admin_or_owner on public.discharge_entries;
create policy discharge_entries_update_admin_or_owner
on public.discharge_entries
for update
to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'checker'
    and checker_id = (select auth.uid())
  )
)
with check (
  (select public.current_profile_role()) = 'admin'
  or (
    (select public.current_profile_role()) = 'checker'
    and checker_id = (select auth.uid())
  )
);

drop policy if exists discharge_entries_delete_admin on public.discharge_entries;
create policy discharge_entries_delete_admin
on public.discharge_entries
for delete
to authenticated
using ((select public.current_profile_role()) = 'admin');

alter view public.running_report set (security_invoker = true);
alter view public.shift_report set (security_invoker = true);
alter view public.period_2_hour_report set (security_invoker = true);

revoke all on table public.running_report from anon;
revoke all on table public.shift_report from anon;
revoke all on table public.period_2_hour_report from anon;

grant select on table public.running_report to authenticated;
grant select on table public.shift_report to authenticated;
grant select on table public.period_2_hour_report to authenticated;
