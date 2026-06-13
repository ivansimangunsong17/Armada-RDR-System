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

## Catatan Fondasi

- Jalankan migration Supabase sebelum production, termasuk `20260612_harden_foundation_profiles_gate_in.sql`.
- Login mendukung email dan username. Username lookup memakai `profiles.username`, lalu login tetap melalui Supabase Auth email/password.
- `profiles.email` harus diisi agar user lapangan bisa login dengan username.
- User Management Step 1 hanya mengelola profile user existing. Create user belum diaktifkan dan nanti dibuat melalui Edge Function.
- Checker assignment saat ini: satu checker bisa menangani banyak vessel, tetapi satu vessel hanya punya satu active checker.
- RLS belum diaktifkan pada tahap hardening ini.
