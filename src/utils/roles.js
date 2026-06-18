export const ROLE_VIEWER = 'viewer'
export const ROLE_SUPERVISOR_LEGACY = 'supervisor'

export function normalizeRole(role) {
  if (role === ROLE_SUPERVISOR_LEGACY) return ROLE_VIEWER
  return role || 'checker'
}

export function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === 'admin') return 'Admin'
  if (normalizedRole === 'checker') return 'Checker'
  if (normalizedRole === ROLE_VIEWER) return 'Report Viewer'

  return role || '-'
}

export function getWorkspaceLabel(role) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === 'admin') return 'Admin Workspace'
  if (normalizedRole === 'checker') return 'Checker Workspace'
  if (normalizedRole === ROLE_VIEWER) return 'Report Viewer Workspace'

  return 'Operation Dashboard'
}

export function isViewerRole(role) {
  return normalizeRole(role) === ROLE_VIEWER
}
