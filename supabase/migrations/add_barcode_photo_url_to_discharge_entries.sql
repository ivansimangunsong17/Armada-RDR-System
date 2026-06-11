alter table public.discharge_entries
add column if not exists barcode_photo_url text;
