-- Storage bucket and policies for MVP barcode receipt uploads.
-- Run manually in Supabase SQL editor. Do not use a service role key in the app.

insert into storage.buckets (id, name, public)
values ('truck-barcode-receipts', 'truck-barcode-receipts', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated can upload truck barcode receipts" on storage.objects;
drop policy if exists "Authenticated can read truck barcode receipts" on storage.objects;

create policy "Authenticated can upload truck barcode receipts"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'truck-barcode-receipts');

create policy "Authenticated can read truck barcode receipts"
on storage.objects
for select
to authenticated
using (bucket_id = 'truck-barcode-receipts');
