# Phase 4 Master Data API

Tujuan Phase 4: memindahkan user management, destination, dan data dasar vessel dari Supabase SDK ke backend Node.js/PostgreSQL.

## Endpoint Yang Diimplementasikan

Users:

```txt
GET  /api/users
POST /api/users
PUT  /api/users/:userId
GET  /api/users?role=checker&isActive=true
```

Destinations:

```txt
GET   /api/destinations
GET   /api/destinations/:destinationId
GET   /api/destinations/by-name/:name
POST  /api/destinations
POST  /api/destinations/resolve
PUT   /api/destinations/:destinationId
PATCH /api/destinations/:destinationId/status
```

Vessels:

```txt
GET    /api/vessels
POST   /api/vessels
PUT    /api/vessels/:vesselId
PATCH  /api/vessels/:vesselId/status
DELETE /api/vessels/:vesselId
```

Relasi minimum yang ikut dibuat agar Vessel Data bisa tetap berjalan:

```txt
GET    /api/vessels/:vesselId/destinations
POST   /api/vessels/:vesselId/destinations
DELETE /api/vessels/:vesselId/destinations/:destinationId
GET    /api/hatch-cargo?vesselIds=id1,id2
PUT    /api/vessels/:vesselId/hatch-cargo
DELETE /api/vessels/:vesselId/hatch-cargo/extra
GET    /api/checker-assignments?vesselIds=id1,id2
PUT    /api/vessels/:vesselId/checker-assignment
```

## Backend Files

```txt
backend/src/modules/users/user.controller.js
backend/src/modules/users/user.repository.js
backend/src/modules/destinations/destination.controller.js
backend/src/modules/destinations/destination.repository.js
backend/src/modules/vessels/vessel.controller.js
backend/src/modules/vessels/vessel.repository.js
backend/src/modules/hatchCargo/hatchCargo.routes.js
backend/src/modules/checkerAssignments/checkerAssignment.routes.js
```

## Frontend Files

```txt
src/services/userService.js
src/services/vesselService.js
```

Kedua service ini sekarang memakai `apiClient`, bukan Supabase SDK.

## Auth

Semua endpoint Phase 4 membutuhkan JWT dari Phase 3.

Write endpoint memakai role `admin`:

```txt
POST/PUT/PATCH/DELETE users, destinations, vessels
```

## Batas Phase 4

Phase 4 belum memigrasi:

```txt
dischargeService
reportService
storageService
```

Itu masuk Phase 6, Phase 7, dan Phase 8.

## Exit Criteria Phase 4

Phase 4 selesai jika:

- `userService` tidak lagi import Supabase.
- `vesselService` tidak lagi import Supabase.
- Endpoint user/destination/vessel tersedia di backend.
- Constraint PostgreSQL dikembalikan ke frontend dengan `error.code`.
- Frontend build berhasil.
