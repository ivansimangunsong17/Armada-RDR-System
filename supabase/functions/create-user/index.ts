// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const roleOptions = new Set(['admin', 'checker', 'viewer'])
const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,31}$/

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeString(value: unknown) {
  return String(value || '').trim()
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: 'Supabase function environment is incomplete.' }, 500)
  }

  const authHeader = request.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ error: 'Unauthorized.' }, 401)
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', caller.id)
    .maybeSingle()

  if (profileError || !callerProfile?.is_active || callerProfile.role !== 'admin') {
    return jsonResponse({ error: 'Only active admin users can create users.' }, 403)
  }

  let payload: Record<string, unknown>

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload.' }, 400)
  }

  const fullName = normalizeString(payload.fullName)
  const email = normalizeString(payload.email).toLowerCase()
  const username = normalizeString(payload.username).toLowerCase()
  const password = String(payload.password || '')
  const role = normalizeString(payload.role) || 'checker'
  const isActive = payload.isActive !== false

  if (!fullName) return jsonResponse({ error: 'Full Name wajib diisi.' }, 400)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Email wajib diisi dengan format valid.' }, 400)
  }
  if (username && !usernamePattern.test(username)) {
    return jsonResponse({
      error:
        'Username harus 3-32 karakter, diawali huruf/angka, hanya huruf kecil, angka, titik, underscore, atau dash.',
    }, 400)
  }
  if (!roleOptions.has(role)) return jsonResponse({ error: 'Role tidak valid.' }, 400)
  if (password.length < 8) return jsonResponse({ error: 'Password minimal 8 karakter.' }, 400)

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      username: username || null,
      role,
    },
  })

  if (authError || !authData.user) {
    return jsonResponse({ error: authError?.message || 'Gagal membuat auth user.' }, 400)
  }

  const { data: profile, error: profileUpsertError } = await adminClient
    .from('profiles')
    .upsert(
      [
        {
          id: authData.user.id,
          full_name: fullName,
          email,
          username: username || null,
          role,
          is_active: isActive,
        },
      ],
      { onConflict: 'id' },
    )
    .select('id, full_name, email, username, role, is_active, created_at')
    .single()

  if (profileUpsertError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return jsonResponse({ error: profileUpsertError.message || 'Gagal membuat profile user.' }, 400)
  }

  return jsonResponse({ user: profile }, 201)
})
