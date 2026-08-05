import bcrypt from 'bcryptjs'
import { createHttpError } from '../../utils/httpError.js'
import { findUserByLoginIdentifier } from '../users/user.repository.js'
import { mapAuthResponse } from './auth.mapper.js'
import { signAccessToken } from './auth.tokens.js'

export async function login(req, res, next) {
  try {
    const identifier = String(req.body?.identifier || '').trim()
    const password = String(req.body?.password || '')

    if (!identifier || !password) {
      throw createHttpError(400, 'Username/email dan password wajib diisi.')
    }

    const user = await findUserByLoginIdentifier(identifier)

    if (!user || !user.password_hash) {
      throw createHttpError(401, 'Username/email atau password salah.')
    }

    if (!user.is_active) {
      throw createHttpError(403, 'Akun tidak aktif. Hubungi admin.')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      throw createHttpError(401, 'Username/email atau password salah.')
    }

    const token = signAccessToken(user)

    res.json(mapAuthResponse(user, token))
  } catch (error) {
    next(error)
  }
}

export function getCurrentUser(req, res) {
  res.json({
    user: {
      id: req.auth.user.id,
      email: req.auth.user.email,
      username: req.auth.user.username,
      role: req.auth.user.role,
    },
    profile: req.auth.user,
    session: {
      access_token: req.auth.token,
      token_type: 'bearer',
      user: {
        id: req.auth.user.id,
        email: req.auth.user.email,
        username: req.auth.user.username,
        role: req.auth.user.role,
      },
    },
  })
}

export function logout(req, res) {
  res.json({
    success: true,
  })
}
