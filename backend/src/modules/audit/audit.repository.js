import { query } from '../../config/database.js'

export async function createAuditLog({
  action,
  actorUserId,
  entityId,
  entityType,
  ipAddress,
  method,
  metadata = {},
  path,
  statusCode,
  userAgent,
}) {
  await query(
    `
      insert into public.audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        method,
        path,
        ip_address,
        user_agent,
        status_code,
        metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7::inet, $8, $9, $10::jsonb)
    `,
    [
      actorUserId || null,
      action,
      entityType,
      entityId || null,
      method,
      path,
      ipAddress || null,
      userAgent || null,
      statusCode,
      JSON.stringify(metadata),
    ],
  )
}
