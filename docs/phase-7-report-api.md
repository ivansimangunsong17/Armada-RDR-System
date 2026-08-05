# Phase 7 Report API

Tujuan Phase 7: memindahkan query dan agregasi report dari frontend/Supabase SDK ke backend Node.js/PostgreSQL.

## Endpoint Yang Diimplementasikan

```txt
GET /api/reports/active-vessels
GET /api/reports/dashboard
GET /api/reports/running?vesselIds=id1,id2
GET /api/reports/running-destination-summary?vesselId=id
GET /api/reports/shift?vesselId=id&reportDate=YYYY-MM-DD&shiftName=shift_1
GET /api/reports/period-two-hour?vesselId=id&reportDate=YYYY-MM-DD&periodStartHour=8&periodEndHour=10
GET /api/reports/truck-duration?vesselId=id&reportDate=YYYY-MM-DD&page=1&pageSize=20
```

## Backend Files

```txt
backend/src/modules/reports/report.controller.js
backend/src/modules/reports/report.mapper.js
backend/src/modules/reports/report.repository.js
backend/src/modules/reports/report.routes.js
backend/src/modules/reports/report.utils.js
```

## Frontend Files

```txt
src/services/reportService.js
```

`reportService` sekarang memakai `apiClient`, bukan Supabase SDK.

## Report Yang Dipindahkan

- Active vessels untuk report.
- Dashboard dataset.
- Running report per hatch.
- Running destination summary.
- Shift report.
- Period two hour report.
- Truck duration report.

## Auth

Semua endpoint report membutuhkan user login.

Role `checker` hanya menerima vessel aktif yang ditugaskan ke checker tersebut pada endpoint active-vessels dan dashboard.

## Catatan

Helper summary frontend tetap diekspor dari `reportService` supaya `archiveService`, PDF export, dan Excel export tidak ikut diubah.

## Exit Criteria Phase 7

Phase 7 selesai jika:

- `reportService` tidak lagi import Supabase.
- Semua endpoint report utama tersedia.
- Filter report utama tersedia di backend.
- Summary truck duration dihitung backend.
- Frontend build berhasil.
