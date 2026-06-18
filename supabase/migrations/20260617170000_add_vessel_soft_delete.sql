-- Soft delete/archive support for vessels.
-- Archived vessels stay in the database for historical reports and relations.

alter table public.vessels
  add column if not exists deleted_at timestamptz;

create index if not exists vessels_deleted_at_idx
on public.vessels (deleted_at);
