import { createHttpError } from './httpError.js'

export function notImplemented(featureName) {
  return () => {
    throw createHttpError(501, `${featureName} belum dimigrasi ke backend PostgreSQL.`)
  }
}
