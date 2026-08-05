# Running Discharge Report System

React frontend dan Node.js backend untuk Running Discharge Report System.

## Arsitektur

```txt
frontend (React) -> backend (Node.js REST API) -> PostgreSQL
```

Supabase tidak lagi dipakai sebagai runtime backend aplikasi. Arsip folder Supabase lama sudah dihapus dari repository.

## Teknologi

- React.js
- Vite
- JavaScript
- Tailwind CSS
- react-router-dom
- Node.js
- Express
- PostgreSQL

## Menjalankan Frontend

```bash
npm --prefix frontend install
npm run dev:fe
```

Frontend memakai:

```txt
VITE_API_BASE_URL=http://localhost:4000/api
```

## Menjalankan Backend

```bash
npm --prefix backend install
cd backend
copy .env.example .env
npm run dev
```

Atau dari root project:

```bash
npm run dev:backend
```

## Database

Jalankan migration incremental untuk database yang sudah ada:

```bash
npm run db:migrate
```

Jalankan schema PostgreSQL:

```bash
npm run db:schema
```

Seed admin pertama:

```powershell
$env:ADMIN_PASSWORD='ChangeMe123!'
npm run db:seed-admin
```

Backup PostgreSQL:

```bash
npm run db:backup
```

Backend menyediakan health check:

```txt
GET /api/health
GET /api/health/db
GET /api/health/ready
```

## Dokumentasi

- [Panduan penggunaan sistem](docs/panduan-penggunaan-sistem.md)
- [Arsitektur backend PostgreSQL](docs/backend-postgres-architecture.md)
- [Kontrak service/API](docs/service-contracts.md)
- [Dokumentasi fitur dan checklist blackbox testing](docs/feature-documentation-and-blackbox-testing.md)
