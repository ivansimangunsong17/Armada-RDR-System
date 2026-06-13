import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Modal from '../components/ui/Modal.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import {
  getUserProfileMutationError,
  getUserProfiles,
  updateUserProfile,
} from '../services/userService.js'

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

function normalizeUsername(value) {
  return value.trim().toLowerCase()
}

function normalizeEmail(value) {
  return value.trim().toLowerCase()
}

function getRoleLabel(role) {
  return roleOptions.find((option) => option.value === role)?.label || role || '-'
}

function createEditForm(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || 'checker',
    isActive: Boolean(user?.isActive),
  }
}

function getValidationIssues(form) {
  const issues = []
  const username = normalizeUsername(form.username || '')
  const email = normalizeEmail(form.email || '')

  if (!form.fullName.trim()) {
    issues.push('Full Name wajib diisi.')
  }

  if (username && !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    issues.push(
      'Username harus 3-32 karakter, diawali huruf/angka, hanya huruf kecil, angka, titik, underscore, atau dash.',
    )
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push('Format email tidak valid.')
  }

  return issues
}

function UserManagementPage({ appState }) {
  const { currentUser } = appState
  const currentUserId = getCurrentUserId(currentUser)
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState(createEditForm())
  const [validationIssues, setValidationIssues] = useState([])
  const [isReviewOpen, setIsReviewOpen] = useState(false)

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
    setIsLoading(false)
  }

  function openEditModal(user) {
    setEditingUser(user)
    setEditForm(createEditForm(user))
    setValidationIssues([])
    setError('')
    setSuccessMessage('')
  }

  function closeEditModal() {
    if (savingUserId) return
    setEditingUser(null)
    setEditForm(createEditForm())
    setValidationIssues([])
    setIsReviewOpen(false)
  }

  function updateEditForm(field, value) {
    setValidationIssues([])
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSave() {
    if (!editingUser) return

    const issues = getValidationIssues(editForm)
    if (issues.length > 0) {
      setValidationIssues(issues)
      return
    }

    setValidationIssues([])
    setIsReviewOpen(true)
  }

  async function handleConfirmSave() {
    if (!editingUser) return

    const username = normalizeUsername(editForm.username || '')
    const email = normalizeEmail(editForm.email || '')

    setSavingUserId(editingUser.id)
    setError('')
    setSuccessMessage('')
    setValidationIssues([])

    const result = await updateUserProfile(editingUser.id, {
      fullName: editForm.fullName.trim(),
      email,
      username,
      role: editForm.role,
      isActive: editingUser.id === currentUserId ? editingUser.isActive : editForm.isActive,
    })

    if (result.error) {
      const friendlyError = getUserProfileMutationError(result.error)
      setValidationIssues([friendlyError.message || 'Gagal menyimpan perubahan user.'])
      setSavingUserId('')
      return
    }

    setUsers((currentUsers) =>
      currentUsers.map((item) =>
        item.id === editingUser.id
          ? {
              ...item,
              fullName: result.user?.fullName || editForm.fullName.trim(),
              email: result.user?.email ?? email,
              username: result.user?.username ?? username,
              role: result.user?.role || editForm.role,
              isActive: result.user?.isActive ?? editForm.isActive,
            }
          : item,
      ),
    )
    setSuccessMessage('Perubahan user berhasil disimpan.')
    setSavingUserId('')
    closeEditModal()
  }

  const accountReviewRows = editingUser
    ? [
        ['Full Name', editingUser.fullName || '-', editForm.fullName.trim() || '-'],
        ['Email', editingUser.email || '-', normalizeEmail(editForm.email || '') || '-'],
        ['Username', editingUser.username || '-', normalizeUsername(editForm.username || '') || '-'],
        ['Role', getRoleLabel(editingUser.role), getRoleLabel(editForm.role)],
        [
          'Status',
          editingUser.isActive ? 'Active' : 'Inactive',
          editingUser.id === currentUserId
            ? editingUser.isActive ? 'Active' : 'Inactive'
            : editForm.isActive ? 'Active' : 'Inactive',
        ],
      ].filter((row) => row[1] !== row[2])
    : []

  const columns = useMemo(
    () => [
      {
        key: 'identity',
        label: 'User',
        render: (row) => (
          <div className="min-w-52">
            <p className="font-extrabold text-slate-900">{row.fullName || '-'}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {row.username ? `@${row.username}` : 'Username belum diisi'}
            </p>
          </div>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        render: (row) => (
          <span className={row.email ? 'font-semibold text-slate-700' : 'text-slate-400'}>
            {row.email || 'Belum diisi'}
          </span>
        ),
      },
      {
        key: 'role',
        label: 'Role',
        render: (row) => <Badge variant="normal">{getRoleLabel(row.role)}</Badge>,
      },
      {
        key: 'isActive',
        label: 'Status',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <Badge variant={row.isActive ? 'completed' : 'danger'}>
              {row.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {row.id === currentUserId && <Badge variant="normal">Current User</Badge>}
          </div>
        ),
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
          <Button type="button" variant="secondary" onClick={() => openEditModal(row)}>
            Edit
          </Button>
        ),
      },
    ],
    [currentUserId],
  )

  const isCurrentEditingUser = editingUser?.id === currentUserId
  const isSavingCurrentUser = savingUserId === editingUser?.id

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
            Step 1 hanya mengelola profile user yang sudah ada. Pembuatan user baru nanti
            dilakukan melalui Edge Function.
          </p>
          <p>
            Username dipakai untuk login lapangan. Email tetap disimpan di profile sebagai fallback
            dan jembatan ke Supabase Auth.
          </p>
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
        subtitle="Admin dapat mengubah profile user melalui modal validasi tanpa membuat user baru."
      >
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat daftar user...</p>
        ) : (
          <Table
            className="[&_tbody_tr]:align-top"
            columns={columns}
            data={users}
            emptyMessage="Belum ada user di tabel profiles."
            tableClassName="min-w-[860px]"
          />
        )}
      </Card>

      <Modal
        isOpen={Boolean(editingUser)}
        onClose={closeEditModal}
        title="Validasi Profile User"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">Editing User</p>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {editingUser?.fullName || '-'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {editingUser?.email || 'Email profile belum diisi'}
            </p>
          </div>

          {validationIssues.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <p className="mb-2 font-extrabold">Validasi belum lolos</p>
              <ul className="grid gap-1">
                {validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full Name"
              value={editForm.fullName}
              onChange={(event) => updateEditForm('fullName', event.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(event) => updateEditForm('email', event.target.value)}
            />
            <Input
              label="Username"
              placeholder="checker.ops"
              value={editForm.username}
              onBlur={(event) => updateEditForm('username', normalizeUsername(event.target.value))}
              onChange={(event) => updateEditForm('username', event.target.value)}
            />
            <Select
              label="Role"
              value={editForm.role}
              onChange={(event) => updateEditForm('role', event.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <Select
                label="Status Aktif"
                disabled={isCurrentEditingUser}
                value={editForm.isActive ? 'active' : 'inactive'}
                onChange={(event) =>
                  updateEditForm('isActive', event.target.value === 'active')
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              {isCurrentEditingUser && (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Current user tidak bisa menonaktifkan akunnya sendiri.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button type="button" variant="success" disabled={isSavingCurrentUser} onClick={handleSave}>
              {isSavingCurrentUser ? 'Saving...' : 'Review Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReviewOpen}
        onClose={() => {
          if (!savingUserId) setIsReviewOpen(false)
        }}
        title="Validasi Perubahan Akun"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-extrabold">Validasi lolos</p>
            <p className="mt-1 font-semibold">
              Periksa perubahan akun sebelum disimpan ke Supabase.
            </p>
          </div>

          {accountReviewRows.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              Tidak ada perubahan data akun.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-extrabold">Field</th>
                    <th className="px-4 py-3 font-extrabold">Sebelum</th>
                    <th className="px-4 py-3 font-extrabold">Sesudah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accountReviewRows.map(([field, before, after]) => (
                    <tr key={field}>
                      <td className="px-4 py-3 font-bold text-slate-900">{field}</td>
                      <td className="px-4 py-3 text-slate-600">{before}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsReviewOpen(false)}>
              Kembali Edit
            </Button>
            <Button
              type="button"
              variant="success"
              disabled={isSavingCurrentUser || accountReviewRows.length === 0}
              onClick={handleConfirmSave}
            >
              {isSavingCurrentUser ? 'Saving...' : 'Confirm Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UserManagementPage
