import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import BarcodePhotoLink from '../components/ui/BarcodePhotoLink.jsx'
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
import { validateBarcodePhotoFile } from '../utils/barcodePhoto.js'
import {
  createDischargeEntry,
  getAssignedVesselsForChecker,
  getDischargeEntriesForChecker,
  getDischargeEntriesForVessel,
  getDischargeMutationError,
  updateDischargeEntry,
} from '../services/dischargeService.js'
import { uploadBarcodeReceiptPhoto } from '../services/storageService.js'
import {
  getDefaultGateTimeFields,
  getGateTimeFieldsFromEntry,
  getGateTimePayload,
  validateGateTimes,
} from '../utils/gateTimes.js'
import {
  buildDeliveryOrderNumber,
  getNextDeliveryOrderDigits,
  getNextScaleTicketNumber,
  normalizeDocumentDigits,
  parseDeliveryOrderDigits,
} from '../utils/documentNumbers.js'

const emptyForm = {
  vesselId: '',
  hatchCargoId: '',
  plateNumber: '',
  tonnage: '',
  deliveryOrderNumber: '',
  scaleTicketNumber: '',
  ...getDefaultGateTimeFields(),
  notes: '',
}

function getEmptyForm(overrides = {}) {
  return {
    ...emptyForm,
    ...getDefaultGateTimeFields(),
    ...overrides,
  }
}

function getCheckerId(currentUser) {
  return currentUser?.authUserId || currentUser?.id
}

function getOverDischargeWarning({ entries, excludeEntryId, hatchCargoId, initialCargo, tonnage }) {
  const numericInitialCargo = Number(initialCargo) || 0
  const numericTonnage = Number(tonnage) || 0

  if (!hatchCargoId || numericInitialCargo <= 0 || numericTonnage <= 0) {
    return null
  }

  const currentDischarge = (entries || []).reduce((total, entry) => {
    if (entry.id === excludeEntryId || entry.hatchCargoId !== hatchCargoId) return total
    return total + (Number(entry.tonnage) || 0)
  }, 0)
  const projectedDischarge = currentDischarge + numericTonnage

  if (projectedDischarge <= numericInitialCargo) {
    return null
  }

  return {
    currentDischarge,
    projectedDischarge,
    initialCargo: numericInitialCargo,
    excess: projectedDischarge - numericInitialCargo,
  }
}

