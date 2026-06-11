import { useEffect, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Table from '../components/ui/Table.jsx'
import {
  changeDestinationStatus,
  createDestination,
  getDestinations,
  updateDestination,
} from '../services/vesselService.js'

const emptyForm = {
  name: '',
  description: '',
  isActive: true,
}

function DestinationPage() {
  const [destinations, setDestinations] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingDestination, setEditingDestination] = useState(null)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadDestinations()
  }, [])

  async function loadDestinations() {
    setIsLoading(true)
    setLoadError('')

    const result = await getDestinations()

    if (result.error) {
      setLoadError('Gagal memuat destination dari Supabase.')
    } else {
      setDestinations(result.data)
    }

    setIsLoading(false)
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Destination wajib diisi.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setLoadError('')

    if (!validateForm()) return

    setIsSubmitting(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.isActive,
    }
    const result = editingDestination
      ? await updateDestination(editingDestination.id, payload)
      : await createDestination(payload)

    if (result.error) {
      const duplicateMessage =
        result.error.code === '23505'
          ? 'Destination dengan nama tersebut sudah ada.'
          : 'Gagal menyimpan destination.'

      setLoadError(duplicateMessage)
      setIsSubmitting(false)
      return
    }

    setDestinations((current) => {
      if (editingDestination) {
        return current.map((destination) =>
          destination.id === editingDestination.id ? result.data : destination,
        )
      }

      return [...current, result.data].sort((a, b) => a.name.localeCompare(b.name))
    })
    setForm(emptyForm)
    setEditingDestination(null)
    setErrors({})
    setMessage(editingDestination ? 'Destination berhasil diupdate.' : 'Destination berhasil ditambahkan.')
    setIsSubmitting(false)
  }

  function handleEdit(destination) {
    setEditingDestination(destination)
    setForm({
      name: destination.name || '',
      description: destination.description || '',
      isActive: destination.is_active,
    })
    setErrors({})
    setMessage('')
    setLoadError('')
  }

  function handleCancelEdit() {
    setEditingDestination(null)
    setForm(emptyForm)
    setErrors({})
  }

  async function handleToggleStatus(destination) {
    setLoadError('')
    setMessage('')

    const result = await changeDestinationStatus(destination.id, !destination.is_active)

    if (result.error) {
      setLoadError('Gagal mengubah status destination.')
      return
    }

    setDestinations((current) =>
      current.map((item) => (item.id === destination.id ? result.data : item)),
    )
  }

  const columns = [
    { key: 'name', label: 'Destination' },
    { key: 'description', label: 'Description', render: (row) => row.description || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'active' : 'danger'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button
            type="button"
            variant={row.is_active ? 'danger' : 'success'}
            onClick={() => handleToggleStatus(row)}
          >
            {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Destination</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola destination yang dipakai saat membuat data kapal.
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <Card title={editingDestination ? 'Edit Destination' : 'Tambah Destination'}>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <Input
                label="Destination"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
              />
              {errors.name && (
                <p className="mt-1 text-sm font-semibold text-red-600">{errors.name}</p>
              )}
            </div>

            <Input
              label="Description"
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
            />

            <label className="flex items-center gap-3 pt-7 font-bold text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-red-800 focus:ring-red-100"
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateForm('isActive', event.target.checked)}
              />
              <span>Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            {editingDestination && (
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Batalkan
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Menyimpan...'
                : editingDestination
                  ? 'Update Destination'
                  : 'Simpan Destination'}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Daftar Destination" subtitle="Data berasal dari tabel destinations Supabase.">
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat destination...</p>
        ) : (
          <Table columns={columns} data={destinations} />
        )}
      </Card>
    </div>
  )
}

export default DestinationPage
