import pg from 'pg'
import { env } from './env.js'
import { createHttpError } from '../utils/httpError.js'

const { Pool } = pg

let pool

export function getPool() {
  if (!env.databaseUrl) {
    throw createHttpError(503, 'DATABASE_URL belum dikonfigurasi.')
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : false,
    })
  }

  return pool
}

export async function query(text, params = []) {
  return getPool().query(text, params)
}

export async function closePool() {
  if (!pool) return

  await pool.end()
  pool = null
}

export async function checkDatabaseConnection() {
  const result = await query('select 1 as ok, now() as checked_at')
  return result.rows[0]
}
