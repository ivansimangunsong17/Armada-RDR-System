import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export async function testSupabaseConnection() {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase env is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      error: null,
    }
  }

  const { count, error } = await supabase.from('destinations').select('id', { count: 'exact', head: true })

  if (error) {
    return {
      ok: false,
      message: 'Supabase connection failed.',
      error,
    }
  }

  return {
    ok: true,
    message: 'Supabase connection successful.',
    count,
    error: null,
  }
}

export async function getDestinationsExample() {
  if (!supabase) {
    return {
      data: [],
      error: new Error('Supabase env is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
    }
  }

  return supabase.from('destinations').select('id, name, description, is_active').order('name', { ascending: true })
}



