create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.app_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  method text not null,
  path text not null,
  ip_address inet,
  user_agent text,
  status_code integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_user_id_idx
on public.audit_logs (actor_user_id);

create index if not exists audit_logs_entity_idx
on public.audit_logs (entity_type, entity_id);

create index if not exists audit_logs_created_at_idx
on public.audit_logs (created_at desc);
