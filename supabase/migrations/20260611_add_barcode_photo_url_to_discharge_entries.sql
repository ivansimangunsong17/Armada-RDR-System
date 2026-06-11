-- MVP barcode receipt photo support.
-- Run this before enabling upload in the app.

alter table public.discharge_entries
add column if not exists barcode_photo_url text;

-- Supabase Storage setup required outside this table migration:
-- 1. Create bucket: truck-barcode-receipts
-- 2. Allow authenticated users to upload image files to the bucket.
-- 3. Make the bucket public for simple MVP preview links, or provide signed URL
--    handling in the app before making it private.
