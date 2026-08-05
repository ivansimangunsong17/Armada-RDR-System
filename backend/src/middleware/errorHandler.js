import { isProduction } from '../config/env.js'

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error)
    return
  }

  const statusCode =
    error.statusCode ||
    (error.name === 'MulterError' ? 400 : null) ||
    (error.code === '23505' ? 409 : null) ||
    (['23503', '23514', '22P02'].includes(error.code) ? 400 : null) ||
    500

  res.status(statusCode).json({
    code: error.code || undefined,
    constraint: error.constraint || undefined,
    error: error.message || 'Internal server error',
    details: error.details || null,
    stack: isProduction ? undefined : error.stack,
  })
}
