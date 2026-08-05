import bcrypt from 'bcryptjs'
import { closePool, query } from '../src/config/database.js'

function showHelp() {
  console.log(`
Seed admin pertama.

Env yang dipakai:
  ADMIN_FULL_NAME   default: Administrator
  ADMIN_EMAIL       default: admin@example.com
  ADMIN_USERNAME    default: admin
  ADMIN_PASSWORD    wajib diisi

Contoh PowerShell:
  $env:ADMIN_PASSWORD='ChangeMe123!'; npm --prefix server run db:seed-admin
`.trim())
}

function getAdminSeed() {
  return {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    fullName: process.env.ADMIN_FULL_NAME || 'Administrator',
    password: process.env.ADMIN_PASSWORD || '',
    username: process.env.ADMIN_USERNAME || 'admin',
  }
}

async function upsertAdmin({ email, fullName, password, username }) {
  if (!password) {
    throw new Error('ADMIN_PASSWORD wajib diisi untuk seed admin.')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const existing = await query(
    `
      select id
      from public.app_users
      where username = $1 or email = $2
      order by created_at asc
      limit 1
    `,
    [username, email],
  )

  if (existing.rows[0]?.id) {
    const result = await query(
      `
        update public.app_users
        set
          full_name = $2,
          email = $3,
          username = $4,
          password_hash = $5,
          role = 'admin',
          is_active = true
        where id = $1
        returning id, full_name, email, username, role, is_active
      `,
      [existing.rows[0].id, fullName, email, username, passwordHash],
    )

    return { action: 'updated', user: result.rows[0] }
  }

  const result = await query(
    `
      insert into public.app_users (
        full_name,
        email,
        username,
        password_hash,
        role,
        is_active
      )
      values ($1, $2, $3, $4, 'admin', true)
      returning id, full_name, email, username, role, is_active
    `,
    [fullName, email, username, passwordHash],
  )

  return { action: 'created', user: result.rows[0] }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp()
    return
  }

  const result = await upsertAdmin(getAdminSeed())
  console.log(`Admin ${result.action}: ${result.user.username} (${result.user.email})`)
}

main()
  .catch((error) => {
    console.error(error.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
