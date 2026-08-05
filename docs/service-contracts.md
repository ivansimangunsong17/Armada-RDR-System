# Service Contracts

Dokumen ini mencatat kontrak service frontend yang harus dipertahankan saat implementasi data dipindahkan dari Supabase ke REST API backend Node.js dan PostgreSQL.

Prinsip migrasi:

- Page dan component hanya memanggil object service.
- Detail sumber data berada di service layer.
- Backend Node.js nanti sebaiknya mengikuti kontrak ini agar UI tidak perlu dibongkar.
- Response lama dipertahankan selama migrasi untuk mengurangi risiko regresi.
- Kontrak return di bawah ini dianggap freeze untuk Phase 0 sampai seluruh service selesai dimigrasi.
- Nama field frontend tetap camelCase; backend boleh memakai snake_case di database, tetapi response API ke frontend sebaiknya sudah dipetakan.

## Auth Service

File: `src/services/authService.js`

### `authService.signInWithLoginIdentifier(identifier, password)`

Login memakai username atau email.

Return:

```js
{
  user: AuthUser | null,
  session: AuthSession | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/auth/login
```

Request:

```js
{
  identifier: string,
  password: string,
}
```

### `authService.signInWithEmailPassword(email, password)`

Tetap tersedia untuk kompatibilitas internal service, tetapi implementasi backend boleh diarahkan ke endpoint login yang sama.

Return:

```js
{
  user: AuthUser | null,
  session: AuthSession | null,
  error: Error | null,
}
```

### `authService.getCurrentSession()`

Mengambil session user saat aplikasi dibuka ulang.

Return:

```js
{
  session: AuthSession | null,
  error: Error | null,
}
```

Target API:

```txt
GET /api/auth/me
```

### `authService.getProfileByUserId(userId)`

Mengambil profile aplikasi berdasarkan user id.

Return:

```js
{
  profile: Profile | null,
  error: Error | null,
}
```

Target API:

```txt
GET /api/users/:userId/profile
```

### `authService.getProfileByUsername(username)`

Dipakai untuk login username pada implementasi Supabase lama. Pada backend Node.js, lookup username sebaiknya menjadi bagian dari `POST /api/auth/login`, sehingga method ini bisa menjadi wrapper internal atau dihapus setelah auth selesai dimigrasi.

Return:

```js
{
  profile: { email: string } | null,
  error: Error | null,
}
```

### `authService.signOut()`

Logout user aktif.

Return:

```js
{
  error: Error | null,
}
```

Target API:

```txt
POST /api/auth/logout
```

## Vessel Service

File: `src/services/vesselService.js`

### `vesselService.getAll()`

Mengambil daftar vessel aktif yang belum di-archive.

Return:

```js
{
  data: Vessel[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/vessels
```

### `vesselService.getById(vesselId)`

Mengambil satu vessel beserta destination relation.

Return:

```js
{
  data: Vessel | null,
  error: Error | null,
}
```

Target API:

```txt
GET /api/vessels/:vesselId
```

### `vesselService.create(payload)`

Membuat vessel baru.

Return:

```js
{
  data: Vessel | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/vessels
```

### `vesselService.update(vesselId, payload)`

Mengubah data vessel.

Return:

```js
{
  data: Vessel | null,
  error: Error | null,
}
```

Target API:

```txt
PUT /api/vessels/:vesselId
```

### `vesselService.changeStatus(vesselId, status)`

Mengubah status vessel.

Return:

```js
{
  data: Vessel | null,
  error: Error | null,
}
```

Target API:

```txt
PATCH /api/vessels/:vesselId/status
```

### `vesselService.archive(vesselId)`

Soft-delete atau archive vessel.

Return:

```js
{
  data: Vessel | null,
  error: Error | null,
}
```

Target API:

```txt
DELETE /api/vessels/:vesselId
```

### `vesselService.getDestinations()`

Mengambil master destination.

Return:

```js
{
  data: Destination[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/destinations
```

### `vesselService.createDestination(payload)`

Membuat destination baru.

Return:

```js
{
  data: Destination | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/destinations
```

### `vesselService.updateDestination(destinationId, payload)`

Mengubah destination.

Return:

```js
{
  data: Destination | null,
  error: Error | null,
}
```

Target API:

```txt
PUT /api/destinations/:destinationId
```

### `vesselService.changeDestinationStatus(destinationId, isActive)`

Mengaktifkan atau menonaktifkan destination.

Return:

```js
{
  data: Destination | null,
  error: Error | null,
}
```