function DischargeInputPage({ appState }) {
  const { setDischargeEntries, currentUser } = appState
  const [assignedVessels, setAssignedVessels] = useState([])
  const [entries, setEntries] = useState([])
  const [vesselNumberingEntries, setVesselNumberingEntries] = useState([])
  const [form, setForm] = useState(() => getEmptyForm())
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [editForm, setEditForm] = useState(() => getEmptyForm())
  const [editErrors, setEditErrors] = useState({})
  const [editError, setEditError] = useState('')
  const [isEditSaving, setIsEditSaving] = useState(false)
  const [editBarcodePhotoFile, setEditBarcodePhotoFile] = useState(null)
  const [editBarcodePhotoError, setEditBarcodePhotoError] = useState('')
  const [editBarcodePhotoPreviewUrl, setEditBarcodePhotoPreviewUrl] = useState('')
  const [editBarcodePhotoInputKey, setEditBarcodePhotoInputKey] = useState(0)
  const [barcodePhotoFile, setBarcodePhotoFile] = useState(null)
  const [barcodePhotoError, setBarcodePhotoError] = useState('')
  const [barcodePhotoInputKey, setBarcodePhotoInputKey] = useState(0)

  const checkerId = getCheckerId(currentUser)

  const selectedVessel = useMemo(
    () => assignedVessels.find((vessel) => vessel.id === form.vesselId) || assignedVessels[0],
    [assignedVessels, form.vesselId],
  )

  const hatches = selectedVessel?.hatchCargoRows || []
  const selectedVesselEntries = entries.filter((entry) => entry.vesselId === selectedVessel?.id)
  const editVessel =
    assignedVessels.find((vessel) => vessel.id === editForm.vesselId) || selectedVessel
  const editHatches = editVessel?.hatchCargoRows || []
  const selectedHatch = hatches.find((hatch) => hatch.id === form.hatchCargoId)
  const selectedEditHatch = editHatches.find((hatch) => hatch.id === editForm.hatchCargoId)
  const overDischargeWarning = getOverDischargeWarning({
    entries: vesselNumberingEntries,
    hatchCargoId: form.hatchCargoId,
    initialCargo: selectedHatch?.initialCargo,
    tonnage: parseTonnageInputToNumber(form.tonnage),
  })
  const editOverDischargeWarning = getOverDischargeWarning({
    entries: vesselNumberingEntries,
    excludeEntryId: editingEntry?.id,
    hatchCargoId: editForm.hatchCargoId,
    initialCargo: selectedEditHatch?.initialCargo,
    tonnage: parseTonnageInputToNumber(editForm.tonnage),
  })

  useEffect(() => {
    loadData()
  }, [checkerId])

  useEffect(() => {
    loadVesselNumberingEntries()
  }, [selectedVessel?.id])

  async function loadData() {
    if (!checkerId) {
      setIsLoading(false)
      setLoadError('User checker tidak ditemukan.')
      return
    }

    setIsLoading(true)
    setLoadError('')

    const [assignedResult, entriesResult] = await Promise.all([
      getAssignedVesselsForChecker(checkerId),
      getDischargeEntriesForChecker(checkerId),
    ])

    if (assignedResult.error) {
      setLoadError('Gagal memuat kapal assignment checker.')
    } else {
      setAssignedVessels(assignedResult.data)
      setForm((current) => ({
        ...current,
        vesselId: current.vesselId || assignedResult.data[0]?.id || '',
      }))
    }

    if (entriesResult.error) {
      setLoadError((current) => `${current} Gagal memuat riwayat input.`.trim())
    } else {
      setEntries(entriesResult.data)
      setDischargeEntries(entriesResult.data)
    }

    setIsLoading(false)
  }

  async function loadVesselNumberingEntries() {
    if (!selectedVessel?.id) {
      setVesselNumberingEntries([])
      return
    }

    const result = await getDischargeEntriesForVessel(selectedVessel.id)

    if (result.error) {
      setLoadError((current) => `${current} Gagal memuat nomor dokumen terakhir.`.trim())
      return
    }

    setVesselNumberingEntries(result.data)
    setForm((current) => {
      if (current.vesselId !== selectedVessel.id) return current

      return {
        ...current,
        deliveryOrderNumber: getNextDeliveryOrderDigits(result.data, selectedVessel.id),
        scaleTicketNumber: getNextScaleTicketNumber(result.data, selectedVessel.id),
      }
    })
  }

  function updateForm(field, value) {
    setForm((current) => {
      if (field === 'vesselId') {
        return {
          ...current,
          vesselId: value,
          hatchCargoId: '',
          deliveryOrderNumber: '',
          scaleTicketNumber: '',
        }
      }

      if (field === 'plateNumber') {
        return {
          ...current,
          plateNumber: value.toUpperCase(),
        }
      }

      if (field === 'deliveryOrderNumber' || field === 'scaleTicketNumber') {
        return {
          ...current,
          [field]: normalizeDocumentDigits(value),
        }
      }

      return {
        ...current,
        [field]: field === 'tonnage' ? formatTonnageInput(value) : value,
      }
    })
  }

  function updateEditForm(field, value) {
    if (field === 'plateNumber') {
      setEditForm((current) => ({
        ...current,
        plateNumber: value.toUpperCase(),
      }))
      return
    }

    if (field === 'deliveryOrderNumber' || field === 'scaleTicketNumber') {
      setEditForm((current) => ({
        ...current,
        [field]: normalizeDocumentDigits(value),
      }))
      return
    }

    setEditForm((current) => ({
      ...current,
      [field]: field === 'tonnage' ? formatTonnageInput(value) : value,
    }))
  }

  function resetBarcodePhotoInput() {
    setBarcodePhotoFile(null)
    setBarcodePhotoError('')
    setBarcodePhotoInputKey((current) => current + 1)
  }

  function handleBarcodePhotoChange(event) {
    const file = event.target.files?.[0] || null
    setBarcodePhotoError('')

    if (!file) {
      setBarcodePhotoFile(null)
      return
    }

    const validationError = validateBarcodePhotoFile(file)

    if (validationError) {
      setBarcodePhotoFile(null)
      setBarcodePhotoError(validationError)
      event.target.value = ''
      return
    }

    setBarcodePhotoFile(file)
  }

  function resetEditBarcodePhotoInput() {
    if (editBarcodePhotoPreviewUrl) {
      URL.revokeObjectURL(editBarcodePhotoPreviewUrl)
    }

    setEditBarcodePhotoFile(null)
    setEditBarcodePhotoError('')
    setEditBarcodePhotoPreviewUrl('')
    setEditBarcodePhotoInputKey((current) => current + 1)
  }

  function handleEditBarcodePhotoChange(event) {
    const file = event.target.files?.[0] || null
    setEditBarcodePhotoError('')

    if (editBarcodePhotoPreviewUrl) {
      URL.revokeObjectURL(editBarcodePhotoPreviewUrl)
      setEditBarcodePhotoPreviewUrl('')
    }

    if (!file) {
      setEditBarcodePhotoFile(null)
      return
    }

    const validationError = validateBarcodePhotoFile(file)

    if (validationError) {
      setEditBarcodePhotoFile(null)
      setEditBarcodePhotoError(validationError)
      event.target.value = ''
      return
    }

    setEditBarcodePhotoFile(file)
    setEditBarcodePhotoPreviewUrl(URL.createObjectURL(file))
  }

  function validateForm() {
    const nextErrors = {}
    const tonnage = parseTonnageInputToNumber(form.tonnage)

    if (!form.vesselId) nextErrors.vesselId = 'Kapal assignment wajib ada.'
    if (!form.hatchCargoId) nextErrors.hatchCargoId = 'Hatch wajib dipilih.'
    if (!form.plateNumber.trim()) nextErrors.plateNumber = 'Plat kendaraan wajib diisi.'
    if (!form.tonnage) nextErrors.tonnage = 'Tonnage wajib diisi.'
    else if (tonnage <= 0) nextErrors.tonnage = 'Tonnage wajib lebih dari 0.'
    if (!form.deliveryOrderNumber.trim()) {
      nextErrors.deliveryOrderNumber = 'No Surat Jalan wajib diisi.'
    } else if (!/^\d+$/.test(form.deliveryOrderNumber)) {
      nextErrors.deliveryOrderNumber = 'No Surat Jalan hanya boleh angka.'
    }
    if (!form.scaleTicketNumber.trim()) {
      nextErrors.scaleTicketNumber = 'No SJ Timbangan wajib diisi.'
    } else if (!/^\d+$/.test(form.scaleTicketNumber)) {
      nextErrors.scaleTicketNumber = 'No SJ Timbangan hanya boleh angka.'
    }
    Object.assign(nextErrors, validateGateTimes(form))

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateEditForm() {
    const nextErrors = {}
    const tonnage = parseTonnageInputToNumber(editForm.tonnage)

    if (!editForm.hatchCargoId) nextErrors.hatchCargoId = 'Hatch wajib dipilih.'
    if (!editForm.plateNumber.trim()) nextErrors.plateNumber = 'Plat kendaraan wajib diisi.'
    if (!editForm.tonnage) nextErrors.tonnage = 'Tonnage wajib diisi.'
    else if (tonnage <= 0) nextErrors.tonnage = 'Tonnage wajib lebih dari 0.'
    if (!editForm.deliveryOrderNumber.trim()) {
      nextErrors.deliveryOrderNumber = 'No Surat Jalan wajib diisi.'
    } else if (!/^\d+$/.test(editForm.deliveryOrderNumber)) {
      nextErrors.deliveryOrderNumber = 'No Surat Jalan hanya boleh angka.'
    }
    if (!editForm.scaleTicketNumber.trim()) {
      nextErrors.scaleTicketNumber = 'No SJ Timbangan wajib diisi.'
    } else if (!/^\d+$/.test(editForm.scaleTicketNumber)) {
      nextErrors.scaleTicketNumber = 'No SJ Timbangan hanya boleh angka.'
    }
    Object.assign(nextErrors, validateGateTimes(editForm))

    setEditErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setLoadError('')

    if (!validateForm() || !checkerId || barcodePhotoError) return

    setIsSubmitting(true)

    let barcodePhotoUrl = null

    if (barcodePhotoFile) {
      const uploadResult = await uploadBarcodeReceiptPhoto({
        checkerId,
        deliveryOrderNumber: buildDeliveryOrderNumber(form.deliveryOrderNumber),
        file: barcodePhotoFile,
        vesselId: form.vesselId,
      })

      if (uploadResult.error) {
        setLoadError(uploadResult.error.message || 'Gagal upload foto barcode.')
        setIsSubmitting(false)
        return
      }

      barcodePhotoUrl = uploadResult.data?.publicUrl || null
    }

    const payload = {
      vessel_id: form.vesselId,
      hatch_cargo_id: form.hatchCargoId,
      checker_id: checkerId,
      plate_number: form.plateNumber.trim().toUpperCase(),
      tonnage: parseTonnageInputToNumber(form.tonnage),
      delivery_order_number: buildDeliveryOrderNumber(form.deliveryOrderNumber),
      scale_ticket_number: form.scaleTicketNumber.trim(),
      ...getGateTimePayload(form),
      notes: form.notes.trim() || null,
    }

    if (barcodePhotoUrl) {
      payload.barcode_photo_url = barcodePhotoUrl
    }

    const result = await createDischargeEntry(payload)

    if (result.error) {
      const friendlyError = getDischargeMutationError(result.error)
      setLoadError(friendlyError.message || 'Gagal menyimpan data truck.')
      setIsSubmitting(false)
      return
    }

    const nextVesselNumberingEntries = [result.data, ...vesselNumberingEntries]
    setEntries((current) => [result.data, ...current])
    setVesselNumberingEntries(nextVesselNumberingEntries)
    setDischargeEntries((current) => [result.data, ...current])
    setForm(getEmptyForm({
      vesselId: form.vesselId,
      deliveryOrderNumber: getNextDeliveryOrderDigits(nextVesselNumberingEntries, form.vesselId),
      scaleTicketNumber: getNextScaleTicketNumber(nextVesselNumberingEntries, form.vesselId),
    }))
    setErrors({})
    resetBarcodePhotoInput()
    setMessage('Data truck berhasil disimpan.')
    setIsSubmitting(false)
  }

  function handleEdit(entry) {
    setEditingEntry(entry)
    setEditForm({
      vesselId: entry.vesselId,
      hatchCargoId: entry.hatchCargoId,
      plateNumber: entry.plateNumber,
      tonnage: formatTonnageInputFromNumber(entry.tonnage),
      deliveryOrderNumber: parseDeliveryOrderDigits(entry.deliveryOrderNumber),
      scaleTicketNumber: normalizeDocumentDigits(entry.scaleTicketNumber),
      ...getGateTimeFieldsFromEntry(entry),
      notes: entry.notes || '',
    })
    setEditErrors({})
    setEditError('')
    setMessage('')
    setLoadError('')
    resetEditBarcodePhotoInput()
  }

  function handleCancelEdit() {
    setEditingEntry(null)
    setEditForm(getEmptyForm())
    setEditErrors({})
    setEditError('')
    resetEditBarcodePhotoInput()
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    if (!editingEntry || !validateEditForm() || editBarcodePhotoError) return

    setIsEditSaving(true)
    setEditError('')
    setMessage('')
    setLoadError('')

    let uploadedBarcodePhotoUrl = ''

    if (editBarcodePhotoFile) {
      const uploadResult = await uploadBarcodeReceiptPhoto({
        checkerId,
        deliveryOrderNumber: buildDeliveryOrderNumber(editForm.deliveryOrderNumber),
        file: editBarcodePhotoFile,
        vesselId: editForm.vesselId,
      })

      if (uploadResult.error) {
        setEditError(uploadResult.error.message || 'Gagal upload foto barcode.')
        setIsEditSaving(false)
        return
      }

      uploadedBarcodePhotoUrl = uploadResult.data?.publicUrl || ''
    }

    const payload = {
      vessel_id: editForm.vesselId,
      hatch_cargo_id: editForm.hatchCargoId,
      checker_id: checkerId,
      plate_number: editForm.plateNumber.trim().toUpperCase(),
      tonnage: parseTonnageInputToNumber(editForm.tonnage),
      delivery_order_number: buildDeliveryOrderNumber(editForm.deliveryOrderNumber),
      scale_ticket_number: editForm.scaleTicketNumber.trim(),
      ...getGateTimePayload(editForm),
      notes: editForm.notes.trim() || null,
    }

    if (uploadedBarcodePhotoUrl) {
      payload.barcode_photo_url = uploadedBarcodePhotoUrl
    }

    const result = await updateDischargeEntry(editingEntry.id, payload)

    if (result.error) {
      const friendlyError = getDischargeMutationError(result.error)
      const orphanNote = uploadedBarcodePhotoUrl
        ? ' Foto baru sudah terupload tetapi data gagal diupdate; file baru mungkin orphan di storage.'
        : ''
      setEditError(`${friendlyError.message || 'Gagal mengupdate data truck.'}${orphanNote}`)
      setIsEditSaving(false)
      return
    }

    setEntries((current) =>
      current.map((entry) => (entry.id === editingEntry.id ? result.data : entry)),
    )
    setVesselNumberingEntries((current) =>
      current.map((entry) => (entry.id === editingEntry.id ? result.data : entry)),
    )
    setDischargeEntries((current) =>
      current.map((entry) => (entry.id === editingEntry.id ? result.data : entry)),
    )
    setEditingEntry(null)
    setEditForm(getEmptyForm())
    setEditErrors({})
    setEditError('')
    resetEditBarcodePhotoInput()
    setMessage('Data truck berhasil diupdate.')
    setIsEditSaving(false)
  }

  const recentColumns = [
    { key: 'plateNumber', label: 'Plat' },
    { key: 'hatch', label: 'Hatch' },
    { key: 'tonnage', label: 'Tonnage', render: (row) => formatMT(row.tonnage) },
    { key: 'deliveryOrderNumber', label: 'No Surat Jalan' },
    { key: 'scaleTicketNumber', label: 'No SJ Timbangan' },
    { key: 'barcodePhotoUrl', label: 'Foto Barcode', render: (row) => <BarcodePhotoLink url={row.barcodePhotoUrl} /> },
    { key: 'gateInDate', label: 'Gate In Date', render: (row) => formatDate(row.gateInDate) },
    { key: 'gateInTime', label: 'Gate In Time' },
    { key: 'gateOutDate', label: 'Gate Out Date', render: (row) => formatDate(row.gateOutDate) },
    { key: 'gateOutTime', label: 'Gate Out Time' },
    { key: 'notes', label: 'Notes', render: (row) => row.notes || '-' },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row) => (
        <Button type="button" variant="secondary" onClick={() => handleEdit(row)}>
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Input Data Checker</h2>
        <p className="mt-1 text-sm text-slate-500">
          Input data truck keluar. Kapal dan destination mengikuti assignment checker.
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

      <Card title="Kapal Assignment" subtitle="Data ini otomatis dari checker assignment Supabase.">
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat assignment checker...</p>
        ) : assignedVessels.length === 0 ? (
          <p className="text-sm font-semibold text-slate-600">
            Belum ada kapal aktif yang di-assign ke checker ini.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Select
              label="Vessel Assignment"
              value={form.vesselId}
              onChange={(event) => updateForm('vesselId', event.target.value)}
            >
              {assignedVessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.vesselName}
                </option>
              ))}
            </Select>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Company</p>
              <p className="mt-1 font-bold text-slate-900">{selectedVessel?.company || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Cargo</p>
              <p className="mt-1 font-bold text-slate-900">{selectedVessel?.cargo || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Destination</p>
              <p className="mt-1 font-bold text-slate-900">{selectedVessel?.destination || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Total Hatch</p>
              <p className="mt-1 font-bold text-slate-900">{selectedVessel?.totalHatch || 0}</p>
            </div>
          </div>
        )}
      </Card>

      <Card title="Form Input Data Truck">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Truck Information</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Data utama truck, cargo, dan dokumen lapangan.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <Input
                  label="Plate Number"
                  value={form.plateNumber}
                  onChange={(event) => updateForm('plateNumber', event.target.value)}
                  disabled={assignedVessels.length === 0}
                />
                {errors.plateNumber && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.plateNumber}</p>
                )}
              </div>

              <div>
                <Select
                  label="Hatch"
                  value={form.hatchCargoId}
                  onChange={(event) => updateForm('hatchCargoId', event.target.value)}
                  disabled={assignedVessels.length === 0}
                >
                  <option value="">Pilih hatch</option>
                  {hatches.map((hatch) => (
                    <option key={hatch.id} value={hatch.id}>
                      {hatch.hatchLabel}
                    </option>
                  ))}
                </Select>
                {errors.hatchCargoId && (
                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {errors.hatchCargoId}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="Tonnage"
                  inputMode="numeric"
                  placeholder="40491"
                  value={form.tonnage}
                  onChange={(event) => updateForm('tonnage', event.target.value)}
                  disabled={assignedVessels.length === 0}
                />
                {errors.tonnage && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.tonnage}</p>
                )}
                {overDischargeWarning && (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    Perhatian: proyeksi discharge hatch ini menjadi{' '}
                    {formatMT(overDischargeWarning.projectedDischarge)}, melebihi initial cargo{' '}
                    {formatMT(overDischargeWarning.initialCargo)}. Data tetap bisa disimpan karena
                    selisih lapangan mungkin terjadi.
                  </div>
                )}
              </div>

              <div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-slate-700">
                    No Surat Jalan
                  </span>
                  <div className="flex min-h-10 overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-red-700 focus-within:ring-4 focus-within:ring-red-100">
                    <span className="inline-flex items-center border-r border-slate-300 bg-slate-100 px-3 text-sm font-extrabold text-slate-700">
                      DT
                    </span>
                    <input
                      className="min-h-10 w-full bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      disabled={assignedVessels.length === 0}
                      inputMode="numeric"
                      onBlur={() =>
                        updateForm(
                          'deliveryOrderNumber',
                          parseDeliveryOrderDigits(form.deliveryOrderNumber),
                        )
                      }
                      onChange={(event) => updateForm('deliveryOrderNumber', event.target.value)}
                      placeholder="0001"
                      value={form.deliveryOrderNumber}
                    />
                  </div>
                </label>
                {errors.deliveryOrderNumber && (
                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {errors.deliveryOrderNumber}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="No SJ Timbangan"
                  value={form.scaleTicketNumber}
                  onChange={(event) => updateForm('scaleTicketNumber', event.target.value)}
                  disabled={assignedVessels.length === 0}
                />
                {errors.scaleTicketNumber && (
                  <p className="mt-1 text-sm font-semibold text-red-600">
                    {errors.scaleTicketNumber}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <Input
                  label="Notes"
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                  disabled={assignedVessels.length === 0}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">🚚 Operational Timeline</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Gate In dan Gate Out diisi sesuai waktu kejadian lapangan.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-4 rounded-lg border border-blue-100 border-l-4 border-l-blue-500 bg-blue-50/40 p-4">
                <h4 className="text-sm font-bold text-slate-900">🚚 Gate In</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Input
                      label="Gate In Date"
                      type="date"
                      value={form.gateInDate}
                      onChange={(event) => updateForm('gateInDate', event.target.value)}
                      disabled={assignedVessels.length === 0}
                    />
                    {errors.gateInDate && (
                      <p className="mt-1 text-sm font-semibold text-red-600">
                        {errors.gateInDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Gate In Time"
                      type="time"
                      value={form.gateInTime}
                      onChange={(event) => updateForm('gateInTime', event.target.value)}
                      disabled={assignedVessels.length === 0}
                    />
                    {errors.gateInTime && (
                      <p className="mt-1 text-sm font-semibold text-red-600">
                        {errors.gateInTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-lg border border-orange-100 border-l-4 border-l-orange-500 bg-orange-50/40 p-4">
                <h4 className="text-sm font-bold text-slate-900">🚪 Gate Out</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Input
                      label="Gate Out Date"
                      type="date"
                      value={form.gateOutDate}
                      onChange={(event) => updateForm('gateOutDate', event.target.value)}
                      disabled={assignedVessels.length === 0}
                    />
                    {errors.gateOutDate && (
                      <p className="mt-1 text-sm font-semibold text-red-600">
                        {errors.gateOutDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Gate Out Time"
                      type="time"
                      value={form.gateOutTime}
                      onChange={(event) => updateForm('gateOutTime', event.target.value)}
                      disabled={assignedVessels.length === 0}
                    />
                    {errors.gateOutTime && (
                      <p className="mt-1 text-sm font-semibold text-red-600">
                        {errors.gateOutTime}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-3 rounded-xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">📷 Documentation</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Upload foto struk barcode sebagai bukti dokumen lapangan.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50/50 p-3">
              <Input
                className="cursor-pointer"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={assignedVessels.length === 0}
                key={barcodePhotoInputKey}
                label="Foto Struk Barcode"
                onChange={handleBarcodePhotoChange}
                type="file"
              />
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Format JPG, JPEG, PNG, atau WebP. Maksimal 5 MB.
              </p>
              {barcodePhotoFile && (
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  File dipilih: {barcodePhotoFile.name}
                </p>
              )}
              {barcodePhotoError && (
                <p className="mt-1 text-sm font-semibold text-red-600">{barcodePhotoError}</p>
              )}
              {(barcodePhotoFile || barcodePhotoError) && (
                <div>
                  <Button type="button" variant="secondary" onClick={resetBarcodePhotoInput}>
                    Hapus Pilihan Foto
                  </Button>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500">
              Gate In dan Gate Out diisi sesuai waktu kejadian lapangan.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting || assignedVessels.length === 0}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {editingEntry && (
        <Modal isOpen={Boolean(editingEntry)} onClose={handleCancelEdit} title="Edit Data Truck">
          <form className="grid gap-5" onSubmit={handleEditSubmit}>
            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {editError}
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase text-slate-500">Editing Record</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {editingEntry.plateNumber || '-'} · {editingEntry.hatch || '-'} ·{' '}
                {formatMT(editingEntry.tonnage)}
              </p>
            </div>

            <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Truck Details</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Koreksi data truck, cargo, dan dokumen lapangan.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <Input
                    label="Plate Number"
                    value={editForm.plateNumber}
                    onChange={(event) => updateEditForm('plateNumber', event.target.value)}
                  />
                  {editErrors.plateNumber && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {editErrors.plateNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Select
                    label="Hatch"
                    value={editForm.hatchCargoId}
                    onChange={(event) => updateEditForm('hatchCargoId', event.target.value)}
                  >
                    <option value="">Pilih hatch</option>
                    {editHatches.map((hatch) => (
                      <option key={hatch.id} value={hatch.id}>
                        {hatch.hatchLabel}
                      </option>
                    ))}
                  </Select>
                  {editErrors.hatchCargoId && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {editErrors.hatchCargoId}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="Tonnage"
                    inputMode="numeric"
                    placeholder="40491"
                    value={editForm.tonnage}
                    onChange={(event) => updateEditForm('tonnage', event.target.value)}
                  />
                  {editErrors.tonnage && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {editErrors.tonnage}
                    </p>
                  )}
                  {editOverDischargeWarning && (
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                      Perhatian: proyeksi discharge hatch ini menjadi{' '}
                      {formatMT(editOverDischargeWarning.projectedDischarge)}, melebihi initial
                      cargo {formatMT(editOverDischargeWarning.initialCargo)}. Data tetap bisa
                      disimpan karena selisih lapangan mungkin terjadi.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-slate-700">
                      No Surat Jalan
                    </span>
                    <div className="flex min-h-10 overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm focus-within:border-red-700 focus-within:ring-4 focus-within:ring-red-100">
                      <span className="inline-flex items-center border-r border-slate-300 bg-slate-100 px-3 text-sm font-extrabold text-slate-700">
                        DT
                      </span>
                      <input
                        className="min-h-10 w-full bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                        inputMode="numeric"
                        onBlur={() =>
                          updateEditForm(
                            'deliveryOrderNumber',
                            parseDeliveryOrderDigits(editForm.deliveryOrderNumber),
                          )
                        }
                        onChange={(event) => updateEditForm('deliveryOrderNumber', event.target.value)}
                        placeholder="0001"
                        value={editForm.deliveryOrderNumber}
                      />
                    </div>
                  </label>
                  {editErrors.deliveryOrderNumber && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {editErrors.deliveryOrderNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="No SJ Timbangan"
                    value={editForm.scaleTicketNumber}
                    onChange={(event) => updateEditForm('scaleTicketNumber', event.target.value)}
                  />
                  {editErrors.scaleTicketNumber && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {editErrors.scaleTicketNumber}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 xl:col-span-3">
                  <Input
                    label="Notes"
                    value={editForm.notes}
                    onChange={(event) => updateEditForm('notes', event.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <h4 className="text-sm font-bold text-slate-900">🚚 Operational Timeline</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Sesuaikan waktu Gate In dan Gate Out dengan kejadian lapangan.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-4 rounded-lg border border-blue-100 border-l-4 border-l-blue-500 bg-blue-50/40 p-4">
                  <h5 className="text-sm font-bold text-slate-900">🚚 Gate In</h5>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Input
                        label="Gate In Date"
                        type="date"
                        value={editForm.gateInDate}
                        onChange={(event) => updateEditForm('gateInDate', event.target.value)}
                      />
                      {editErrors.gateInDate && (
                        <p className="mt-1 text-sm font-semibold text-red-600">
                          {editErrors.gateInDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        label="Gate In Time"
                        type="time"
                        value={editForm.gateInTime}
                        onChange={(event) => updateEditForm('gateInTime', event.target.value)}
                      />
                      {editErrors.gateInTime && (
                        <p className="mt-1 text-sm font-semibold text-red-600">
                          {editErrors.gateInTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 rounded-lg border border-orange-100 border-l-4 border-l-orange-500 bg-orange-50/40 p-4">
                  <h5 className="text-sm font-bold text-slate-900">🚪 Gate Out</h5>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Input
                        label="Gate Out Date"
                        type="date"
                        value={editForm.gateOutDate}
                        onChange={(event) => updateEditForm('gateOutDate', event.target.value)}
                      />
                      {editErrors.gateOutDate && (
                        <p className="mt-1 text-sm font-semibold text-red-600">
                          {editErrors.gateOutDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <Input
                        label="Gate Out Time"
                        type="time"
                        value={editForm.gateOutTime}
                        onChange={(event) => updateEditForm('gateOutTime', event.target.value)}
                      />
                      {editErrors.gateOutTime && (
                        <p className="mt-1 text-sm font-semibold text-red-600">
                          {editErrors.gateOutTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-3 rounded-xl border border-slate-200 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm">
              <div>
                <h4 className="text-sm font-bold text-slate-900">📷 Documentation</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Foto lama tetap dipakai jika tidak memilih foto baru.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="mb-2 text-sm font-bold text-slate-700">Foto Struk Barcode</p>
                {editBarcodePhotoPreviewUrl ? (
                  <img
                    alt="Preview foto barcode baru"
                    className="h-28 w-28 rounded border border-slate-200 object-cover"
                    src={editBarcodePhotoPreviewUrl}
                  />
                ) : (
                  <BarcodePhotoLink url={editingEntry.barcodePhotoUrl} />
                )}
                <div className="mt-3">
                  <Input
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    key={editBarcodePhotoInputKey}
                    label="Ganti Foto Barcode (Opsional)"
                    onChange={handleEditBarcodePhotoChange}
                    type="file"
                  />
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Format JPG, JPEG, PNG, atau WebP. Maksimal 5 MB.
                  </p>
                  {editBarcodePhotoFile && (
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      File baru dipilih: {editBarcodePhotoFile.name}
                    </p>
                  )}
                  {editBarcodePhotoError && (
                    <p className="mt-1 text-sm font-semibold text-red-600">
                      {editBarcodePhotoError}
                    </p>
                  )}
                  {(editBarcodePhotoFile || editBarcodePhotoError) && (
                    <Button type="button" variant="secondary" onClick={resetEditBarcodePhotoInput}>
                      Hapus Pilihan Foto
                    </Button>
                  )}
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 -mx-5 -mb-5 flex justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditSaving}>
                {isEditSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Card title="Input Terakhir" subtitle="Riwayat milik checker untuk kapal yang dipilih.">
        <Table
          className="[&_table]:min-w-full"
          columns={recentColumns}
          data={selectedVesselEntries.slice(0, 5)}
          emptyMessage="Belum ada data input."
        />
      </Card>
    </div>
  )
}

export default DischargeInputPage
