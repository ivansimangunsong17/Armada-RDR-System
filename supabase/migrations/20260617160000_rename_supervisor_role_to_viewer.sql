-- Rename read-only report role from supervisor to viewer.
-- Keeps the database change small while allowing the frontend to map legacy
-- supervisor users as viewer during rollout.

do $$
declare
  constraint_name text;
begin
  select c.conname
    into constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'profiles'
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%role%'
    and pg_get_constraintdef(c.oid) ilike '%supervisor%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.profiles
  drop constraint if exists profiles_role_check;

update public.profiles
set role = 'viewer'
where role = 'supervisor';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'checker', 'viewer'));
