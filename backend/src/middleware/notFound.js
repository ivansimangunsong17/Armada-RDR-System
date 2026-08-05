import { createHttpError } from '../utils/httpError.js'

export function notFound(req, res, next) {
  next(createHttpError(404, `Route ${req.method} ${req.originalUrl} tidak ditemukan.`))
}
