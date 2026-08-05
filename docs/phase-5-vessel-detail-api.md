# Phase 5 Vessel Detail API

Tujuan Phase 5: menyelesaikan API operasional detail vessel, termasuk destination per vessel, Final Stowage Plan, dan checker assignment.

## Endpoint Yang Diimplementasikan

Vessel detail:

```txt
GET /api/vessels/:vesselId
```

Vessel destinations:

```txt
GET    /api/vessels/:vesselId/destinations
GET    /api/vessels/:vesselId/destinations?isActive=true
POST   /api/vessels/:vesselId/destinations
DELETE /api/vessels/:vesselId/destinations/:destinationId
```

Hatch cargo:

```txt
GET    /api/hatch-cargo?vesselIds=id1,id2
GET    /api/vessels/:vesselId/hatch-cargo
PUT    /api/vessels/:vesselId/hatch-cargo
DELETE /api/vessels/:vesselId/hatch-cargo/extra?totalHatch=5
```

Checker assignment:

```txt
GET /api/checker-assignments?vesselIds=id1,id2
GET /api/vessels/:vesselId/checker-assignment
PUT /api/vessels/:vesselId/checker-assignment
```

## Backend Files

```txt
backend/src/modules/vessels/vessel.controller.js
backend/src/modules/vessels/vessel.repository.js
backend/src/modules/vessels/vessel.routes.js
backend/src/modules/hatchCargo/hatchCargo.routes.js
backend/src/modules/checkerAssignments/checkerAssignment.routes.js
```

## Frontend Files

```txt
src/services/vesselService.js
```

Kontrak lama tetap tersedia:

```txt
vesselService.getVesselDestinations
vesselService.getActiveDestinations
vesselService.addDestination
vesselService.deactivateDestination
vesselService.getHatchCargoByVesselIds
vesselService.saveHatchCargo
vesselService.deleteExtraHatchCargo
vesselService.getCheckerAssignmentsByVesselIds
vesselService.saveCheckerAssignment
```

Helper baru yang tersedia:

```txt
vesselService.getById
vesselService.getHatchCargoByVesselId
vesselService.getCheckerAssignmentByVesselId
```

## Aturan Bisnis

- Satu vessel hanya punya satu active checker assignment.
- Saat checker assignment baru disimpan, assignment active lama pada vessel tersebut dinonaktifkan dalam transaction.
- Hatch cargo disimpan dengan upsert berdasarkan `(vessel_id, hatch_no)`.
- Extra hatch cargo bisa dihapus berdasarkan `totalHatch`.
- Destination vessel bisa dinonaktifkan tanpa menghapus master destination.

## Auth

Read endpoint membutuhkan user login. Write endpoint membutuhkan role `admin`.

## Exit Criteria Phase 5

Phase 5 selesai jika:

- Endpoint detail vessel tersedia.
- Endpoint vessel destinations tersedia.
- Endpoint hatch cargo tersedia.
- Endpoint checker assignment tersedia.
- `vesselService` punya wrapper untuk semua endpoint tersebut.
- Frontend build berhasil.
