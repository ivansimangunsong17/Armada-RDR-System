import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../../.env')

dotenv.config({ path: envPath })

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function parseCorsOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export const env = {
  backupDir: process.env.BACKUP_DIR || 'backups',
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN || 'http://localhost:5173'),
  databaseSsl: parseBoolean(process.env.DATABASE_SSL, false),
  databaseUrl: process.env.DATABASE_URL || '',
  fileStorageDir: process.env.FILE_STORAGE_DIR || 'uploads',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtSecret: process.env.JWT_SECRET || '',
  loginRateLimitMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 5),
  loginRateLimitWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
}

export const isProduction = env.nodeEnv === 'production'

export function assertProductionEnv() {
  if (!isProduction) return

  const errors = []

  if (!env.databaseUrl) errors.push('DATABASE_URL wajib diisi.')
  if (!env.jwtSecret || env.jwtSecret === 'change-this-secret' || env.jwtSecret.length < 32) {
    errors.push('JWT_SECRET production wajib unik dan minimal 32 karakter.')
  }
  if (!env.publicBaseUrl) errors.push('PUBLIC_BASE_URL wajib diisi.')
  if (!env.corsOrigins.length || env.corsOrigins.some((origin) => origin.includes('localhost'))) {
    errors.push('CORS_ORIGIN production wajib berisi origin frontend production.')
  }

  if (errors.length) {
    throw new Error(`Konfigurasi production tidak valid: ${errors.join(' ')}`)
  }
}
