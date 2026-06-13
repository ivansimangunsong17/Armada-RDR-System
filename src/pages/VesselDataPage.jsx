import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Modal from '../components/ui/Modal.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import { formatDate, formatMT } from '../utils/formatters.js'
import {
  formatTonnageInput,
  formatTonnageInputFromNumber,
  parseTonnageInputToNumber,
} from '../utils/tonnageInput.js'
import {
  addDestinationToVessel,
  changeVesselStatus,
  createVessel,
  deactivateVesselDestination,
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
  destinationOptionId: '',
  destinationRows: [],
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

function getDestinationKey(row) {
  return row.destinationId || String(row.name || '').trim().toLowerCase()
}

function isSameDestination(row, destinationId, destinationName) {
  if (destinationId && row.destinationId === destinationId) return true

  return String(row.name || '').trim().toLowerCase() === String(destinationName || '').trim().toLowerCase()
}

function getDestinationSummary(rows = []) {
  const activeRows = rows.filter((row) => row.isActive)
  const inactiveRows = rows.filter((row) => !row.isActive)
  const activeLabel = activeRows.map((row) => row.name).filter(Boolean).join(', ')

  if (!inactiveRows.length) return activeLabel || '-'

  return `${activeLabel || '-'} (${inactiveRows.length} inactive)`
}

function getVesselDestinationRows(vessel, destinationMap = {}) {
  const relationRows = (vessel.destinations || []).map((destination) => ({
    vesselDestinationId: destination.vesselDestinationId,
    destinationId: destination.destinationId,
    name: destination.name || destinationMap[destination.destinationId] || '-',
    isActive: destination.isActive !== false,
  }))

  if (relationRows.length > 0) {
    return relationRows
  }

  if (!vessel.destination_id && !vessel.destinationId) {
    return []
  }

  const destinationId = vessel.destination_id || vessel.destinationId

  return [
    {
      vesselDestinationId: '',
      destinationId,
      name: destinationMap[destinationId] || vessel.destination || destinationId,
      isActive: true,
    },
  ]
}

function VesselDataPage({ appState }) {
  const { vessels, setVessels, setHatchCargo, currentUser } = appState
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [destinationOptions, setDestinationOptions] = useState([])
  const [checkers, setCheckers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingVessel, setEditingVessel] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [isVesselReviewOpen, setIsVesselReviewOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)

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
    setDestinationOptions(nextDestinations)

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
          destinations: getVesselDestinationRows(item, destinationMap),
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

  function handleAddDestination() {
    const selectedDestination = destinationOptions.find(
      (destination) => destination.id === form.destinationOptionId,
    )
    const destinationName = selectedDestination?.name || form.destinationName.trim()
    const destinationId = selectedDestination?.id || ''

    if (!destinationName) {
      setErrors((current) => ({
        ...current,
        destinationRows: 'Pilih destination existing atau isi destination baru.',
      }))
      return
    }

    const existingRow = form.destinationRows.find((row) =>
      isSameDestination(row, destinationId, destinationName),
    )

    if (existingRow?.isActive) {
      setErrors((current) => ({
        ...current,
        destinationRows: 'Destination sudah aktif pada vessel ini.',
      }))
      return
    }

    setForm((current) => {
      if (existingRow) {
        return {
          ...current,
          destinationName: '',
          destinationOptionId: '',
          destinationRows: current.destinationRows.map((row) =>
            isSameDestination(row, destinationId, destinationName) ? { ...row, isActive: true } : row,
          ),
        }
      }

      return {
        ...current,
        destinationName: '',
        destinationOptionId: '',
        destinationRows: [
          ...current.destinationRows,
          {
            vesselDestinationId: '',
            destinationId,
            name: destinationName,
            isActive: true,
          },
        ],
      }
    })
    setErrors((current) => ({
      ...current,
      destinationRows: '',
    }))
  }

  function handleToggleDestination(destinationKey, isActive) {
    setForm((current) => ({
      ...current,
      destinationRows: current.destinationRows.map((row) =>
        getDestinationKey(row) === destinationKey ? { ...row, isActive } : row,
      ),
    }))
  }

  function validateForm() {
    const nextErrors = {}
    const activeDestinations = form.destinationRows.filter((row) => row.isActive)

    if (!form.vesselName.trim()) nextErrors.vesselName = 'Vessel name wajib diisi.'
    if (!form.cargoOwner.trim()) nextErrors.cargoOwner = 'Cargo owner wajib diisi.'
    if (!form.cargoType.trim()) nextErrors.cargoType = 'Cargo type wajib diisi.'
    if (activeDestinations.length === 0) {
      nextErrors.destinationRows = 'Minimal satu destination active wajib tersedia.'
    }
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

  function handleSubmit(event) {
    event.preventDefault()
    if (!validateForm()) return
    if (!currentUser) return

    setIsVesselReviewOpen(true)
  }

  async function handleConfirmVesselSave() {
    if (!currentUser) return

    setIsSubmitting(true)
    setLoadError('')

    const activeDestinationRows = form.destinationRows.filter((row) => row.isActive)
    const resolvedDestinationRows = []

    for (const row of activeDestinationRows) {
      const destinationResult = row.destinationId
        ? { data: { id: row.destinationId, name: row.name }, error: null }
        : await getOrCreateDestinationByName(row.name)

      if (destinationResult.error || !destinationResult.data) {
        setLoadError(`Gagal menyiapkan destination. ${destinationResult.error?.message || ''}`)
        setIsSubmitting(false)
        return
      }

      resolvedDestinationRows.push({
        ...row,
        destinationId: destinationResult.data.id,
        name: destinationResult.data.name || row.name,
      })
    }

    const primaryDestination = resolvedDestinationRows[0]

    if (!primaryDestination) {
      setLoadError('Minimal satu destination active wajib tersedia.')
      setIsSubmitting(false)
      return
    }

    const payload = {
      vessel_name: form.vesselName.trim(),
      cargo_owner: form.cargoOwner.trim(),
      cargo_type: form.cargoType.trim(),
      destination_id: primaryDestination.destinationId,
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

    for (const row of resolvedDestinationRows) {
      const result = await addDestinationToVessel(
        vesselId,
        row.destinationId,
        currentUser.authUserId || currentUser.id,
      )

      if (result.error) {
        setLoadError(`Kapal tersimpan, tetapi destination gagal disimpan. ${result.error.message || ''}`)
        setIsSubmitting(false)
        return
      }
    }

    const inactiveExistingRows = form.destinationRows.filter(
      (row) => !row.isActive && row.destinationId,
    )

    for (const row of inactiveExistingRows) {
      const result = await deactivateVesselDestination(vesselId, row.destinationId)

      if (result.error) {
        setLoadError(`Kapal tersimpan, tetapi destination gagal dinonaktifkan. ${result.error.message || ''}`)
        setIsSubmitting(false)
        return
      }
    }

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
      destination: primaryDestination.name,
      destinations: [
        ...resolvedDestinationRows,
        ...form.destinationRows.filter((row) => !row.isActive && row.destinationId),
      ],
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
    setIsVesselReviewOpen(false)
    setIsSubmitting(false)
  }

  function handleEdit(vessel) {
    setEditingVessel(vessel)
    setForm({
      vesselName: vessel.vesselName || '',
      cargoOwner: vessel.company || '',
      cargoType: vessel.cargo || '',
      destinationName: '',
      destinationOptionId: '',
      destinationRows: getVesselDestinationRows(vessel),
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
    if (isSubmitting) return
    setEditingVessel(null)
    setForm(emptyForm)
    setErrors({})
    setIsVesselReviewOpen(false)
  }

  function handleStatusChange(vessel, nextStatus) {
    if (vessel.status === nextStatus) return
    setPendingStatusChange({
      vessel,
      nextStatus,
    })
  }

  async function handleConfirmStatusChange() {
    if (!pendingStatusChange) return

    setLoadError('')
    const result = await changeVesselStatus(
      pendingStatusChange.vessel.id,
      pendingStatusChange.nextStatus,
    )

    if (result.error) {
      setLoadError('Gagal mengubah status kapal.')
      return
    }

    setVessels((current) =>
      current.map((row) =>
        row.id === pendingStatusChange.vessel.id
          ? {
              ...row,
              status: result.data.status,
            }
          : row,
        ),
    )
    setPendingStatusChange(null)
  }

  const columns = [
    {
      key: 'vessel',
      label: 'Cargo',
      render: (row) => (
        <div className="min-w-64">
          <p className="font-extrabold text-slate-900">{row.vesselName || '-'}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {row.company || '-'} / {row.cargo || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'destination',
      label: 'Destination',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800">{getDestinationSummary(row.destinations)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Start {formatDate(row.startDate)}
          </p>
        </div>
      ),
    },
    {
      key: 'assignedCheckerName',
      label: 'Checker',
      render: (row) => (
        <span className={row.assignedCheckerName && row.assignedCheckerName !== '-' ? 'font-semibold text-slate-700' : 'text-slate-400'}>
          {row.assignedCheckerName || '-'}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800">{row.totalHatch || 0} Hatch</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            FSP {(row.hatchCargoRows || []).length || 0} row
          </p>
        </div>
      ),
    },
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
        <div className="min-w-28">
          <Badge variant={statusVariant[row.status] || 'pending'}>{getStatusLabel(row.status)}</Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <div className="flex min-w-48 flex-col gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)} className="w-full justify-center">
            Edit
          </Button>
          <Select
            aria-label={`Status ${row.vesselName}`}
            className="min-w-40"
            value={row.status}
            onChange={(event) => handleStatusChange(row, event.target.value)}
          >
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
  const formTotalCargo = form.hatchCargoRows.reduce(
    (total, row) => total + parseTonnageInputToNumber(row.initialCargo),
    0,
  )
  const formCheckerName = checkerLookup[form.assignedCheckerId] || '-'
  const editingTotalCargo = editingVessel
    ? (editingVessel.hatchCargoRows || []).reduce(
        (total, hatch) => total + (Number(hatch.initialCargo) || 0),
        0,
      )
    : 0
  const vesselReviewRows = [
    ['Vessel Name', editingVessel?.vesselName || 'Data baru', form.vesselName.trim() || '-'],
    ['Cargo Owner', editingVessel?.company || 'Data baru', form.cargoOwner.trim() || '-'],
    ['Cargo Type', editingVessel?.cargo || 'Data baru', form.cargoType.trim() || '-'],
    [
      'Destinations',
      editingVessel ? getDestinationSummary(editingVessel.destinations) : 'Data baru',
      getDestinationSummary(form.destinationRows),
    ],
    ['Assigned Checker', editingVessel?.assignedCheckerName || 'Data baru', formCheckerName],
    ['Total Hatch', String(editingVessel?.totalHatch || 'Data baru'), String(form.totalHatch || '-')],
    [
      'Start Discharge Date',
      editingVessel?.startDate ? formatDate(editingVessel.startDate) : 'Data baru',
      form.startDischargeDate ? formatDate(form.startDischargeDate) : '-',
    ],
    [
      'Status',
      editingVessel ? getStatusLabel(editingVessel.status) : 'Data baru',
      getStatusLabel(form.status),
    ],
    [
      'Total Cargo',
      editingVessel ? formatMT(editingTotalCargo) : 'Data baru',
      formatMT(formTotalCargo),
    ],
  ].filter((row) => !editingVessel || row[1] !== row[2])
  const canConfirmVesselSave = !editingVessel || vesselReviewRows.length > 0

  function renderFormContainer(children) {
    const subtitle = canCreate
      ? 'Form ini menyimpan cargo information, Final Stowage Plan, dan checker assignment ke Supabase.'
      : 'Tidak dapat menambahkan cargo information karena profile checker belum tersedia.'

    if (editingVessel) {
      return (
        <Modal
          isOpen={Boolean(editingVessel)}
          onClose={handleCancelEdit}
          title={`Edit Cargo Information - ${editingVessel.vesselName || '-'}`}
        >
          {children}
        </Modal>
      )
    }

    return (
      <Card title="Tambah Kapal" subtitle={subtitle}>
        {children}
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cargo Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kelola informasi cargo, kapal, destination, FSP, dan checker assignment.
        </p>
      </div>

      {renderFormContainer(
        <>
        {editingVessel && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-extrabold">Mode edit aktif: {editingVessel.vesselName}</p>
            <p className="mt-1 font-semibold">
              Ubah data di form ini, lalu klik Update Cargo Information.
            </p>
          </div>
        )}

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

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-4">
                <p className="text-sm font-extrabold text-slate-900">Destinations</p>
                <p className="text-sm text-slate-500">
                  Tambahkan satu atau lebih destination untuk vessel ini. Perubahan disimpan saat klik Save.
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <Select
                  label="Existing Destination"
                  value={form.destinationOptionId}
                  onChange={(event) => updateForm('destinationOptionId', event.target.value)}
                >
                  <option value="">Pilih destination</option>
                  {destinationOptions.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.name}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Destination Baru"
                  value={form.destinationName}
                  onChange={(event) => updateForm('destinationName', event.target.value)}
                  placeholder="Contoh: GRP"
                />
                <div className="flex items-end">
                  <Button type="button" variant="secondary" onClick={handleAddDestination}>
                    Add
                  </Button>
                </div>
              </div>

              {errors.destinationRows && (
                <p className="mt-2 text-sm font-semibold text-red-600">{errors.destinationRows}</p>
              )}

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-extrabold">Destination</th>
                      <th className="px-4 py-3 font-extrabold">Status</th>
                      <th className="px-4 py-3 font-extrabold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form.destinationRows.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-4 text-center font-semibold text-slate-500">
                          Belum ada destination.
                        </td>
                      </tr>
                    ) : (
                      form.destinationRows.map((destination) => {
                        const destinationKey = getDestinationKey(destination)

                        return (
                          <tr key={destinationKey}>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {destination.name || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={destination.isActive ? 'active' : 'pending'}>
                                {destination.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {destination.isActive ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => handleToggleDestination(destinationKey, false)}
                                >
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => handleToggleDestination(destinationKey, true)}
                                >
                                  Reactivate
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
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
                    ? 'Review Update'
                    : 'Review Cargo Information'}
              </Button>
            </div>
          </form>
        )}
        </>,
      )}

      <Card title="Daftar Cargo Information" subtitle="Data cargo, FSP, dan checker assignment berasal dari Supabase.">
        <Table
          className="[&_tbody_tr]:align-top"
          columns={columns}
          data={vessels}
          emptyMessage="Belum ada cargo information."
          tableClassName="min-w-[1080px]"
        />
      </Card>

      <Modal
        isOpen={isVesselReviewOpen}
        onClose={() => {
          if (!isSubmitting) setIsVesselReviewOpen(false)
        }}
        title={editingVessel ? 'Validasi Perubahan Vessel' : 'Validasi Cargo Information Baru'}
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-extrabold">Validasi form lolos</p>
            <p className="mt-1 font-semibold">
              Periksa data vessel, FSP, dan assignment sebelum disimpan.
            </p>
          </div>

          {vesselReviewRows.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
              Tidak ada perubahan pada cargo information.
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
                  {vesselReviewRows.map(([field, before, after]) => (
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsVesselReviewOpen(false)}
              disabled={isSubmitting}
            >
              Kembali Edit
            </Button>
            <Button
              type="button"
              variant="success"
              disabled={isSubmitting || !canConfirmVesselSave}
              onClick={handleConfirmVesselSave}
            >
              {isSubmitting ? 'Menyimpan...' : 'Confirm Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(pendingStatusChange)}
        onClose={() => setPendingStatusChange(null)}
        title="Validasi Perubahan Status Vessel"
      >
        <div className="grid gap-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-extrabold">
              {pendingStatusChange?.vessel?.vesselName || '-'}
            </p>
            <p className="mt-1 font-semibold">
              Perubahan status akan langsung mempengaruhi visibilitas vessel di flow operasional.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-extrabold">Field</th>
                  <th className="px-4 py-3 font-extrabold">Sebelum</th>
                  <th className="px-4 py-3 font-extrabold">Sesudah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 font-bold text-slate-900">Status</td>
                  <td className="px-4 py-3 text-slate-600">
                    {getStatusLabel(pendingStatusChange?.vessel?.status)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {getStatusLabel(pendingStatusChange?.nextStatus)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <Button type="button" variant="secondary" onClick={() => setPendingStatusChange(null)}>
              Cancel
            </Button>
            <Button type="button" variant="success" onClick={handleConfirmStatusChange}>
              Confirm Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default VesselDataPage
