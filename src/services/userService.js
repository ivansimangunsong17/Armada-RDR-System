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
    role: row.role || 'checker',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at || '',
  }
}

export async function getUserProfiles() {
  if (!supabase) {
    return {
      users: [],
      hasEmailColumn: false,
      error: getSupabaseRequiredError(),
    }
  }

  const queryWithEmail = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, created_at')
    .order('created_at', { ascending: false })

  if (!queryWithEmail.error) {
    return {
      users: (queryWithEmail.data || []).map(mapProfile),
      hasEmailColumn: true,
      error: null,
    }
  }

  const queryWithoutEmail = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return {
    users: (queryWithoutEmail.data || []).map(mapProfile),
    hasEmailColumn: false,
    error: queryWithoutEmail.error || null,
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
      role: payload.role,
      is_active: payload.isActive,
    })
    .eq('id', userId)
    .select('id, full_name, role, is_active, created_at')
    .maybeSingle()

  return {
    user: data ? mapProfile(data) : null,
    error,
  }
}
