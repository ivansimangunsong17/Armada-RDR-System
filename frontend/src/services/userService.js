import { apiClient } from './apiClient.js'
import { normalizeRole } from '../utils/roles.js'

function mapProfile(row = {}) {
  return {
    id: row.id,
    fullName: row.fullName || row.full_name || '',
    email: row.email || '',
    username: row.username || '',
    role: normalizeRole(row.role || 'checker'),
    isActive: Boolean(row.isActive ?? row.is_active),
    createdAt: row.createdAt || row.created_at || '',
  }
}

export async function getUserProfiles() {
  const { data, error } = await apiClient.request('/users')

  return {
    users: (data?.users || []).map(mapProfile),
    error,
  }
}

export async function createUserProfile(payload) {
  const { data, error } = await apiClient.request('/users', {
    body: JSON.stringify(payload),
    method: 'POST',
  })

  return {
    user: data?.user ? mapProfile(data.user) : null,
    error,
  }
}

export async function updateUserProfile(userId, payload) {
  const { data, error } = await apiClient.request(`/users/${userId}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  })

  return {
    user: data?.user ? mapProfile(data.user) : null,
    error,
  }
}

export async function changeUserPassword(userId, payload) {
  const { data, error } = await apiClient.request(`/users/${userId}/password`, {
    body: JSON.stringify(payload),
    method: 'PATCH',
  })

  return {
    success: Boolean(data?.success),
    user: data?.user ? mapProfile(data.user) : null,
    error,
  }
}

export function getUserProfileMutationError(error) {
  if (!error) return null

  if (error.code === '23505') {
    const message = `${error.message || ''} ${error.constraint || ''}`

    if (message.includes('username')) {
      return new Error('Username sudah digunakan user lain.')
    }

    if (message.includes('email')) {
      return new Error('Email sudah digunakan user lain.')
    }

    return new Error('Data user sudah digunakan user lain.')
  }

  if (error.code === '23514' && (error.message || '').includes('username')) {
    return new Error('Format username tidak valid.')
  }

  if (error.message) {
    return new Error(error.message)
  }

  return error
}

export const userService = {
  changePassword: changeUserPassword,
  create: createUserProfile,
  getAll: getUserProfiles,
  getMutationError: getUserProfileMutationError,
  update: updateUserProfile,
}
