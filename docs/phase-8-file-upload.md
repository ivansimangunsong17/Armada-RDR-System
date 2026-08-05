# Phase 8 File Upload

Tujuan Phase 8: mengganti Supabase Storage untuk upload foto barcode/receipt dengan backend Node.js.

## Endpoint

```txt
POST /api/storage/barcode-receipts
```

Request memakai `multipart/form-data`:

```txt
checkerId
deliveryOrderNumber
vesselId
file
```

Response tetap mengikuti kontrak lama:

```js
{
  data: {
    path: string,
    publicUrl: string,
  }
}
```

## Backend Files

```txt
backend/src/config/storage.js
backend/src/modules/storage/storage.controller.js
backend/src/modules/storage/storage.routes.js
backend/src/modules/storage/storage.upload.js
```

## Frontend Files

```txt
src/services/storageService.js
```

`storageService` sekarang memakai `apiClient` dan `FormData`, bukan Supabase Storage.

## Storage Lokal

Default lokasi file:

```txt
backend/uploads/barcode-receipts/:vesselId/:checkerId/:deliveryOrderNumber/:fileName
```

File disajikan secara public melalui:

```txt
/uploads/...
```

Folder upload diabaikan git:

```txt
backend/uploads/
```

## Environment

```txt
FILE_STORAGE_DIR=uploads
PUBLIC_BASE_URL=http://localhost:4000
```

Jika `PUBLIC_BASE_URL` kosong, backend membangun URL dari request host.

## Validasi File

Format yang diterima:

```txt
JPG
PNG
WEBP
HEIC
HEIF
```

Batas ukuran:

```txt
8 MB
```

## Auth

Endpoint upload membutuhkan user login.

## Exit Criteria Phase 8

Phase 8 selesai jika:

- `storageService` tidak lagi import Supabase.
- Endpoint upload backend tersedia.
- File disimpan di backend storage lokal.
- Public URL dikembalikan ke frontend.
- Folder upload tidak masuk git.
- Frontend build berhasil.
