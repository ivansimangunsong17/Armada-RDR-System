import { mapAuthUser, mapUserProfile } from '../users/user.mapper.js'

function getExpiresAtFromJwt(token) {
  const [, payload] = String(token || '').split('.')
  if (!payload) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return decoded.exp || null
  } catch {
    return null
  }
}

export function mapAuthSession(userRow, token) {
  const user = mapAuthUser(userRow)

  return {
    access_token: token,
    token_type: 'bearer',
    expires_at: getExpiresAtFromJwt(token),
    user,
  }
}

export function mapAuthResponse(userRow, token) {
  return {
    user: mapAuthUser(userRow),
    profile: mapUserProfile(userRow),
    session: mapAuthSession(userRow, token),
  }
}
