import { supabase } from '../lib/supabaseClient.js'

function getSupabaseRequiredError() {
  return new Error(
    'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

export function mapProfileToCurrentUser(profile, authUser) {
  return {
    id: profile.id,
    authUserId: authUser?.id || profile.id,
    email: authUser?.email || '',
    name: profile.full_name,
    role: profile.role,
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
    .select('id, full_name, role, is_active')
    .eq('id', userId)
    .maybeSingle()

  return {
    profile: data,
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
