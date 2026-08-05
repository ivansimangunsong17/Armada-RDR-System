# Phase 2 PostgreSQL Schema

Tujuan Phase 2: menyiapkan schema PostgreSQL murni tanpa Supabase Auth, Supabase RLS, Supabase Edge Functions, atau Supabase Storage.

## File Utama

```txt
backend/db/schema.postgres.sql
backend/scripts/apply-schema.js
backend/scripts/seed-admin.js
backend/.env.example
```

## Perubahan Konsep Dari Supabase

Schema lama:

```txt
profiles.id -> auth.users(id)
```

Schema baru:

```txt
app_users.id -> gen_random_uuid()
```

Auth sekarang menjadi tanggung jawab backend Node.js. Password disimpan di:

```txt
app_users.password_hash
```

Password harus dibuat dengan bcrypt dari backend, bukan disimpan plain text.

## Tabel PostgreSQL

```txt
app_users
destinations
vessels
vessel_destinations
hatch_cargo
checker_assignments
discharge_entries
```

## View Report

View dari schema lama dipertahankan:

```txt
running_report
shift_report
period_2_hour_report
```

## Menjalankan Schema

1. Buat database PostgreSQL, contoh:

```sql
create database running_discharge_system;
```

2. Isi `backend/.env` berdasarkan `backend/.env.example`.

3. Jalankan schema:

```bash
npm --prefix backend run db:schema
```

## Seed Admin Pertama

PowerShell:

```powershell
$env:ADMIN_FULL_NAME='Administrator'
$env:ADMIN_EMAIL='admin@example.com'
$env:ADMIN_USERNAME='admin'
$env:ADMIN_PASSWORD='ChangeMe123!'
npm --prefix backend run db:seed-admin
```

Script seed akan:

- membuat admin baru jika username/email belum ada;
- update admin lama jika username/email sudah ada;
- menyimpan password sebagai bcrypt hash.

## Validasi

Setelah schema jalan dan admin dibuat, endpoint Phase 1 ini bisa dipakai untuk cek koneksi:

```txt
GET /api/health/db
```

## Exit Criteria Phase 2

Phase 2 selesai jika:

- Schema PostgreSQL murni tersedia.
- Tidak ada dependency `auth.users` di schema baru.
- Tabel `app_users` menggantikan `profiles`.
- View report utama tersedia.
- Script apply schema tersedia.
- Script seed admin tersedia.
