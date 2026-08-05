export function mapUserProfile(row = {}) {
  return {
    id: row.id,
    full_name: row.full_name || '',
    email: row.email || '',
    username: row.username || '',
    role: row.role || 'checker',
    is_active: row.is_active !== false,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }
}

export function mapAuthUser(row = {}) {
  return {
    id: row.id,
    email: row.email || '',
    username: row.username || '',
    role: row.role || 'checker',
  }
}
