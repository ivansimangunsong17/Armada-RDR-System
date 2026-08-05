# Phase 10 Hardening & Deploy

Tujuan Phase 10: membuat backend lebih siap untuk staging/production setelah migrasi runtime ke Node.js dan PostgreSQL.

## Yang Ditambahkan

- Security headers dasar di semua response backend.
- Validasi request untuk login, user, destination, vessel, hatch cargo, checker assignment, dan discharge entry.
- Rate limit endpoint login berbasis IP.
- Audit log untuk request sukses `POST`, `PUT`, `PATCH`, dan `DELETE`.
- Tabel `audit_logs` di schema PostgreSQL.
- Migration runner berbasis folder `backend/db/migrations`.
- Script backup PostgreSQL berbasis `pg_dump`.
- Contoh env terpisah untuk development, staging, dan production.
- Readiness endpoint `GET /api/health/ready`.

## Command Operasional

Jalankan migration incremental:

```bash
npm run db:migrate
```

Jalankan schema penuh untuk database baru:

```bash
npm run db:schema
```

Buat backup PostgreSQL:

```bash
npm run db:backup
```

Seed admin pertama:

```powershell
$env:ADMIN_PASSWORD='ChangeMe123!'
npm run db:seed-admin
```

## Env

Frontend:

```txt
.env.example
.env.production.example
```

Backend:

```txt
backend/.env.development.example
backend/.env.staging.example
backend/.env.production.example
```

Untuk production, backend akan menolak start jika:

- `DATABASE_URL` kosong.
- `JWT_SECRET` masih default, kosong, atau kurang dari 32 karakter.
- `PUBLIC_BASE_URL` kosong.
- `CORS_ORIGIN` masih mengarah ke localhost.

## Backup

Script backup membutuhkan `pg_dump` tersedia di PATH server.

Output backup masuk ke:

```txt
backend/backups/
```

Folder backup tidak di-track Git.

## Audit Log

Audit log disimpan di tabel:

```txt
public.audit_logs
```

Yang dicatat:

- user yang melakukan aksi jika request memakai JWT;
- action;
- entity;
- method;
- path;
- status code;
- IP;
- user agent;
- metadata params dan query.

Body request tidak dicatat agar password, token, dan payload sensitif tidak masuk audit log.

## Exit Criteria Phase 10

- Build frontend berhasil.
- Syntax backend valid.
- Endpoint login memiliki rate limit.
- Mutation penting masuk audit log setelah schema/migration dijalankan.
- Database punya command migration dan backup.
- Env production punya guard sebelum server start.
