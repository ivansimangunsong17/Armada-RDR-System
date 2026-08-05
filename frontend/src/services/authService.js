import { apiClient } from './apiClient.js'
import { normalizeRole } from '../utils/roles.js'

export function mapProfileToCurrentUser(profile, authUser) {
  return {
    id: profile.id,
    authUserId: authUser?.id || profile.id,
    email: profile.email || authUser?.email || '',
    username: profile.username || '',
    name: profile.full_name,
    role: normalizeRole(profile.role),
    sourceRole: profile.role,
    isActive: profile.is_active,
  }
}

export async function getProfileByUserId(userId) {
  if (!userId) {
    return {
      profile: null,
      error: new Error('User id wajib diisi.'),
    }
  }

  const { data, error } = await apiClient.request(`/users/${userId}/profile`)

  return {
    profile: data?.profile || null,
    error,
  }
}

export async function getProfileByUsername(username) {
  return {
    profile: null,
    error: new Error(`Lookup username "${username}" dipindahkan ke endpoint login backend.`),
  }
}

export async function signInWithEmailPassword(email, password) {
  const { data, error } = await apiClient.request('/auth/login', {
    body: JSON.stringify({ identifier: email, password }),
    method: 'POST',
    skipAuth: true,
  })

  if (data?.session?.access_token) {
    apiClient.setAuthToken(data.session.access_token)
  }

  return {
    user: data?.user || null,
    session: data?.session || null,
    error,
  }
}

export async function signInWithLoginIdentifier(identifier, password) {
  const { data, error } = await apiClient.request('/auth/login', {
    body: JSON.stringify({ identifier, password }),
    method: 'POST',
    skipAuth: true,
  })

  if (data?.session?.access_token) {
    apiClient.setAuthToken(data.session.access_token)
  }

  return {
    user: data?.user || null,
    session: data?.session || null,
    error,
  }
}

export async function getCurrentSession() {
  if (!apiClient.getAuthToken()) {
    return {
      session: null,
      error: null,
    }
  }

  const { data, error } = await apiClient.request('/auth/me')

  if (error) {
    apiClient.setAuthToken('')
  }

  return {
    session: data?.session || null,
    error,
  }
}

export async function signOutBackend() {
  const { error } = apiClient.getAuthToken()
    ? await apiClient.request('/auth/logout', { method: 'POST' })
    : { error: null }

  apiClient.setAuthToken('')

  return {
    error,
  }
}

export const authService = {
  getCurrentSession,
  getProfileByUserId,
  getProfileByUsername,
  mapProfileToCurrentUser,
  signInWithEmailPassword,
  signInWithLoginIdentifier,
  signOut: signOutBackend,
}
