import { findUserById } from '../users/user.repository.js'
import { mapUserProfile } from '../users/user.mapper.js'
import { verifyAccessToken } from './auth.tokens.js'
import { createHttpError } from '../../utils/httpError.js'

function getBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

export async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req)

    if (!token) {
      throw createHttpError(401, 'Token auth tidak ditemukan.')
    }

    const payload = verifyAccessToken(token)
    const user = await findUserById(payload.sub)

    if (!user) {
      throw createHttpError(401, 'User tidak ditemukan.')
    }

    if (!user.is_active) {
      throw createHttpError(403, 'Akun tidak aktif.')
    }

    req.auth = {
      token,
      tokenPayload: payload,
      user: mapUserProfile(user),
    }

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(createHttpError(401, 'Session sudah kedaluwarsa. Silakan login kembali.'))
      return
    }

    if (error.name === 'JsonWebTokenError') {
      next(createHttpError(401, 'Token auth tidak valid.'))
      return
    }

    next(error)
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth?.user) {
      next(createHttpError(401, 'User belum terautentikasi.'))
      return
    }

    if (!roles.includes(req.auth.user.role)) {
      next(createHttpError(403, 'Role tidak memiliki akses.'))
      return
    }

    next()
  }
}
