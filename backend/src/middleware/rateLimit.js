import { createHttpError } from '../utils/httpError.js'

const buckets = new Map()

function getClientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export function createRateLimiter({ maxRequests, windowMs, message }) {
  return function rateLimiter(req, res, next) {
    const now = Date.now()
    const key = getClientKey(req)
    const current = buckets.get(key)

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      next()
      return
    }

    current.count += 1
    buckets.set(key, current)

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(retryAfterSeconds))
      next(createHttpError(429, message || 'Terlalu banyak request. Coba lagi nanti.'))
      return
    }

    next()
  }
}
