# Backend PostgreSQL Architecture

Target arsitektur:

```txt
React frontend -> Node.js REST API -> PostgreSQL
```

Supabase tidak lagi menjadi backend aplikasi. Arsip folder Supabase lama sudah dihapus dari repository.

## Layer

- `src/`: frontend React. Page dan component tetap memakai `src/services/*`.
- `backend/`: backend API. Semua validasi request, auth, query, dan mapping data berada di sini.
- `backend/db/schema.postgres.sql`: schema PostgreSQL murni tanpa `auth.users`, Supabase RLS, Supabase Edge Functions, atau Supabase Storage.

## Backend Runtime

Backend memakai Express dan driver `pg`.

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Health check:

```txt
GET http://localhost:4000/api/health
GET http://localhost:4000/api/health/db
```

## Frontend Runtime

Frontend nantinya memakai:

```txt
VITE_API_BASE_URL=http://localhost:4000/api
```

Setelah service dimigrasi, frontend tidak perlu lagi `VITE_SUPABASE_URL` atau `VITE_SUPABASE_ANON_KEY`.

## Migrasi Yang Perlu Dilakukan

1. Buat database PostgreSQL dan jalankan `backend/db/schema.postgres.sql`.
2. Buat endpoint backend per module: auth, users, vessels, discharge, reports, storage.
3. Ubah isi `src/services/*` dari Supabase SDK ke `apiClient`.
4. Hapus dependency frontend `@supabase/supabase-js` setelah semua service tidak lagi import Supabase.
5. Pindahkan upload file dari Supabase Storage ke storage lokal backend atau object storage lain.

## Phase Pengerjaan

### Phase 0 - Freeze Kontrak UI

Tujuan: memastikan page/component React tidak ikut dibongkar besar-besaran.

- Pertahankan kontrak return di `docs/service-contracts.md`.
- Pastikan semua akses data dari UI lewat `src/services/*`.
- Jangan ubah layout/page kecuali ada kontrak service yang benar-benar perlu berubah.

Output:

- Daftar endpoint final.
- Kontrak request/response per service.
- Baseline build frontend.

### Phase 1 - Fondasi Backend Node.js

Tujuan: backend Node.js siap menerima request dari frontend.

- Pakai `backend/` sebagai aplikasi backend.
- Pakai Express untuk HTTP API.
- Pakai `pg` untuk koneksi langsung ke PostgreSQL.
- Tambahkan middleware CORS, JSON parser, error handler, dan health check.
- Simpan credential database di `backend/.env`.

Output:

- `GET /api/health`
- `GET /api/health/db`
- Struktur module backend: auth, users, vessels, discharge, reports, storage.

### Phase 2 - Schema PostgreSQL Murni

Tujuan: mengganti ketergantungan Supabase Auth/Storage/Database menjadi PostgreSQL biasa.

- Jalankan `backend/db/schema.postgres.sql`.
- Ganti konsep `profiles -> auth.users` menjadi `app_users`.
- Simpan password sebagai `password_hash`, bukan plain text.
- Pertahankan tabel operasional: destinations, vessels, vessel_destinations, hatch_cargo, checker_assignments, discharge_entries.
- Buat seed admin pertama.

Output:

- Database PostgreSQL lokal/dev siap.
- Admin user pertama bisa dibuat.

### Phase 3 - Auth Backend

Tujuan: login tidak lagi memakai Supabase Auth.

- Buat `POST /api/auth/login`.
- Login bisa pakai username atau email.
- Validasi password dengan `bcryptjs`.
- Return JWT atau cookie session.
- Buat `GET /api/auth/me`.
- Tambahkan middleware auth dan role guard.
- Buat `GET /api/users/:userId/profile` untuk menjaga kontrak `authService.getProfileByUserId`.
- Ubah `src/services/authService.js` agar memakai `apiClient`.

Output:

- Login frontend memakai backend.
- Session restore memakai backend.
- Supabase Auth tidak lagi dipakai.

