# Phase 1 Backend Foundation

Tujuan Phase 1: menyiapkan backend Node.js yang bisa menerima request dari React dan membuka koneksi langsung ke PostgreSQL.

## Struktur Yang Dibuat

```txt
backend/
  package.json
  .env.example
  src/
    app.js
    server.js
    config/
      env.js
      database.js
    middleware/
      errorHandler.js
      notFound.js
    modules/
      auth/
      destinations/
      discharge/
      health/
      reports/
      storage/
      users/
      vessels/
    routes/
      index.js
```

## Runtime

Backend memakai:

```txt
Node.js
Express
pg
dotenv
cors
morgan
jsonwebtoken
bcryptjs
nodemon
```

## Script

Dari root project:

```bash
npm run dev:backend
npm run start:backend
```

Dari folder `backend/`:

```bash
npm run dev
npm start
```

## Environment

Contoh env ada di:

```txt
backend/.env.example
```

Field utama:

```txt
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgres://postgres:postgres@localhost:5432/running_discharge_system
DATABASE_SSL=false
JWT_SECRET=change-this-secret
```

## Endpoint Foundation

Endpoint yang sudah aktif:

```txt
GET /api/health
GET /api/health/db
```

Endpoint module lain sudah disiapkan sebagai placeholder `501 Not Implemented`:

```txt
/api/auth
/api/users
/api/vessels
/api/destinations
/api/discharge
/api/reports
/api/storage
```

## Exit Criteria Phase 1

Phase 1 selesai jika:

- Dependency backend terpasang di `backend/package-lock.json`.
- Backend bisa di-import tanpa syntax error.
- `GET /api/health` mengembalikan status `ok`.
- Route tidak dikenal mengembalikan `404`.
- Route module yang belum dimigrasi mengembalikan `501`.
- Root project punya script untuk menjalankan backend.

## Catatan Lanjut

`GET /api/health/db` membutuhkan PostgreSQL aktif dan `DATABASE_URL` valid. Validasi koneksi database penuh dikerjakan setelah Phase 2 membuat schema PostgreSQL murni.