Target API:

```txt
PATCH /api/destinations/:destinationId/status
```

### `vesselService.getDestinationById(destinationId)`

Mengambil satu destination berdasarkan id.

Return:

```js
{
  data: Destination | null,
  error: Error | null,
}
```

Target API:

```txt
GET /api/destinations/:destinationId
```

### `vesselService.getDestinationByName(name)`

Mengambil satu destination berdasarkan nama.

Return:

```js
{
  data: Destination | null,
  error: Error | null,
}
```

Target API:

```txt
GET /api/destinations/by-name/:name
```

### `vesselService.getOrCreateDestinationByName(name)`

Mengambil destination jika sudah ada atau membuat baru jika belum ada.

Return:

```js
{
  data: Destination | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/destinations/resolve
```

### `vesselService.getVesselDestinations(vesselId)`

Mengambil destination yang terhubung ke vessel.

Return:

```js
{
  data: VesselDestination[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/vessels/:vesselId/destinations
```

### `vesselService.getActiveDestinations(vesselId)`

Mengambil destination aktif untuk vessel.

Return:

```js
{
  data: VesselDestination[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/vessels/:vesselId/destinations?isActive=true
```

### `vesselService.addDestination(vesselId, destinationNameOrId, createdBy)`

Menambahkan destination ke vessel.

Return:

```js
{
  data: VesselDestination | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/vessels/:vesselId/destinations
```

### `vesselService.deactivateDestination(vesselId, destinationId)`

Menonaktifkan destination pada vessel.

Return:

```js
{
  data: VesselDestination | null,
  error: Error | null,
}
```

Target API:

```txt
DELETE /api/vessels/:vesselId/destinations/:destinationId
```

### `vesselService.getCheckerProfiles()`

Mengambil profile checker aktif untuk assignment.

Return:

```js
{
  data: UserProfile[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/users?role=checker&isActive=true
```

### `vesselService.getHatchCargoByVesselIds(vesselIds)`

Mengambil Final Stowage Plan untuk beberapa vessel.

Return:

```js
{
  data: HatchCargo[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/hatch-cargo?vesselIds=id1,id2
```

### `vesselService.getHatchCargoByVesselId(vesselId)`

Mengambil Final Stowage Plan untuk satu vessel.

Return:

```js
{
  data: HatchCargo[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/vessels/:vesselId/hatch-cargo
```

### `vesselService.getCheckerAssignmentsByVesselIds(vesselIds)`

Mengambil assignment checker aktif untuk beberapa vessel.

Return:

```js
{
  data: CheckerAssignment[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/checker-assignments?vesselIds=id1,id2&isActive=true
```

### `vesselService.getCheckerAssignmentByVesselId(vesselId)`

Mengambil active checker assignment untuk satu vessel.

Return:

```js
{
  data: CheckerAssignment | null,
  error: Error | null,
}
```

Target API:

```txt
GET /api/vessels/:vesselId/checker-assignment
```

### `vesselService.saveHatchCargo(vesselId, hatchCargoRows)`

Menyimpan Final Stowage Plan per hatch.

Return:

```js
{
  data: HatchCargo[],
  error: Error | null,
}
```

Target API:

```txt
PUT /api/vessels/:vesselId/hatch-cargo
```

### `vesselService.deleteExtraHatchCargo(vesselId, totalHatch)`

Menghapus hatch cargo yang hatch number-nya melebihi total hatch vessel.

Return:

```js
{
  error: Error | null,
}
```

Target API:

```txt
DELETE /api/vessels/:vesselId/hatch-cargo/extra?totalHatch=5
```

### `vesselService.saveCheckerAssignment(vesselId, checkerId, assignedBy)`

Menyimpan assignment checker aktif untuk vessel.

Return:

```js
{
  data: CheckerAssignment | null,
  error: Error | null,
}
```

Target API:

```txt
PUT /api/vessels/:vesselId/checker-assignment
```

## Discharge Service

File: `src/services/dischargeService.js`

### `dischargeService.getAssignedVesselsForChecker(checkerId)`

Mengambil vessel yang ditugaskan ke checker.

Return:

```js
{
  data: AssignedVessel[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/discharge/checker/:checkerId/assigned-vessels
```

### `dischargeService.getForChecker(checkerId, options)`

Mengambil input discharge milik checker.

Return:

```js
{
  data: DischargeEntry[],
  count: number,
  error: Error | null,
}
```

Options:

```js
{
  page?: number,
  pageSize?: number,
  vesselId?: string,
  searchTerm?: string,
  hatchCargoId?: string,
  destinationId?: string,
  gateOutDate?: string,
}
```

Target API:

```txt
GET /api/discharge/checker/:checkerId/entries
```

### `dischargeService.getForVessel(vesselId, options)`

Mengambil input discharge untuk vessel.

Return:

```js
{
  data: DischargeEntry[],
  count: number,
  error: Error | null,
}
```

Options:

```js
{
  page?: number,
  pageSize?: number,
  searchTerm?: string,
  hatchCargoId?: string,
  destinationId?: string,
  gateOutDate?: string,
}
```

Target API:

```txt
GET /api/vessels/:vesselId/discharge-entries
```

### `dischargeService.create(payload)`

Membuat discharge entry.

Return:

```js
{
  data: DischargeEntry | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/discharge/entries
```

### `dischargeService.update(entryId, payload)`

Mengubah discharge entry.

Return:

```js
{
  data: DischargeEntry | null,
  error: Error | null,
}
```

Target API:

```txt
PUT /api/discharge/entries/:entryId
```

### `dischargeService.getMutationError(error)`

Memetakan error constraint database menjadi pesan UI yang ramah.

Return:

```js
Error | null
```

## Report Service

File: `src/services/reportService.js`

### `reportService.getActiveVessels(currentUser)`

Mengambil vessel aktif yang bisa dilihat user.

Return:

```js
{
  data: Vessel[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/reports/active-vessels
```

### `reportService.getDataset(currentUser)`

Mengambil dataset utama dashboard dan running report.

Return:

```js
{
  vessels: Vessel[],
  runningRows: RunningReportRow[],
  latestEntries: LatestDischargeEntry[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/reports/dashboard
```

### `reportService.getRunningReport(vesselIds)`

Mengambil running report per hatch untuk satu atau beberapa vessel.

Return:

```js
{
  data: RunningReportRow[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/reports/running?vesselIds=id1,id2
```

### `reportService.getRunningDestinationSummary(vesselId)`

Mengambil summary running report per destination.

Return:

```js
{
  data: DestinationSummaryRow[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/reports/running-destination-summary?vesselId=id
```

### `reportService.getShiftReport({ vesselId, reportDate, shiftName })`

Mengambil report shift.

Return:

```js
{
  data: TimedReportRow[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/reports/shift?vesselId=id&reportDate=YYYY-MM-DD&shiftName=day
```

### `reportService.getPeriodTwoHourReport({ vesselId, reportDate, periodStartHour, periodEndHour })`

Mengambil report periode 2 jam, running position, dan destination summary.

Return:

```js
{
  data: TimedReportRow[],
  runningPosition: RunningPosition,
  destinationSummary: DestinationSummaryRow[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/reports/period-two-hour?vesselId=id&reportDate=YYYY-MM-DD&periodStartHour=1&periodEndHour=3
```

### `reportService.getTruckDurationReport({ vesselId, reportDate, page, pageSize })`

Mengambil report durasi truck.

Return:

```js
{
  data: TruckDurationRow[],
  count: number,
  summary: TruckDurationSummary,
  repeatSummary: RepeatTruckSummaryRow[],
  singleTripSummary: SingleTripTruckSummaryRow[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/reports/truck-duration?vesselId=id&reportDate=YYYY-MM-DD&page=1&pageSize=20
```

## User Service

File: `src/services/userService.js`

### `userService.getAll()`

Mengambil daftar user aplikasi.

Return:

```js
{
  users: UserProfile[],
  error: Error | null,
}
```

Target API:

```txt
GET /api/users
```

Catatan migrasi: kontrak ini masih memakai `users` agar kompatibel dengan UI saat ini. Saat migrasi lebih lanjut, dapat dipertimbangkan menjadi `{ data, error }`.

### `userService.create(payload)`

Membuat user baru.

Return:

```js
{
  user: UserProfile | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/users
```

### `userService.update(userId, payload)`

Mengubah profile user.

Return:

```js
{
  user: UserProfile | null,
  error: Error | null,
}
```

Target API:

```txt
PUT /api/users/:userId
```

### `userService.getMutationError(error)`

Memetakan error constraint database menjadi pesan UI yang ramah.

Return:

```js
Error | null
```

## Storage Service

File: `src/services/storageService.js`

### `uploadBarcodeReceiptPhoto({ checkerId, deliveryOrderNumber, file, vesselId })`

Upload foto barcode atau receipt truck.

Return:

```js
{
  data: {
    path: string,
    publicUrl: string,
  } | null,
  error: Error | null,
}
```

Target API:

```txt
POST /api/storage/barcode-receipts
```

## Future API Mapping

Mapping freeze Phase 0:

```txt
authService.signInWithLoginIdentifier          -> POST   /api/auth/login
authService.getCurrentSession                  -> GET    /api/auth/me
authService.getProfileByUserId                 -> GET    /api/users/:userId/profile
authService.signOut                            -> POST   /api/auth/logout

userService.getAll                             -> GET    /api/users
userService.create                             -> POST   /api/users
userService.update                             -> PUT    /api/users/:userId

vesselService.getAll                           -> GET    /api/vessels
vesselService.getById                          -> GET    /api/vessels/:vesselId
vesselService.create                           -> POST   /api/vessels
vesselService.update                           -> PUT    /api/vessels/:vesselId
vesselService.changeStatus                     -> PATCH  /api/vessels/:vesselId/status
vesselService.archive                          -> DELETE /api/vessels/:vesselId
vesselService.getCheckerProfiles               -> GET    /api/users?role=checker&isActive=true
vesselService.getDestinations                  -> GET    /api/destinations
vesselService.createDestination                -> POST   /api/destinations
vesselService.updateDestination                -> PUT    /api/destinations/:destinationId
vesselService.changeDestinationStatus          -> PATCH  /api/destinations/:destinationId/status
vesselService.getDestinationById               -> GET    /api/destinations/:destinationId
vesselService.getDestinationByName             -> GET    /api/destinations/by-name/:name
vesselService.getOrCreateDestinationByName     -> POST   /api/destinations/resolve
vesselService.getVesselDestinations            -> GET    /api/vessels/:vesselId/destinations
vesselService.getActiveDestinations            -> GET    /api/vessels/:vesselId/destinations?isActive=true
vesselService.addDestination                   -> POST   /api/vessels/:vesselId/destinations
vesselService.deactivateDestination            -> DELETE /api/vessels/:vesselId/destinations/:destinationId
vesselService.getHatchCargoByVesselIds         -> GET    /api/hatch-cargo?vesselIds=id1,id2
vesselService.getHatchCargoByVesselId          -> GET    /api/vessels/:vesselId/hatch-cargo
vesselService.saveHatchCargo                   -> PUT    /api/vessels/:vesselId/hatch-cargo
vesselService.deleteExtraHatchCargo            -> DELETE /api/vessels/:vesselId/hatch-cargo/extra
vesselService.getCheckerAssignmentsByVesselIds -> GET    /api/checker-assignments?vesselIds=id1,id2
vesselService.getCheckerAssignmentByVesselId    -> GET    /api/vessels/:vesselId/checker-assignment
vesselService.saveCheckerAssignment            -> PUT    /api/vessels/:vesselId/checker-assignment

dischargeService.getAssignedVesselsForChecker  -> GET    /api/discharge/checker/:checkerId/assigned-vessels
dischargeService.getForChecker                 -> GET    /api/discharge/checker/:checkerId/entries
dischargeService.getForVessel                  -> GET    /api/vessels/:vesselId/discharge-entries
dischargeService.create                        -> POST   /api/discharge/entries
dischargeService.update                        -> PUT    /api/discharge/entries/:entryId

reportService.getActiveVessels                 -> GET    /api/reports/active-vessels
reportService.getDataset                       -> GET    /api/reports/dashboard
reportService.getRunningReport                 -> GET    /api/reports/running
reportService.getRunningDestinationSummary     -> GET    /api/reports/running-destination-summary
reportService.getShiftReport                   -> GET    /api/reports/shift
reportService.getPeriodTwoHourReport           -> GET    /api/reports/period-two-hour
reportService.getTruckDurationReport           -> GET    /api/reports/truck-duration

uploadBarcodeReceiptPhoto                      -> POST   /api/storage/barcode-receipts
```

## Non-API Services

Service berikut tetap berada di frontend karena menghasilkan file dari data yang sudah dimuat UI:

```txt
archiveService.createVesselArchivePackage
excelExportService.exportRunningReportExcel
excelExportService.exportShiftReportExcel
excelExportService.exportPeriodReportExcel
excelExportService.exportInputEntriesExcel
pdfExportService.exportRunningReportPDF
pdfExportService.printRunningReportPDF
pdfExportService.exportShiftReportPDF
pdfExportService.exportPeriodReportPDF
pdfExportService.exportInputEntriesPDF
```