### Phase 4 - Master Data API

Tujuan: pindahkan data yang risikonya lebih kecil dulu.

- Migrasi `userService`.
- Migrasi destinations.
- Implement endpoint user, destination, vessel dasar.
- Implement relasi minimum vessel destination, hatch cargo, dan checker assignment agar halaman Vessel Data tetap bisa dipakai.

Output:

- User Management dari backend.
- Vessel Data dasar dari backend.
- Destination dari backend.

### Phase 5 - Vessel Detail, Hatch Cargo, Checker Assignment

Tujuan: menyelesaikan bagian operasional vessel.

- Endpoint detail vessel per id.
- Endpoint vessel destinations.
- Endpoint add/deactivate destination kapal.
- Endpoint hatch cargo per vessel dan beberapa vessel.
- Endpoint delete extra hatch cargo.
- Endpoint checker profiles.
- Endpoint checker assignment per vessel dan beberapa vessel.
- Selesaikan migrasi `vesselService.js`.

Output:

- Final Stowage Plan memakai backend.
- Checker assignment memakai backend.
- `vesselService.js` tidak lagi pakai Supabase.

### Phase 6 - Discharge Input API

Tujuan: pindahkan transaksi utama input checker.

- Migrasi assigned vessels untuk checker.
- Migrasi create/update discharge entry.
- Migrasi filter dan pagination input history/monitoring.
- Tangani duplicate delivery order dan scale ticket di backend.

Output:

- Input discharge tidak lagi query Supabase dari frontend.
- Validasi transaksi utama berada di backend.

### Phase 7 - Report API

Tujuan: pindahkan query report yang paling berat ke backend.

- Migrasi dashboard dataset.
- Migrasi running report.
- Migrasi destination summary.
- Migrasi shift report.
- Migrasi period two hour report.
- Migrasi truck duration report.

Output:

- Frontend hanya menerima data report siap tampil.
- Query agregasi berada di backend/PostgreSQL.

### Phase 8 - File Upload

Tujuan: mengganti Supabase Storage.

- Gunakan local disk backend sebagai storage awal.
- Buat `POST /api/storage/barcode-receipts`.
- Simpan metadata file di `discharge_entries.barcode_photo_url` atau tabel file terpisah.
- Batasi ukuran dan tipe file.
- Sajikan file melalui `/uploads`.

Output:

- Upload foto barcode/receipt lewat backend.
- Frontend tidak lagi memakai Supabase Storage.

### Phase 9 - Cleanup Supabase

Tujuan: benar-benar menghapus Supabase dari runtime aplikasi.

- Hapus import `./supabase/client.js` dari semua service frontend.
- Hapus `src/services/supabase/client.js`.
- Hapus dependency frontend `@supabase/supabase-js`.
- Hapus env `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
- Hapus folder arsip Supabase lama setelah cutover database selesai.

Output:

- Runtime aplikasi menjadi React -> Node.js -> PostgreSQL.
- Tidak ada Supabase SDK di frontend maupun backend.

### Phase 10 - Hardening & Deploy

Tujuan: siap production.

- Tambahkan request validation.
- Tambahkan rate limit untuk login.
- Tambahkan audit log untuk create/update/delete penting.
- Tambahkan backup PostgreSQL.
- Tambahkan migration runner.
- Pisahkan env dev/staging/production.

Output:

- Backend siap deploy.
- Database punya backup dan migration path yang jelas.

Status implementasi:

- Selesai di `docs/phase-10-hardening-deploy.md`.

## Catatan Auth

Karena Supabase Auth dihapus, user aplikasi disimpan di tabel `app_users` dengan `password_hash`.
Backend perlu endpoint login yang melakukan:

- cari user berdasarkan `email` atau `username`;
- validasi `password` dengan `bcryptjs`;
- return JWT atau cookie session;
- frontend menyimpan session sesuai strategi yang dipilih.
