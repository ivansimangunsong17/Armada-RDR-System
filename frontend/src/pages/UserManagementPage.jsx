import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Modal from '../components/ui/Modal.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import { userService } from '../services/userService.js'
import { formatDateTime } from '../utils/formatters.js'
import { normalizeRole } from '../utils/roles.js'
import {
  getChangePasswordValidationIssues,
  getCreateUserValidationIssues,
  getUserValidationIssues,
  normalizeEmail,
  normalizeUsername,
} from '../utils/validators.js'

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'checker', label: 'Checker' },
  { value: 'viewer', label: 'Report Viewer' },
]

function getCurrentUserId(currentUser) {
  return currentUser?.authUserId || currentUser?.id || ''
}

function getRoleLabel(role) {
  return roleOptions.find((option) => option.value === normalizeRole(role))?.label || role || '-'
}

function createEditForm(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    role: normalizeRole(user?.role || 'checker'),
    isActive: Boolean(user?.isActive),
  }
}

function createNewUserForm() {
  return {
    fullName: '',
    email: '',
    username: '',
    password: '',
    role: 'checker',
    isActive: true,
  }
}

function createPasswordForm() {
  return {
    confirmPassword: '',
    password: '',
  }
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
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState(createNewUserForm())
  const [createValidationIssues, setCreateValidationIssues] = useState([])
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [passwordUser, setPasswordUser] = useState(null)
  const [passwordForm, setPasswordForm] = useState(createPasswordForm())
  const [passwordValidationIssues, setPasswordValidationIssues] = useState([])
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setIsLoading(true)
    setError('')

    const result = await userService.getAll()

    if (result.error) {
      setError('Gagal memuat daftar user dari server.')
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

  function openCreateModal() {
    setCreateForm(createNewUserForm())
    setCreateValidationIssues([])
    setError('')
    setSuccessMessage('')
    setIsCreateOpen(true)
  }

  function closeCreateModal() {
    if (isCreating) return
    setIsCreateOpen(false)
    setIsCreateReviewOpen(false)
    setCreateForm(createNewUserForm())
    setCreateValidationIssues([])
  }

  function updateCreateForm(field, value) {
    setCreateValidationIssues([])
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openPasswordModal(user) {
    setPasswordUser(user)
    setPasswordForm(createPasswordForm())
    setPasswordValidationIssues([])
    setError('')
    setSuccessMessage('')
  }

  function closePasswordModal() {
    if (isPasswordSaving) return
    setPasswordUser(null)
    setPasswordForm(createPasswordForm())
    setPasswordValidationIssues([])
  }

  function updatePasswordForm(field, value) {
    setPasswordValidationIssues([])
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleChangePassword() {
    if (!passwordUser) return

    const issues = getChangePasswordValidationIssues(passwordForm)

    if (issues.length > 0) {
      setPasswordValidationIssues(issues)
      return
    }

    setIsPasswordSaving(true)
    setPasswordValidationIssues([])
    setError('')
    setSuccessMessage('')

    const result = await userService.changePassword(passwordUser.id, {
      confirmPassword: passwordForm.confirmPassword,
      password: passwordForm.password,
    })

    if (result.error) {
      setPasswordValidationIssues([result.error.message || 'Gagal mengganti password user.'])
      setIsPasswordSaving(false)
      return
    }

    setSuccessMessage(`Password ${passwordUser.fullName || passwordUser.username || 'user'} berhasil diganti.`)
    setIsPasswordSaving(false)
    closePasswordModal()
  }

  function handleCreateReview() {
    const issues = getCreateUserValidationIssues(createForm)

    if (issues.length > 0) {
      setCreateValidationIssues(issues)
      return
    }

    setCreateValidationIssues([])
    setIsCreateReviewOpen(true)
  }

  async function handleConfirmCreate() {
    const issues = getCreateUserValidationIssues(createForm)

    if (issues.length > 0) {
      setCreateValidationIssues(issues)
      setIsCreateReviewOpen(false)
      return
    }

    setIsCreating(true)
    setError('')
    setSuccessMessage('')

    const result = await userService.create({
      fullName: createForm.fullName.trim(),
      email: normalizeEmail(createForm.email),
      username: normalizeUsername(createForm.username || ''),
      password: createForm.password,
      role: createForm.role,
      isActive: createForm.isActive,
    })

    if (result.error || !result.user) {
      const friendlyError = userService.getMutationError(result.error)
      setCreateValidationIssues([friendlyError?.message || 'Gagal membuat user baru.'])
      setIsCreating(false)
      setIsCreateReviewOpen(false)
      return
    }

    setUsers((current) => [result.user, ...current])
    setSuccessMessage('User baru berhasil dibuat.')
    setIsCreating(false)
    setIsCreateOpen(false)
    setIsCreateReviewOpen(false)
    setCreateForm(createNewUserForm())
    setCreateValidationIssues([])
  }

  function handleSave() {
    if (!editingUser) return

    const issues = getUserValidationIssues(editForm)
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

    const result = await userService.update(editingUser.id, {
      fullName: editForm.fullName.trim(),
      email,
      username,
      role: editingUser.id === currentUserId ? editingUser.role : editForm.role,
      isActive: editingUser.id === currentUserId ? editingUser.isActive : editForm.isActive,
    })

    if (result.error) {
      const friendlyError = userService.getMutationError(result.error)
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
              role: result.user?.role || (editingUser.id === currentUserId ? editingUser.role : editForm.role),
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
        [
          'Role',
          getRoleLabel(editingUser.role),
          getRoleLabel(editingUser.id === currentUserId ? editingUser.role : editForm.role),
        ],
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
          <div className="flex min-w-44 flex-col gap-2">
            <Button type="button" variant="secondary" onClick={() => openEditModal(row)}>
              Edit
            </Button>
            <Button type="button" variant="secondary" onClick={() => openPasswordModal(row)}>
              Change Password
            </Button>
          </div>
        ),
      },
    ],
    [currentUserId],
  )

  const isCurrentEditingUser = editingUser?.id === currentUserId
  const isSavingCurrentUser = savingUserId === editingUser?.id
  const createReviewRows = [
    ['Full Name', createForm.fullName.trim() || '-'],
    ['Email', normalizeEmail(createForm.email || '') || '-'],
    ['Username', normalizeUsername(createForm.username || '') || '-'],
    ['Role', getRoleLabel(createForm.role)],
    ['Status', createForm.isActive ? 'Active' : 'Inactive'],
  ]
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const visibleUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          !normalizedSearchTerm ||
          [user.fullName, user.email, user.username]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearchTerm))
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' ? user.isActive : !user.isActive)

        return matchesSearch && matchesRole && matchesStatus
      }),
    [normalizedSearchTerm, roleFilter, statusFilter, users],
  )
  const userSummary = useMemo(
    () =>
      users.reduce(
        (summary, user) => {
          summary.total += 1
          summary[user.isActive ? 'active' : 'inactive'] += 1
          if (user.role === 'admin') summary.admin += 1
          if (user.role === 'checker') summary.checker += 1
          if (user.role === 'viewer') summary.viewer += 1
          return summary
        },
        { total: 0, active: 0, inactive: 0, admin: 0, checker: 0, viewer: 0 },
      ),
    [users],
  )

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola profile user yang sudah terdaftar di sistem.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 text-sm text-slate-600">
          <p>
            Admin dapat membuat user baru dan mengelola profile user yang sudah ada.
          </p>
          <p>
            Username dipakai untuk login lapangan. Email tetap disimpan di profile sebagai fallback
            dan jembatan ke sistem login.
          </p>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total User', userSummary.total],
          ['Active', userSummary.active],
          ['Inactive', userSummary.inactive],
          ['Checker', userSummary.checker],
          ['Report Viewer', userSummary.viewer],
        ].map(([label, value]) => (
          <Card key={label} className="min-w-0">
            <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
            <strong className="mt-2 block text-2xl font-black text-slate-950">{value}</strong>
          </Card>
        ))}
      </section>

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
        subtitle="Admin dapat membuat user baru dan mengubah profile user melalui modal validasi."
      >
        <div className="mb-4 grid gap-3 border-b border-slate-100 pb-4 lg:grid-cols-[1fr_180px_180px_auto_auto] lg:items-end">
          <Input
            label="Cari User"
            placeholder="Nama, email, atau username"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Select
            label="Role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">Semua role</option>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Semua status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button type="button" variant="secondary" onClick={loadUsers} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button type="button" onClick={openCreateModal}>
            Tambah User
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat daftar user...</p>
        ) : (
          <Table
            className="[&_tbody_tr]:align-top"
            columns={columns}
            data={visibleUsers}
            emptyMessage="Tidak ada user yang sesuai filter."
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
              disabled={isCurrentEditingUser}
              value={editForm.role}
              onChange={(event) => updateEditForm('role', event.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
            {isCurrentEditingUser && (
              <p className="text-sm font-semibold text-slate-500 md:col-span-2">
                Current user tidak bisa mengubah role akunnya sendiri.
              </p>
            )}
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
        isOpen={Boolean(passwordUser)}
        onClose={closePasswordModal}
        title="Change Password"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase text-slate-500">Target User</p>
            <p className="mt-1 text-base font-extrabold text-slate-900">
              {passwordUser?.fullName || '-'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {passwordUser?.username ? `@${passwordUser.username}` : passwordUser?.email || 'Username belum diisi'}
            </p>
          </div>

          {passwordValidationIssues.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <p className="mb-2 font-extrabold">Validasi belum lolos</p>
              <ul className="grid gap-1">
                {passwordValidationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Password Baru"
              type="password"
              value={passwordForm.password}
              onChange={(event) => updatePasswordForm('password', event.target.value)}
            />
            <Input
              label="Konfirmasi Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => updatePasswordForm('confirmPassword', event.target.value)}
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Password lama tidak akan ditampilkan. Setelah diganti, user harus memakai password baru saat login berikutnya.
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button type="button" variant="success" disabled={isPasswordSaving} onClick={handleChangePassword}>
              {isPasswordSaving ? 'Saving...' : 'Save Password'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title="Tambah User Baru"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-extrabold">Create user</p>
            <p className="mt-1 font-semibold">
              User dibuat di sistem login, lalu profile dibuat di server.
            </p>
          </div>

          {createValidationIssues.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <p className="mb-2 font-extrabold">Validasi belum lolos</p>
              <ul className="grid gap-1">
                {createValidationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full Name"
              value={createForm.fullName}
              onChange={(event) => updateCreateForm('fullName', event.target.value)}
            />
            <Input
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(event) => updateCreateForm('email', event.target.value)}
            />
            <Input
              label="Username"
              placeholder="checker.ops"
              value={createForm.username}
              onBlur={(event) => updateCreateForm('username', normalizeUsername(event.target.value))}
              onChange={(event) => updateCreateForm('username', event.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(event) => updateCreateForm('password', event.target.value)}
            />
            <Select
              label="Role"
              value={createForm.role}
              onChange={(event) => updateCreateForm('role', event.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Select>
            <Select
              label="Status Aktif"
              value={createForm.isActive ? 'active' : 'inactive'}
              onChange={(event) =>
                updateCreateForm('isActive', event.target.value === 'active')
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button type="button" variant="success" disabled={isCreating} onClick={handleCreateReview}>
              {isCreating ? 'Creating...' : 'Review User'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCreateReviewOpen}
        onClose={() => {
          if (!isCreating) setIsCreateReviewOpen(false)
        }}
        title="Validasi User Baru"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-extrabold">Validasi lolos</p>
            <p className="mt-1 font-semibold">
              Periksa user baru sebelum dibuat di sistem.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Field</th>
                  <th className="px-4 py-3 font-extrabold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {createReviewRows.map(([field, value]) => (
                  <tr key={field}>
                    <td className="px-4 py-3 font-bold text-slate-900">{field}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateReviewOpen(false)}>
              Kembali Edit
            </Button>
            <Button type="button" variant="success" disabled={isCreating} onClick={handleConfirmCreate}>
              {isCreating ? 'Creating...' : 'Confirm Create'}
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
              Periksa perubahan akun sebelum disimpan ke server.
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
