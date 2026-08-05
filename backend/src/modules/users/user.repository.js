import { query } from '../../config/database.js'

const publicUserSelect = `
  id,
  full_name,
  email,
  username,
  role,
  is_active,
  created_at,
  updated_at
`

function parseIsActiveFilter(value) {
  if (value === undefined) return null
  return ['1', 'true', 'yes', 'active'].includes(String(value).toLowerCase())
}

export async function listUsers({ role, isActive } = {}) {
  const filters = []
  const params = []
  const activeFilter = parseIsActiveFilter(isActive)

  if (role) {
    params.push(role)
    filters.push(`role = $${params.length}`)
  }

  if (activeFilter !== null) {
    params.push(activeFilter)
    filters.push(`is_active = $${params.length}`)
  }

  const result = await query(
    `
      select ${publicUserSelect}
      from public.app_users
      ${filters.length ? `where ${filters.join(' and ')}` : ''}
      order by created_at desc
    `,
    params,
  )

  return result.rows
}

export async function findUserById(userId) {
  const result = await query(
    `
      select ${publicUserSelect}
      from public.app_users
      where id = $1
      limit 1
    `,
    [userId],
  )

  return result.rows[0] || null
}

export async function findUserByLoginIdentifier(identifier) {
  const cleanIdentifier = String(identifier || '').trim().toLowerCase()

  const result = await query(
    `
      select
        ${publicUserSelect},
        password_hash
      from public.app_users
      where lower(email) = $1 or lower(username) = $1
      limit 1
    `,
    [cleanIdentifier],
  )

  return result.rows[0] || null
}

export async function createUser(payload) {
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
      values ($1, $2, $3, $4, $5, $6)
      returning ${publicUserSelect}
    `,
    [
      payload.fullName,
      payload.email,
      payload.username,
      payload.passwordHash,
      payload.role,
      payload.isActive,
    ],
  )

  return result.rows[0]
}

export async function updateUser(userId, payload) {
  const result = await query(
    `
      update public.app_users
      set
        full_name = $2,
        email = $3,
        username = $4,
        role = $5,
        is_active = $6
      where id = $1
      returning ${publicUserSelect}
    `,
    [
      userId,
      payload.fullName,
      payload.email,
      payload.username,
      payload.role,
      payload.isActive,
    ],
  )

  return result.rows[0] || null
}

export async function updateUserPassword(userId, passwordHash) {
  const result = await query(
    `
      update public.app_users
      set password_hash = $2
      where id = $1
      returning ${publicUserSelect}
    `,
    [userId, passwordHash],
  )

  return result.rows[0] || null
}
