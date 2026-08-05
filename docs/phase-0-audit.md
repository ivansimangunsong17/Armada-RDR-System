# Phase 0 Audit

Tujuan Phase 0: membekukan kontrak UI dan membuat daftar pekerjaan migrasi sebelum implementasi backend Node.js -> PostgreSQL dilanjutkan.

## Status Struktur Saat Ini

Arsitektur runtime saat ini masih:

```txt
React frontend -> Supabase SDK -> Supabase Auth/Database/Storage
```

Target runtime:

```txt
React frontend -> Node.js REST API -> PostgreSQL
```

UI sudah cukup siap dimigrasi karena page/component memanggil service layer di `src/services/*`.

## Frontend Entry Points

File UI yang bergantung ke service data:

```txt
src/App.jsx                         -> authService
src/pages/UserManagementPage.jsx    -> userService
src/pages/VesselDataPage.jsx        -> vesselService, archiveService
src/pages/DestinationPage.jsx       -> vesselService
src/pages/StowagePlanPage.jsx       -> vesselService
src/pages/DischargeInputPage.jsx    -> dischargeService, storageService
src/pages/InputHistoryPage.jsx      -> dischargeService, storageService
src/pages/InputMonitoringPage.jsx   -> dischargeService, reportService, vesselService, storageService
src/pages/DashboardPage.jsx         -> reportService
src/pages/RunningReportPage.jsx     -> reportService
src/pages/ShiftReportPage.jsx       -> reportService
src/pages/PeriodReportPage.jsx      -> reportService
src/pages/TruckDurationReportPage.jsx -> reportService
```

Keputusan freeze:

- Page dan component tidak menjadi target perubahan besar saat migrasi.
- Perubahan utama dilakukan di `src/services/*`.
- Export service yang sudah dipakai UI harus tetap tersedia sampai migrasi selesai.

## Service Yang Perlu Dimigrasi

Service runtime yang masih menyentuh Supabase:

```txt
src/services/authService.js
src/services/userService.js
src/services/vesselService.js
src/services/dischargeService.js
src/services/reportService.js
src/services/storageService.js
src/services/supabase/client.js
```

Service frontend-only yang tidak perlu dipindah ke backend pada fase awal:

```txt
src/services/archiveService.js
src/services/excelExportService.js
src/services/pdfExportService.js
```

## Supabase Touchpoints

Runtime Supabase yang masih aktif:

```txt
@supabase/supabase-js                 -> package.json
VITE_SUPABASE_URL                     -> .env.example
VITE_SUPABASE_ANON_KEY                -> .env.example
src/services/supabase/client.js       -> Supabase client frontend
supabase.auth.signInWithPassword      -> authService
supabase.auth.getSession              -> authService
supabase.auth.signOut                 -> authService
supabase.functions.invoke             -> userService create user
supabase.storage.from                 -> storageService upload/public URL
supabase.from/rpc                     -> auth/user/vessel/discharge/report services
```

Keputusan freeze:

- Jangan hapus Supabase dulu pada Phase 0.
- Supabase hanya dicatat sebagai dependency legacy.
- Penghapusan dilakukan pada Phase 9 setelah semua service sudah memakai backend.

## API Contract Source Of Truth

Dokumen kontrak utama:

```txt
docs/service-contracts.md
```

Dokumen arsitektur phase:

```txt
docs/backend-postgres-architecture.md
```

Keputusan freeze:

- Backend harus mengikuti response shape yang ada di `docs/service-contracts.md`.
- Jika backend memakai snake_case dari PostgreSQL, mapping ke camelCase dilakukan sebelum response dikirim ke frontend.
- Error backend dikembalikan dalam format yang bisa dipetakan oleh service frontend menjadi `Error`.

## Endpoint Grouping

Endpoint dikelompokkan berdasarkan domain:

```txt
/api/auth
/api/users
/api/vessels
/api/destinations
/api/hatch-cargo
/api/checker-assignments
/api/discharge
/api/reports
/api/storage
```

Catatan implementasi:

- `authService` dimigrasi lebih awal karena semua request berikutnya butuh identitas user.
- `vesselService` cukup besar, jadi boleh dipecah antara Phase 4 dan Phase 5.
- `reportService` dikerjakan setelah transaksi discharge stabil karena banyak report bergantung pada data discharge.

## Exit Criteria Phase 0

Phase 0 dianggap selesai jika:

- Semua UI entry point yang memanggil service sudah terdata.
- Semua service yang masih bergantung ke Supabase sudah terdata.
- Kontrak return service sudah terdokumentasi.
- Mapping service -> endpoint backend sudah terdokumentasi.
- Strategi phase sudah terdokumentasi.

## Rekomendasi Instruksi Lanjut

Gunakan salah satu instruksi berikut untuk melanjutkan:

```txt
kerjakan phase 1
kerjakan phase 2
kerjakan phase 1 dan 2
lanjut phase 3
```
