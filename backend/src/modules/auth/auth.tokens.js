import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { createHttpError } from '../../utils/httpError.js'

function getJwtSecret() {
  if (!env.jwtSecret) {
    throw createHttpError(503, 'JWT_SECRET belum dikonfigurasi.')
  }

  return env.jwtSecret
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      email: user.email || '',
      role: user.role,
      username: user.username || '',
    },
    getJwtSecret(),
    {
      expiresIn: env.jwtExpiresIn,
      subject: user.id,
    },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret())
}
