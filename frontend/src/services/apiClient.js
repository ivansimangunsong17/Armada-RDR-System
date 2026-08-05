const DEFAULT_ERROR_MESSAGE = 'Request gagal.'
const AUTH_TOKEN_KEY = 'rdrs_auth_token'

function getStoredAuthToken() {
  if (typeof localStorage === 'undefined') return ''

  return localStorage.getItem(AUTH_TOKEN_KEY) || ''
}

export function setAuthToken(token) {
  if (typeof localStorage === 'undefined') return

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    return
  }

  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getAuthToken() {
  return getStoredAuthToken()
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
}

function buildUrl(path) {
  const baseUrl = getApiBaseUrl()
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`

  return `${baseUrl}${normalizedPath}`
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null)
  }

  return response.text().catch(() => '')
}

export async function apiRequest(path, options = {}) {
  const { headers, body, skipAuth = false, ...requestOptions } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const token = skipAuth ? '' : getStoredAuthToken()
  const requestHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  }

  try {
    const response = await fetch(buildUrl(path), {
      ...requestOptions,
      body,
      headers: requestHeaders,
    })
    const data = await parseResponseBody(response)

    if (!response.ok) {
      const error = new Error(data?.message || data?.error || DEFAULT_ERROR_MESSAGE)
      if (data?.code) error.code = data.code
      if (data?.constraint) error.constraint = data.constraint
      if (data?.details) error.details = data.details

      return {
        data: null,
        error,
        status: response.status,
      }
    }

    return {
      data,
      error: null,
      status: response.status,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(DEFAULT_ERROR_MESSAGE),
      status: 0,
    }
  }
}

export const apiClient = {
  getAuthToken,
  request: apiRequest,
  setAuthToken,
}
