import { useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Table from '../components/ui/Table.jsx'

const emptyForm = {
  name: '',
  email: '',
  position: '',
  isActive: true,
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function EmailSettingsPage({ appState }) {
  const { emailRecipients, setEmailRecipients } = appState
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.name.trim()) {
      nextErrors.name = 'Name wajib diisi.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email wajib diisi.'
    } else if (!isValidEmail(form.email.trim())) {
      nextErrors.email = 'Format email tidak valid.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    const newRecipient = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      position: form.position.trim() || '-',
      isActive: form.isActive,
    }

    setEmailRecipients((current) => [...current, newRecipient])
    setForm(emptyForm)
    setErrors({})
  }

  function toggleStatus(recipientId) {
    setEmailRecipients((current) =>
      current.map((recipient) =>
        recipient.id === recipientId
          ? {
              ...recipient,
              isActive: !recipient.isActive,
            }
          : recipient,
      ),
    )
  }

  function handleTestSend(recipient) {
    alert(`Dummy test send berhasil dikirim ke ${recipient.email}`)
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'position',
      label: 'Position',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'active' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={row.isActive ? 'secondary' : 'success'}
            onClick={() => toggleStatus(row.id)}
          >
            {row.isActive ? 'Inactive' : 'Active'}
          </Button>
          <Button type="button" variant="primary" onClick={() => handleTestSend(row)}>
            Test Send
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Setting Email</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola daftar penerima email report. Email service masih dummy untuk tahap frontend.
        </p>
      </div>

      <Card title="Tambah Penerima Email">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Input
                label="Name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
              />
              {errors.name && (
                <p className="mt-1 text-sm font-semibold text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
              />
              {errors.email && (
                <p className="mt-1 text-sm font-semibold text-red-600">{errors.email}</p>
              )}
            </div>

            <Input
              label="Position"
              value={form.position}
              onChange={(event) => updateForm('position', event.target.value)}
            />

            <label className="flex items-center gap-3 pt-7 font-bold text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300 text-red-800 focus:ring-red-100"
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateForm('isActive', event.target.checked)}
              />
              <span>Is Active</span>
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Simpan Penerima</Button>
          </div>
        </form>
      </Card>

      <Card title="Daftar Penerima Email" subtitle="Data awal berasal dari dummyData.js.">
        <Table columns={columns} data={emailRecipients} />
      </Card>
    </div>
  )
}

export default EmailSettingsPage
