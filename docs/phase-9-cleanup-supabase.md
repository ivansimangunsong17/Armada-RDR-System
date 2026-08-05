# Phase 9 Cleanup Supabase

Tujuan Phase 9: menghapus Supabase dari runtime aplikasi setelah frontend service sudah memakai backend Node.js.

## Yang Dihapus Dari Runtime

```txt
@supabase/supabase-js
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
src/services/supabase/client.js
```

## Yang Dihapus Dari Repository

Folder arsip Supabase lama sudah dihapus dari repository:

```txt
legacy/supabase/
```

Jika referensi lama dibutuhkan lagi, ambil dari Git history atau backup eksternal sebelum migrasi.

## Runtime Setelah Cleanup

```txt
React frontend -> Node.js REST API -> PostgreSQL
```

Frontend sekarang hanya membutuhkan:

```txt
VITE_API_BASE_URL=http://localhost:4000/api
```

Backend membutuhkan env di:

```txt
backend/.env
```

## Catatan Dokumentasi Lama

Beberapa dokumen historis masih menyebut Supabase karena memang mendokumentasikan sistem lama atau requirement awal. Dokumen runtime aktif adalah:

```txt
docs/backend-postgres-architecture.md
docs/service-contracts.md
docs/phase-*.md
```

## Exit Criteria Phase 9

Phase 9 selesai jika:

- Dependency Supabase SDK hilang dari `package.json`.
- Env Supabase hilang dari `.env.example`.
- Client Supabase frontend dihapus.
- Tidak ada import Supabase di `src/`.
- Frontend build berhasil.
