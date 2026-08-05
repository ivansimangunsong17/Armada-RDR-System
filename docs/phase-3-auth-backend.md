# Phase 3 Auth Backend

Tujuan Phase 3: memindahkan login dari Supabase Auth ke backend Node.js dengan tabel `app_users` di PostgreSQL.

## Strategi Session

Phase ini memakai JWT Bearer token.

Frontend menyimpan token di:

```txt
localStorage:rdrs_auth_token
```

Backend membaca token dari header:

```txt
Authorization: Bearer <token>
```

## Backend Endpoint

Endpoint yang sudah diimplementasikan:

```txt
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
GET  /api/users/:userId/profile
```

## Login Request

```js
{
  identifier: string,
  password: string,
}
```

`identifier` bisa berupa username atau email.

## Login Response

```js
{
  user: {
    id: string,
    email: string,
    username: string,
    role: 'admin' | 'checker' | 'viewer',
  },
  profile: {
    id: string,
    full_name: string,
    email: string,
    username: string,
    role: 'admin' | 'checker' | 'viewer',
    is_active: boolean,
    created_at: string | null,
    updated_at: string | null,
  },
  session: {
    access_token: string,
    token_type: 'bearer',
    expires_at: number | null,
    user: AuthUser,
  },
}
```

## Backend Files

```txt
backend/src/modules/auth/auth.controller.js
backend/src/modules/auth/auth.mapper.js
backend/src/modules/auth/auth.middleware.js
backend/src/modules/auth/auth.routes.js
backend/src/modules/auth/auth.tokens.js
backend/src/modules/users/user.controller.js
backend/src/modules/users/user.mapper.js
backend/src/modules/users/user.repository.js
```

## Frontend Files

```txt
src/services/apiClient.js
src/services/authService.js
```

`authService` tetap mempertahankan kontrak lama agar `App.jsx` tidak perlu dibongkar.

## Environment

Backend membutuhkan:

```txt
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=8h
DATABASE_URL=postgres://postgres:postgres@localhost:5432/running_discharge_system
```

Frontend membutuhkan:

```txt
VITE_API_BASE_URL=http://localhost:4000/api
```

## Role Guard

Middleware `requireRole(...roles)` sudah tersedia di:

```txt
backend/src/modules/auth/auth.middleware.js
```

Middleware ini belum banyak dipasang ke route lain karena module users/vessels/discharge/report baru dimigrasi pada phase berikutnya.

## Exit Criteria Phase 3

Phase 3 selesai jika:

- `POST /api/auth/login` tersedia.
- `GET /api/auth/me` tersedia dan butuh token.
- `POST /api/auth/logout` tersedia dan butuh token.
- `GET /api/users/:userId/profile` tersedia dan butuh token.
- Frontend `authService` tidak lagi memakai Supabase Auth.
- `apiClient` bisa menyimpan dan mengirim JWT.

## Catatan Lanjut

Login sukses membutuhkan database Phase 2 sudah dijalankan dan admin pertama sudah dibuat dengan:

```bash
npm --prefix backend run db:schema
$env:ADMIN_PASSWORD='ChangeMe123!'; npm --prefix backend run db:seed-admin
```
