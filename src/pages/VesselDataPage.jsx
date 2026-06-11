import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import { formatDate, formatMT } from '../utils/formatters.js'
import {
  formatTonnageInput,
  formatTonnageInputFromNumber,
  parseTonnageInputToNumber,
} from '../utils/tonnageInput.js'
import {
  changeVesselStatus,
  createVessel,
  deleteExtraHatchCargo,
  getCheckerAssignmentsByVesselIds,
  getCheckerProfiles,
  getDestinations,
  getHatchCargoByVesselIds,
  getOrCreateDestinationByName,
  getVessels,
  saveCheckerAssignment,
  saveHatchCargo,
  updateVessel,
} from '../services/vesselService.js'

const emptyForm = {
  vesselName: '',
  cargoOwner: '',
  cargoType: '',
  destinationName: '',
  assignedCheckerId: '',
  totalHatch: 1,
  eta: '',
  startDischargeDate: '',
  status: 'pending',
  hatchCargoRows: [{ hatchNo: 1, initialCargo: '' }],
}

const statusVariant = {
  active: 'active',
  pending: 'pending',
  completed: 'completed',
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

function createHatchCargoRows(totalHatch, existingRows = []) {
  return Array.from({ length: Number(totalHatch) || 0 }, (_, index) => {
    const hatchNo = index + 1
    const existing = existingRows.find((row) => Number(row.hatchNo) === hatchNo)

    return {
      hatchNo,
      initialCargo:
        existing?.initialCargo === undefined || existing?.initialCargo === ''
          ? ''
          : typeof existing.initialCargo === 'number'
            ? formatTonnageInputFromNumber(existing.initialCargo)
            : formatTonnageInput(existing.initialCargo),
    }
  })
}

function getStatusLabel(status) {
  return statusOptions.find((option) => option.value === status)?.label || status
}

function mapHatchCargoForApp(rows) {
  return rows.map((row) => ({
    id: row.id,
    vesselId: row.vessel_id,
    hatch: row.hatch_label || `H${row.hatch_no}`,
    hatchNo: row.hatch_no,
    tonnage: Number(row.initial_cargo) || 0,
  }))
}

function VesselDataPage({ appState }) {
  const { vessels, setVessels, setHatchCargo, currentUser } = appState
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [checkers, setCheckers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVessel, setEditingVessel] = useState(null)
  const [loadError, setLoadError] = useState('')

  const checkerLookup = useMemo(
    () => Object.fromEntries(checkers.map((item) => [item.id, item.full_name])),
    [checkers],
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    setLoadError('')

    const [destinationsResult, vesselsResult, checkersResult] = await Promise.all([
      getDestinations(),
      getVessels(),
      getCheckerProfiles(),
    ])

    const nextDestinations = destinationsResult.data || []
    const nextVessels = vesselsResult.data || []
    const nextCheckers = checkersResult.data || []
    const vesselIds = nextVessels.map((vessel) => vessel.id)

    const [hatchCargoResult, assignmentsResult] = await Promise.all([
      getHatchCargoByVesselIds(vesselIds),
      getCheckerAssignmentsByVesselIds(vesselIds),
    ])

    const nextLoadErrors = []

    if (destinationsResult.error) nextLoadErrors.push('Gagal memuat destinations.')
    if (vesselsResult.error) nextLoadErrors.push('Gagal memuat vessels.')
    if (checkersResult.error) nextLoadErrors.push('Gagal memuat checker.')
    if (hatchCargoResult.error) nextLoadErrors.push('Gagal memuat Final Stowage Plan.')
    if (assignmentsResult.error) nextLoadErrors.push('Gagal memuat checker assignment.')

    setCheckers(nextCheckers)

    const destinationMap = Object.fromEntries(nextDestinations.map((item) => [item.id, item.name]))
    const checkerMap = Object.fromEntries(nextCheckers.map((item) => [item.id, item.full_name]))
    const hatchCargoByVessel = (hatchCargoResult.data || []).reduce((result, row) => {
      result[row.vessel_id] = result[row.vessel_id] || []
      result[row.vessel_id].push(row)
      return result
    }, {})
    const assignmentByVessel = Object.fromEntries(
      (assignmentsResult.data || []).map((assignment) => [assignment.vessel_id, assignment]),
    )

    setVessels(
      nextVessels.map((item) => {
        const assignment = assignmentByVessel[item.id]

        return {
          id: item.id,
          vesselName: item.vessel_name,
          company: item.cargo_owner,
          cargo: item.cargo_type,
          destinationId: item.destination_id,
          destination: destinationMap[item.destination_id] || item.destination_id,
          totalHatch: item.total_hatch,
          eta: item.eta,
          startDate: item.start_discharge_date,
          status: item.status,
          createdBy: item.created_by,
          assignedCheckerId: assignment?.checker_id || '',
          assignedCheckerName: checkerMap[assignment?.checker_id] || '-',
          hatchCargoRows: (hatchCargoByVessel[item.id] || []).map((row) => ({
            id: row.id,
            hatchNo: row.hatch_no,
            hatchLabel: row.hatch_label,
            initialCargo: Number(row.initial_cargo) || 0,
          })),
        }
      }),
    )

    if (setHatchCargo) {
      setHatchCargo(mapHatchCargoForApp(hatchCargoResult.data || []))
    }

    setLoadError(nextLoadErrors.join(' '))
    setIsLoading(false)
  }

  function updateForm(field, value) {
    setForm((current) => {
      if (field === 'totalHatch') {
        const totalHatch = Number(value)

        return {
          ...current,
          totalHatch,
          hatchCargoRows: createHatchCargoRows(totalHatch, current.hatchCargoRows),
        }
      }

      return {
        ...current,
        [field]: value,
      }
    })
  }

  function updateHatchCargoValue(hatchNo, value) {
    setForm((current) => ({
      ...current,
      hatchCargoRows: current.hatchCargoRows.map((row) =>
        row.hatchNo === hatchNo
          ? {
              ...row,
              initialCargo: formatTonnageInput(value),
            }
          : row,
      ),
    }))
  }

  function validateForm() {
    const nextErrors = {}

    if (!form.vesselName.trim()) nextErrors.vesselName = 'Vessel name wajib diisi.'
    if (!form.cargoOwner.trim()) nextErrors.cargoOwner = 'Cargo owner wajib diisi.'
    if (!form.cargoType.trim()) nextErrors.cargoType = 'Cargo type wajib diisi.'
    if (!form.destinationName.trim()) nextErrors.destinationName = 'Destination wajib diisi.'
    if (!form.assignedCheckerId) nextErrors.assignedCheckerId = 'Assigned checker wajib dipilih.'
    if (!form.startDischargeDate) {
      nextErrors.startDischargeDate = 'Start discharge date wajib diisi.'
    }
    if (Number(form.totalHatch) < 1) nextErrors.totalHatch = 'Total hatch minimal 1.'

    const invalidHatch = form.hatchCargoRows.find(
      (row) => row.initialCargo === '' || parseTonnageInputToNumber(row.initialCargo) < 0,
    )
    if (invalidHatch) {
      nextErrors.hatchCargoRows = 'Final Stowage Plan per hatch wajib diisi dan tidak boleh minus.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return
    if (!currentUser) return

    setIsSubmitting(true)
    setLoadError('')

    const destinationResult = await getOrCreateDestinationByName(form.destinationName)

    if (destinationResult.error) {
      setLoadError(`Gagal menyiapkan destination. ${destinationResult.error.message || ''}`)
      setIsSubmitting(false)
      return
    }

    const payload = {
      vessel_name: form.vesselName.trim(),
      cargo_owner: form.cargoOwner.trim(),
      cargo_type: form.cargoType.trim(),
      destination_id: destinationResult.data.id,
      total_hatch: Number(form.totalHatch),
      eta: form.eta || null,
      start_discharge_date: form.startDischargeDate,
      status: form.status,
      created_by: currentUser.authUserId || currentUser.id,
    }

    const vesselResult = editingVessel
      ? await updateVessel(editingVessel.id, payload)
      : await createVessel(payload)

    if (vesselResult.error) {
      setLoadError(`Gagal menyimpan data kapal. ${vesselResult.error.message || ''}`)
      setIsSubmitting(false)
      return
    }

    const vesselId = vesselResult.data.id
    const hatchResult = await saveHatchCargo(
      vesselId,
      form.hatchCargoRows.map((row) => ({
        hatchNo: row.hatchNo,
        initialCargo: parseTonnageInputToNumber(row.initialCargo),
      })),
    )

    if (hatchResult.error) {
      setLoadError(`Kapal tersimpan, tetapi Final Stowage Plan gagal disimpan. ${hatchResult.error.message || ''}`)
      setIsSubmitting(false)
      return
    }

    const deleteExtraResult = await deleteExtraHatchCargo(vesselId, form.totalHatch)

    if (deleteExtraResult.error) {
      setLoadError(`Final Stowage Plan tersimpan, tetapi hatch lama gagal dibersihkan. ${deleteExtraResult.error.message || ''}`)
      setIsSubmitting(false)
      return
    }

    const assignmentResult = await saveCheckerAssignment(
      vesselId,
      form.assignedCheckerId,
      currentUser.authUserId || currentUser.id,
    )

    if (assignmentResult.error) {
      setLoadError(`Kapal dan Final Stowage Plan tersimpan, tetapi assignment checker gagal. ${assignmentResult.error.message || ''}`)
      setIsSubmitting(false)
      return
    }

    const newRow = {
      id: vesselResult.data.id,
      vesselName: vesselResult.data.vessel_name,
      company: vesselResult.data.cargo_owner,
      cargo: vesselResult.data.cargo_type,
      destinationId: vesselResult.data.destination_id,
      destination: destinationResult.data.name,
      totalHatch: vesselResult.data.total_hatch,
      eta: vesselResult.data.eta,
      startDate: vesselResult.data.start_discharge_date,
      status: vesselResult.data.status,
      createdBy: vesselResult.data.created_by,
      assignedCheckerId: form.assignedCheckerId,
      assignedCheckerName: checkerLookup[form.assignedCheckerId] || '-',
      hatchCargoRows: hatchResult.data.map((row) => ({
        id: row.id,
        hatchNo: row.hatch_no,
        hatchLabel: row.hatch_label,
        initialCargo: Number(row.initial_cargo) || 0,
      })),
    }

    setVessels((current) => {
      if (editingVessel) {
        return current.map((row) => (row.id === editingVessel.id ? newRow : row))
      }
      return [...current, newRow]
    })

    if (setHatchCargo) {
      setHatchCargo((current) => [
        ...current.filter((row) => row.vesselId !== vesselId),
        ...mapHatchCargoForApp(hatchResult.data),
      ])
    }

    setForm(emptyForm)
    setErrors({})
    setEditingVessel(null)
    setIsSubmitting(false)
  }

  function handleEdit(vessel) {
    setEditingVessel(vessel)
    setForm({
      vesselName: vessel.vesselName || '',
      cargoOwner: vessel.company || '',
      cargoType: vessel.cargo || '',
      destinationName: vessel.destination || '',
      assignedCheckerId: vessel.assignedCheckerId || '',
      totalHatch: vessel.totalHatch || 1,
      eta: vessel.eta ? String(vessel.eta).slice(0, 10) : '',
      startDischargeDate: vessel.startDate || '',
      status: vessel.status || 'pending',
      hatchCargoRows: createHatchCargoRows(
        vessel.totalHatch || 1,
        (vessel.hatchCargoRows || []).map((row) => ({
          hatchNo: row.hatchNo,
          initialCargo: row.initialCargo,
        })),
      ),
    })
    setErrors({})
  }

  function handleCancelEdit() {
    setEditingVessel(null)
    setForm(emptyForm)
    setErrors({})
  }

  async function handleStatusChange(vesselId, nextStatus) {
    setLoadError('')
    const result = await changeVesselStatus(vesselId, nextStatus)

    if (result.error) {
      setLoadError('Gagal mengubah status kapal.')
      return
    }

    setVessels((current) =>
      current.map((row) =>
        row.id === vesselId
          ? {
              ...row,
              status: result.data.status,
            }
          : row,
      ),
    )
  }

  const columns = [
    { key: 'vesselName', label: 'Nama Kapal' },
    { key: 'company', label: 'Cargo Owner', render: (row) => row.company || '-' },
    { key: 'cargo', label: 'Cargo Type' },
    { key: 'destination', label: 'Destination' },
    { key: 'assignedCheckerName', label: 'Assigned Checker' },
    { key: 'totalHatch', label: 'Total Hatch' },
    { key: 'startDate', label: 'Start Date', render: (row) => formatDate(row.startDate) },
    {
      key: 'totalCargo',
      label: 'Total Cargo',
      render: (row) =>
        formatMT(
          (row.hatchCargoRows || []).reduce(
            (total, hatch) => total + (Number(hatch.initialCargo) || 0),
            0,
          ),
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={statusVariant[row.status] || 'pending'}>{getStatusLabel(row.status)}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)} className="w-full">
            Edit
          </Button>
          <Select value={row.status} onChange={(event) => handleStatusChange(row.id, event.target.value)}>
            {statusOptions.map((statusOption) => (
              <option key={statusOption.value} value={statusOption.value}>
                {statusOption.label}
              </option>
            ))}
          </Select>
        </div>
      ),
    },
  ]

  const canCreate = checkers.length > 0

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cargo Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola informasi cargo, kapal, destination, FSP, dan checker assignment.
        </p>
      </div>

      <Card
        title={editingVessel ? 'Edit Kapal' : 'Tambah Kapal'}
        subtitle={
          canCreate
            ? 'Form ini menyimpan cargo information, Final Stowage Plan, dan checker assignment ke Supabase.'
            : 'Tidak dapat menambahkan cargo information karena profile checker belum tersedia.'
        }
      >
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat cargo information dan checker...</p>
        ) : !canCreate ? (
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5 text-sm text-yellow-800">
            Pastikan profile checker aktif sudah tersedia di Supabase.
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <Input
                  label="Vessel Name"
                  value={form.vesselName}
                  onChange={(event) => updateForm('vesselName', event.target.value)}
                />
                {errors.vesselName && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.vesselName}</p>
                )}
              </div>

              <div>
                <Input
                  label="Cargo Owner"
                  value={form.cargoOwner}
                  onChange={(event) => updateForm('cargoOwner', event.target.value)}
                />
                {errors.cargoOwner && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.cargoOwner}</p>
                )}
              </div>

              <div>
                <Input
                  label="Cargo Type"
                  value={form.cargoType}
                  onChange={(event) => updateForm('cargoType', event.target.value)}
                />
                {errors.cargoType && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.cargoType}</p>
                )}
              </div>

              <div>
                <Input
                  label="Destination"
                  value={form.destinationName}
                  onChange={(event) => updateForm('destinationName', event.target.value)}
                  placeholder="Contoh: GRP"
                />
                {errors.destinationName && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.destinationName}</p>
                )}
              </div>

              <div>
                <Select
                  label="Assigned Checker"
                  value={form.assignedCheckerId}
                  onChange={(event) => updateForm('assignedCheckerId', event.target.value)}
                >
                  <option value="">Pilih checker</option>
                  {checkers.map((checker) => (
                    <option key={checker.id} value={checker.id}>
                      {checker.full_name}
                    </option>
                  ))}
                </Select>
                {errors.assignedCheckerId && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.assignedCheckerId}</p>
                )}
              </div>

              <div>
                <Input
                  label="Start Discharge Date"
                  type="date"
                  value={form.startDischargeDate}
                  onChange={(event) => updateForm('startDischargeDate', event.target.value)}
                />
                {errors.startDischargeDate && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.startDischargeDate}</p>
                )}
              </div>

              <div>
                <Input
                  label="Total Hatch"
                  min="1"
                  type="number"
                  value={form.totalHatch}
                  onChange={(event) => updateForm('totalHatch', event.target.value)}
                />
                {errors.totalHatch && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.totalHatch}</p>
                )}
              </div>

              <div>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value)}
                >
                  {statusOptions.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>
                      {statusOption.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Final Stowage Plan</p>
                  <p className="text-sm text-slate-500">Input cargo awal per hatch dalam MT.</p>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  Total Cargo:{' '}
                  {formatMT(
                    form.hatchCargoRows.reduce(
                      (total, row) => total + parseTonnageInputToNumber(row.initialCargo),
                      0,
                    ),
                  )}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {form.hatchCargoRows.map((row) => (
                  <Input
                    key={row.hatchNo}
                    label={`H${row.hatchNo}`}
                    inputMode="numeric"
                    placeholder="40491"
                    value={row.initialCargo}
                    onChange={(event) => updateHatchCargoValue(row.hatchNo, event.target.value)}
                  />
                ))}
              </div>
              {errors.hatchCargoRows && (
                <p className="mt-2 text-sm font-semibold text-red-600">{errors.hatchCargoRows}</p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              {editingVessel && (
                <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                  Batalkan
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editingVessel
                    ? 'Update Cargo Information'
                    : 'Simpan Cargo Information'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Daftar Cargo Information" subtitle="Data cargo, FSP, dan checker assignment berasal dari Supabase.">
        <Table columns={columns} data={vessels} />
      </Card>
    </div>
  )
}

export default VesselDataPage
