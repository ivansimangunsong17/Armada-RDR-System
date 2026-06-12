import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import { getUserProfiles, updateUserProfile } from '../services/userService.js'

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'checker', label: 'Checker' },
  { value: 'supervisor', label: 'Supervisor' },
]

function formatDateTime(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getCurrentUserId(currentUser) {
  return currentUser?.authUserId || currentUser?.id || ''
}

function UserManagementPage({ appState }) {
  const { currentUser } = appState
  const currentUserId = getCurrentUserId(currentUser)
  const [users, setUsers] = useState([])
  const [drafts, setDrafts] = useState({})
  const [hasEmailColumn, setHasEmailColumn] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setIsLoading(true)
    setError('')

    const result = await getUserProfiles()

    if (result.error) {
      setError('Gagal memuat daftar user dari tabel profiles.')
    }

    setUsers(result.users)
    setHasEmailColumn(result.hasEmailColumn)
    setDrafts(
      Object.fromEntries(
        result.users.map((user) => [
          user.id,
          {
            fullName: user.fullName,
            role: user.role,
            isActive: user.isActive,
          },
        ]),
      ),
    )
    setIsLoading(false)
  }

  function updateDraft(userId, field, value) {
    setSuccessMessage('')
    setError('')
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [userId]: {
        ...currentDrafts[userId],
        [field]: value,
      },
    }))
  }

  async function handleSave(user) {
    const draft = drafts[user.id]

    if (!draft?.fullName?.trim()) {
      setError('Full Name wajib diisi.')
      return
    }

    setSavingUserId(user.id)
    setError('')
    setSuccessMessage('')

    const result = await updateUserProfile(user.id, {
      fullName: draft.fullName.trim(),
      role: draft.role,
      isActive: user.id === currentUserId ? user.isActive : draft.isActive,
    })

    if (result.error) {
      setError('Gagal menyimpan perubahan user.')
      setSavingUserId('')
      return
    }

    setUsers((currentUsers) =>
      currentUsers.map((item) =>
        item.id === user.id
          ? {
              ...item,
              fullName: result.user?.fullName || draft.fullName.trim(),
              role: result.user?.role || draft.role,
              isActive: result.user?.isActive ?? draft.isActive,
            }
          : item,
      ),
    )
    setSuccessMessage('Perubahan user berhasil disimpan.')
    setSavingUserId('')
  }

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        label: 'Full Name',
        render: (row) => (
          <Input
            aria-label={`Full Name ${row.fullName}`}
            value={drafts[row.id]?.fullName || ''}
            onChange={(event) => updateDraft(row.id, 'fullName', event.target.value)}
          />
        ),
      },
      {
        key: 'email',
        label: 'Email',
        render: (row) => row.email || '-',
      },
      {
        key: 'role',
        label: 'Role',
        render: (row) => (
          <Select
            aria-label={`Role ${row.fullName}`}
            value={drafts[row.id]?.role || 'checker'}
            onChange={(event) => updateDraft(row.id, 'role', event.target.value)}
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
        ),
      },
      {
        key: 'isActive',
        label: 'Status Aktif',
        render: (row) => {
          const isCurrentUser = row.id === currentUserId

          return (
            <div className="flex flex-col gap-2">
              <Select
                aria-label={`Status ${row.fullName}`}
                disabled={isCurrentUser}
                value={drafts[row.id]?.isActive ? 'active' : 'inactive'}
                onChange={(event) =>
                  updateDraft(row.id, 'isActive', event.target.value === 'active')
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <div className="flex flex-wrap gap-2">
                <Badge variant={drafts[row.id]?.isActive ? 'completed' : 'danger'}>
                  {drafts[row.id]?.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {isCurrentUser && <Badge variant="normal">Current User</Badge>}
              </div>
            </div>
          )
        },
      },
      {
        key: 'createdAt',
        label: 'Created At',
        render: (row) => formatDateTime(row.createdAt),
      },
      {
        key: 'actions',
        label: 'Action',
        render: (row) => (
          <Button
            type="button"
            variant="success"
            disabled={savingUserId === row.id}
            onClick={() => handleSave(row)}
          >
            {savingUserId === row.id ? 'Saving...' : 'Save'}
          </Button>
        ),
      },
    ],
    [currentUserId, drafts, savingUserId],
  )

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola profile user yang sudah terdaftar di Supabase Auth.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 text-sm text-slate-600">
          <p>
            Pembuatan user baru dilakukan melalui Supabase Auth atau Edge Function pada tahap
            berikutnya.
          </p>
          {!hasEmailColumn && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
              Kolom email belum tersedia di tabel profiles. Rekomendasi migration:{' '}
              <code className="font-bold">alter table public.profiles add column if not exists email text unique;</code>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      <Card
        title="Daftar User"
        subtitle="Admin dapat mengubah full name, role, dan status aktif user tanpa memakai service role key di frontend."
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat daftar user...</p>
        ) : (
          <Table columns={columns} data={users} emptyMessage="Belum ada user di tabel profiles." />
        )}
      </Card>
    </div>
  )
}

export default UserManagementPage
