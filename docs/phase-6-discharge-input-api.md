# Phase 6 Discharge Input API

Tujuan Phase 6: memindahkan transaksi utama input discharge dari Supabase SDK ke backend Node.js/PostgreSQL.

## Endpoint Yang Diimplementasikan

Assigned vessels checker:

```txt
GET /api/discharge/checker/:checkerId/assigned-vessels
```

Discharge entries:

```txt
GET  /api/discharge/checker/:checkerId/entries
GET  /api/vessels/:vesselId/discharge-entries
POST /api/discharge/entries
PUT  /api/discharge/entries/:entryId
```

## Query Filter

Endpoint list entries menerima query:

```txt
page
pageSize
vesselId
searchTerm
hatchCargoId
destinationId
gateOutDate
```

## Backend Files

```txt
backend/src/modules/discharge/discharge.controller.js
backend/src/modules/discharge/discharge.mapper.js
backend/src/modules/discharge/discharge.repository.js
backend/src/modules/discharge/discharge.routes.js
backend/src/modules/vessels/vessel.routes.js
```

## Frontend Files

```txt
src/services/dischargeService.js
```

`dischargeService` sekarang memakai `apiClient`, bukan Supabase SDK.

## Response Shape

Backend mengembalikan discharge entry dalam bentuk camelCase yang sudah siap dipakai UI:

```txt
vesselId
hatchCargoId
destinationId
checkerId
checkerName
plateNumber
deliveryOrderNumber
scaleTicketNumber
gateInDate
gateInTime
gateOutDate
gateOutTime
barcodePhotoUrl
createdAt
updatedAt
```

## Auth

- Semua endpoint membutuhkan login.
- `POST /api/discharge/entries` butuh role `admin` atau `checker`.
- `PUT /api/discharge/entries/:entryId` butuh role `admin` atau `checker`.
- Checker hanya boleh memakai `checkerId` miliknya sendiri pada endpoint checker dan mutation.

## Error Duplicate

Constraint PostgreSQL tetap dipetakan oleh frontend:

```txt
discharge_entries_delivery_order_per_vessel_unique
discharge_entries_scale_ticket_per_vessel_unique
```

Frontend menampilkan pesan:

```txt
No Surat Jalan sudah digunakan untuk kapal ini.
No SJ Timbangan sudah digunakan untuk kapal ini.
```

## Batas Phase 6

Upload foto masih memakai service storage lama sampai Phase 8.

## Exit Criteria Phase 6

Phase 6 selesai jika:

- `dischargeService` tidak lagi import Supabase.
- Assigned vessels checker memakai backend.
- List entries checker/vessel memakai backend.
- Create/update discharge entry memakai backend.
- Filter dan pagination tersedia di backend.
- Frontend build berhasil.
