-- Foundation hardening before production.
-- Scope:
-- - sync profile columns needed by username login and User Management Step 1
-- - sync Gate In columns already used by the frontend
-- - document checker assignment cardinality without changing behavior
-- - do not enable RLS and do not create users from the app

alter table public.profiles
add column if not exists email text,
add column if not exists username text;

create unique index if not exists profiles_email_unique_idx
on public.profiles (email)
where email is not null;

create unique index if not exists profiles_username_unique_idx
on public.profiles (username)
where username is not null;

alter table public.profiles
drop constraint if exists profiles_username_format_check;

alter table public.profiles
add constraint profiles_username_format_check
check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,31}$');

alter table public.discharge_entries
add column if not exists gate_in_at timestamptz,
add column if not exists gate_in_date date,
add column if not exists gate_in_time time;

create unique index if not exists checker_assignments_one_active_checker_per_vessel
on public.checker_assignments (vessel_id)
where is_active = true;

comment on index public.checker_assignments_one_active_checker_per_vessel is
  'Foundation decision: one checker can handle many vessels, but one vessel has only one active checker for now.';
