import { supabase } from '../lib/supabaseClient.js'
import { normalizeRole } from '../utils/roles.js'

function getSupabaseRequiredError() {
  return new Error(
    'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

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
  if (!supabase) {
    return {
      profile: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, username, role, is_active')
    .eq('id', userId)
    .maybeSingle()

  return {
    profile: data,
    error,
  }
}

export async function getProfileByUsername(username) {
  if (!supabase) {
    return {
      profile: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .rpc('resolve_login_email', {
      login_username: username.trim().toLowerCase(),
    })

  return {
    profile: data ? { email: data } : null,
    error,
  }
}

export async function signInWithEmailPassword(email, password) {
  if (!supabase) {
    return {
      user: null,
      session: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    user: data?.user || null,
    session: data?.session || null,
    error,
  }
}

export async function signInWithLoginIdentifier(identifier, password) {
  const cleanIdentifier = identifier.trim()
  const isEmail = cleanIdentifier.includes('@')
  let email = cleanIdentifier

  if (!isEmail) {
    const { profile, error } = await getProfileByUsername(cleanIdentifier)

    if (error) {
      return {
        user: null,
        session: null,
        error,
      }
    }

    if (!profile?.email) {
      return {
        user: null,
        session: null,
        error: new Error('Username tidak ditemukan atau email profile belum diisi.'),
      }
    }

    email = profile.email
  }

  return signInWithEmailPassword(email, password)
}

export async function getCurrentSession() {
  if (!supabase) {
    return {
      session: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase.auth.getSession()

  return {
    session: data?.session || null,
    error,
  }
}

export async function signOutSupabase() {
  if (!supabase) {
    return {
      error: getSupabaseRequiredError(),
    }
  }

  const { error } = await supabase.auth.signOut()

  return {
    error,
  }
}
