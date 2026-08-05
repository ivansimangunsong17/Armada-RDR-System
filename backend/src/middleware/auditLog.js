import { createAuditLog } from '../modules/audit/audit.repository.js'

const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getIpAddress(req) {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return String(raw || req.ip || '')
    .split(',')
    .map((value) => value.trim())
    .find(Boolean)
}

function getEntityFromPath(path) {
  const segments = path
    .replace(/^\/api\//, '')
    .split('/')
    .filter(Boolean)

  const entityType = segments[0] || 'unknown'
  const entityId = segments.find((segment) => /^[0-9a-f-]{36}$/i.test(segment))

  return { entityId, entityType }
}

function getAction(method, path) {
  if (path.includes('/auth/login')) return 'login'
  if (path.includes('/auth/logout')) return 'logout'
  if (method === 'POST') return 'create'
  if (method === 'PUT' || method === 'PATCH') return 'update'
  if (method === 'DELETE') return 'delete'
  return method.toLowerCase()
}

export function auditLog(req, res, next) {
  res.on('finish', () => {
    if (!AUDIT_METHODS.has(req.method)) return
    if (!req.originalUrl.startsWith('/api/')) return
    if (req.originalUrl.startsWith('/api/health')) return
    if (res.statusCode >= 400) return

    const { entityId, entityType } = getEntityFromPath(req.originalUrl)

    createAuditLog({
      action: getAction(req.method, req.originalUrl),
      actorUserId: req.auth?.user?.id,
      entityId,
      entityType,
      ipAddress: getIpAddress(req),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'],
      metadata: {
        params: req.params || {},
        query: req.query || {},
      },
    }).catch((error) => {
      console.warn(`Audit log gagal ditulis: ${error.message}`)
    })
  })

  next()
}
