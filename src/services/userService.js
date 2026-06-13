import { supabase } from '../lib/supabaseClient.js'

function getSupabaseRequiredError() {
  return new Error(
    'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

function mapProfile(row = {}) {
  return {
    id: row.id,
    fullName: row.full_name || '',
    email: row.email || '',
    username: row.username || '',
    role: row.role || 'checker',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at || '',
  }
}

export async function getUserProfiles() {
  if (!supabase) {
    return {
      users: [],
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, username, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return {
    users: (data || []).map(mapProfile),
    error,
  }
}

export async function updateUserProfile(userId, payload) {
  if (!supabase) {
    return {
      user: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: payload.fullName,
      email: payload.email || null,
      username: payload.username || null,
      role: payload.role,
      is_active: payload.isActive,
    })
    .eq('id', userId)
    .select('id, full_name, email, username, role, is_active, created_at')
    .maybeSingle()

  return {
    user: data ? mapProfile(data) : null,
    error,
  }
}

export function getUserProfileMutationError(error) {
  if (!error) return null

  if (error.code === '23505') {
    const message = error.message || ''

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

  return error
}
