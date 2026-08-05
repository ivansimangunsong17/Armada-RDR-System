import bcrypt from 'bcryptjs'
import { createHttpError } from '../../utils/httpError.js'
import { mapUserProfile } from './user.mapper.js'
import {
  createUser,
  findUserById,
  listUsers,
  updateUserPassword,
  updateUser,
} from './user.repository.js'

function mapFrontendUser(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    username: row.username,
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function normalizeUserPayload(payload = {}) {
  return {
    email: payload.email ? String(payload.email).trim().toLowerCase() : null,
    fullName: String(payload.fullName || payload.full_name || '').trim(),
    isActive: payload.isActive ?? payload.is_active ?? true,
    password: String(payload.password || ''),
    role: payload.role || 'checker',
    username: payload.username ? String(payload.username).trim().toLowerCase() : null,
  }
}

export async function getUsers(req, res, next) {
  try {
    const users = await listUsers({
      isActive: req.query.isActive,
      role: req.query.role,
    })

    res.json({
      users: users.map(mapFrontendUser),
    })
  } catch (error) {
    next(error)
  }
}

export async function createUserProfile(req, res, next) {
  try {
    const payload = normalizeUserPayload(req.body)

    if (!payload.fullName) {
      throw createHttpError(400, 'Full name wajib diisi.')
    }

    if (!payload.password) {
      throw createHttpError(400, 'Password wajib diisi.')
    }

    const passwordHash = await bcrypt.hash(payload.password, 12)
    const user = await createUser({
      ...payload,
      passwordHash,
    })

    res.status(201).json({
      user: mapFrontendUser(user),
    })
  } catch (error) {
    next(error)
  }
}

export async function getProfileByUserId(req, res, next) {
  try {
    const user = await findUserById(req.params.userId)

    if (!user) {
      throw createHttpError(404, 'Profile user tidak ditemukan.')
    }

    res.json({
      profile: mapUserProfile(user),
    })
  } catch (error) {
    next(error)
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const payload = normalizeUserPayload(req.body)

    if (!payload.fullName) {
      throw createHttpError(400, 'Full name wajib diisi.')
    }

    const user = await updateUser(req.params.userId, payload)

    if (!user) {
      throw createHttpError(404, 'User tidak ditemukan.')
    }

    res.json({
      user: mapFrontendUser(user),
    })
  } catch (error) {
    next(error)
  }
}

export async function changeUserPassword(req, res, next) {
  try {
    const password = String(req.body?.password || '')
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await updateUserPassword(req.params.userId, passwordHash)

    if (!user) {
      throw createHttpError(404, 'User tidak ditemukan.')
    }

    res.json({
      success: true,
      user: mapFrontendUser(user),
    })
  } catch (error) {
    next(error)
  }
}
