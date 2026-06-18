# Running Discharge Report System

Frontend React.js untuk Running Discharge Report System dengan Supabase.

## Teknologi

- React.js
- Vite
- JavaScript
- Tailwind CSS
- react-router-dom
- Supabase Auth, Database, dan Storage

## Menjalankan Project

```bash
npm install
npm run dev
```

## Dokumentasi

- [Dokumentasi fitur dan checklist blackbox testing](docs/feature-documentation-and-blackbox-testing.md)

## Catatan Fondasi

- Jalankan migration Supabase sebelum production, termasuk `20260612_harden_foundation_profiles_gate_in.sql`.
- Login mendukung email dan username. Username lookup memakai `profiles.username`, lalu login tetap melalui Supabase Auth email/password.
- `profiles.email` harus diisi agar user lapangan bisa login dengan username.
- User Management dapat membuat user baru melalui Supabase Edge Function `create-user`; deploy function dan pastikan secret `SUPABASE_SERVICE_ROLE_KEY` tersedia di Supabase.
- Checker assignment saat ini: satu checker bisa menangani banyak vessel, tetapi satu vessel hanya punya satu active checker.
- RLS belum diaktifkan pada tahap hardening ini.
