alter table public.discharge_entries
add column if not exists gate_in_at timestamptz,
add column if not exists gate_in_date date,
add column if not exists gate_in_time time;
