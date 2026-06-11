import { useEffect, useMemo, useState } from 'react'
import BarcodePhotoLink from '../components/ui/BarcodePhotoLink.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Modal from '../components/ui/Modal.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import {
  getDischargeEntriesForVessel,
  getDischargeMutationError,
  updateDischargeEntry,
} from '../services/dischargeService.js'
import { uploadBarcodeReceiptPhoto } from '../services/storageService.js'
import { getActiveVesselsForReports } from '../services/reportService.js'
import { getHatchCargoByVesselIds } from '../services/vesselService.js'
import { validateBarcodePhotoFile } from '../utils/barcodePhoto.js'
import { formatDate, formatMT } from '../utils/formatters.js'
import {
  formatTonnageInput,
  formatTonnageInputFromNumber,
  parseTonnageInputToNumber,
} from '../utils/tonnageInput.js'
import {
  getDefaultGateTimeFields,
  getGateTimeFieldsFromEntry,
  getGateTimePayload,
  validateGateTimes,
} from '../utils/gateTimes.js'

const emptyForm = {
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

function InputMonitoringPage({ appState }) {
  const { currentUser, setDischargeEntries } = appState
  const [vessels, setVessels] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [hatches, setHatches] = useState([])
  const [entries, setEntries] = useState([])
  const [editingEntry, setEditingEntry] = useState(null)
  const [form, setForm] = useState(() => getEmptyForm())
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [barcodePhotoError, setBarcodePhotoError] = useState('')
  const [barcodePhotoFile, setBarcodePhotoFile] = useState(null)
  const [barcodePhotoPreviewUrl, setBarcodePhotoPreviewUrl] = useState('')
  const [barcodePhotoInputKey, setBarcodePhotoInputKey] = useState(0)

  const selectedVessel = useMemo(
    () => vessels.find((vessel) => vessel.id === selectedVesselId) || vessels[0],
    [selectedVesselId, vessels],
  )

  useEffect(() => {
    loadVessels()
  }, [currentUser?.id])

  useEffect(() => {
    loadMonitoringData()
  }, [selectedVessel?.id])

  async function loadVessels() {
    setIsLoading(true)
    setLoadError('')

    const result = await getActiveVesselsForReports({
      ...currentUser,
      role: 'admin',
    })

    if (result.error) {
      setLoadError('Gagal memuat vessel aktif.')
      setIsLoading(false)
      return
    }

    setVessels(result.data)
    setSelectedVesselId((current) => current || result.data[0]?.id || '')
    setIsLoading(false)
  }

  async function loadMonitoringData() {
    if (!selectedVessel?.id) {
      setEntries([])
      setHatches([])
      return
    }

    setLoadError('')
    setMessage('')

    const [entriesResult, hatchResult] = await Promise.all([
      getDischargeEntriesForVessel(selectedVessel.id),
      getHatchCargoByVesselIds([selectedVessel.id]),
    ])

    if (entriesResult.error) {
      setLoadError('Gagal memuat input checker.')
    } else {
      setEntries(entriesResult.data)
      setDischargeEntries(entriesResult.data)
    }

    if (hatchResult.error) {
      setLoadError((current) => `${current} Gagal memuat hatch vessel.`.trim())
    } else {
      setHatches(
        hatchResult.data.map((row) => ({
          id: row.id,
          hatchNo: row.hatch_no,
          hatchLabel: row.hatch_label || `H${row.hatch_no}`,
        })),
      )
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: field === 'tonnage' ? formatTonnageInput(value) : value,
    }))
  }

  function resetBarcodePhotoInput() {
    if (barcodePhotoPreviewUrl) {
      URL.revokeObjectURL(barcodePhotoPreviewUrl)
    }

    setBarcodePhotoError('')
    setBarcodePhotoFile(null)
    setBarcodePhotoPreviewUrl('')
    setBarcodePhotoInputKey((current) => current + 1)
  }

  function handleBarcodePhotoChange(event) {
    const file = event.target.files?.[0] || null
    setBarcodePhotoError('')

    if (barcodePhotoPreviewUrl) {
      URL.revokeObjectURL(barcodePhotoPreviewUrl)
      setBarcodePhotoPreviewUrl('')
    }

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
    setBarcodePhotoPreviewUrl(URL.createObjectURL(file))
  }

  function validateForm() {
    const nextErrors = {}
    const tonnage = parseTonnageInputToNumber(form.tonnage)

    if (!form.hatchCargoId) nextErrors.hatchCargoId = 'Hatch wajib dipilih.'
    if (!form.plateNumber.trim()) nextErrors.plateNumber = 'Plate number wajib diisi.'
    if (!form.tonnage) nextErrors.tonnage = 'Tonnage wajib diisi.'
    else if (tonnage <= 0) nextErrors.tonnage = 'Tonnage wajib lebih dari 0.'
    if (!form.deliveryOrderNumber.trim()) {
      nextErrors.deliveryOrderNumber = 'No Surat Jalan wajib diisi.'
    }
    if (!form.scaleTicketNumber.trim()) {
      nextErrors.scaleTicketNumber = 'No SJ Timbangan wajib diisi.'
    }
    Object.assign(nextErrors, validateGateTimes(form))

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleEdit(entry) {
    setEditingEntry(entry)
    setForm({
      hatchCargoId: entry.hatchCargoId,
      plateNumber: entry.plateNumber,
      tonnage: formatTonnageInputFromNumber(entry.tonnage),
      deliveryOrderNumber: entry.deliveryOrderNumber,
      scaleTicketNumber: entry.scaleTicketNumber,
      ...getGateTimeFieldsFromEntry(entry),
      notes: entry.notes || '',
    })
    setErrors({})
    setMessage('')
    setLoadError('')
    resetBarcodePhotoInput()
  }

  function handleCancelEdit() {
    setEditingEntry(null)
    setForm(getEmptyForm())
    setErrors({})
    resetBarcodePhotoInput()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!editingEntry || !selectedVessel || !validateForm() || barcodePhotoError) return

    setIsSaving(true)
    setLoadError('')
    setMessage('')

    let uploadedBarcodePhotoUrl = ''

    if (barcodePhotoFile) {
      const uploadResult = await uploadBarcodeReceiptPhoto({
        checkerId: editingEntry.checkerId,
        deliveryOrderNumber: form.deliveryOrderNumber.trim(),
        file: barcodePhotoFile,
        vesselId: selectedVessel.id,
      })

      if (uploadResult.error) {
        setLoadError(uploadResult.error.message || 'Gagal upload foto barcode.')
        setIsSaving(false)
        return
      }

      uploadedBarcodePhotoUrl = uploadResult.data?.publicUrl || ''
    }

    const payload = {
      vessel_id: selectedVessel.id,
      hatch_cargo_id: form.hatchCargoId,
      checker_id: editingEntry.checkerId,
      plate_number: form.plateNumber.trim().toUpperCase(),
      tonnage: parseTonnageInputToNumber(form.tonnage),
      delivery_order_number: form.deliveryOrderNumber.trim(),
      scale_ticket_number: form.scaleTicketNumber.trim(),
      ...getGateTimePayload(form),
      notes: form.notes.trim() || null,
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
      setLoadError(`${friendlyError.message || 'Gagal mengupdate input checker.'}${orphanNote}`)
      setIsSaving(false)
      return
    }

    setEntries((current) =>
      current.map((entry) => (entry.id === editingEntry.id ? result.data : entry)),
    )
    setDischargeEntries((current) =>
      current.map((entry) => (entry.id === editingEntry.id ? result.data : entry)),
    )
    setEditingEntry(null)
    setForm(getEmptyForm())
    setErrors({})
    resetBarcodePhotoInput()
    setMessage('Input checker berhasil dikoreksi.')
    setIsSaving(false)
  }

  const columns = [
    { key: 'gateInDate', label: 'Gate In Date', render: (row) => formatDate(row.gateInDate) },
    { key: 'gateInTime', label: 'Gate In Time' },
    { key: 'gateOutDate', label: 'Gate Out Date', render: (row) => formatDate(row.gateOutDate) },
    { key: 'gateOutTime', label: 'Gate Out Time' },
    { key: 'checkerName', label: 'Checker' },
    { key: 'plateNumber', label: 'Plate Number' },
    { key: 'hatch', label: 'Hatch' },
    { key: 'tonnage', label: 'Tonnage', render: (row) => formatMT(row.tonnage) },
    { key: 'deliveryOrderNumber', label: 'No Surat Jalan' },
    { key: 'scaleTicketNumber', label: 'No SJ Timbangan' },
    { key: 'barcodePhotoUrl', label: 'Foto Barcode', render: (row) => <BarcodePhotoLink url={row.barcodePhotoUrl} /> },
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
        <h2 className="text-2xl font-bold text-slate-900">Input Monitoring</h2>
        <p className="mt-1 text-sm text-slate-500">
          Monitoring dan koreksi input checker berdasarkan vessel aktif.
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

      <Card title="Filter Vessel">
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat vessel aktif...</p>
        ) : (
          <div className="max-w-md">
            <Select
              label="Vessel"
              value={selectedVessel?.id || ''}
              onChange={(event) => {
                setSelectedVesselId(event.target.value)
                handleCancelEdit()
              }}
            >
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.vesselName}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      {editingEntry && (
        <Modal isOpen={Boolean(editingEntry)} onClose={handleCancelEdit} title="Edit Input Checker">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <Select
                  label="Hatch"
                  value={form.hatchCargoId}
                  onChange={(event) => updateForm('hatchCargoId', event.target.value)}
                >
                  <option value="">Pilih hatch</option>
                  {hatches.map((hatch) => (
                    <option key={hatch.id} value={hatch.id}>
                      {hatch.hatchLabel}
                    </option>
                  ))}
                </Select>
                {errors.hatchCargoId && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.hatchCargoId}</p>
                )}
              </div>

              <div>
                <Input
                  label="Plate Number"
                  value={form.plateNumber}
                  onChange={(event) => updateForm('plateNumber', event.target.value)}
                />
                {errors.plateNumber && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.plateNumber}</p>
                )}
              </div>

              <div>
                <Input
                  label="Tonnage"
                  inputMode="numeric"
                  placeholder="40491"
                  value={form.tonnage}
                  onChange={(event) => updateForm('tonnage', event.target.value)}
                />
                {errors.tonnage && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.tonnage}</p>
                )}
              </div>

              <div>
                <Input
                  label="No Surat Jalan"
                  value={form.deliveryOrderNumber}
                  onChange={(event) => updateForm('deliveryOrderNumber', event.target.value)}
                />
                {errors.deliveryOrderNumber && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.deliveryOrderNumber}</p>
                )}
              </div>

              <div>
                <Input
                  label="No SJ Timbangan"
                  value={form.scaleTicketNumber}
                  onChange={(event) => updateForm('scaleTicketNumber', event.target.value)}
                />
                {errors.scaleTicketNumber && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.scaleTicketNumber}</p>
                )}
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <Input
                  label="Notes"
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Gate In Date"
                  type="date"
                  value={form.gateInDate}
                  onChange={(event) => updateForm('gateInDate', event.target.value)}
                />
                {errors.gateInDate && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.gateInDate}</p>
                )}
              </div>
              <div>
                <Input
                  label="Gate In Time"
                  type="time"
                  value={form.gateInTime}
                  onChange={(event) => updateForm('gateInTime', event.target.value)}
                />
                {errors.gateInTime && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.gateInTime}</p>
                )}
              </div>
              <div>
                <Input
                  label="Gate Out Date"
                  type="date"
                  value={form.gateOutDate}
                  onChange={(event) => updateForm('gateOutDate', event.target.value)}
                />
                {errors.gateOutDate && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.gateOutDate}</p>
                )}
              </div>
              <div>
                <Input
                  label="Gate Out Time"
                  type="time"
                  value={form.gateOutTime}
                  onChange={(event) => updateForm('gateOutTime', event.target.value)}
                />
                {errors.gateOutTime && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.gateOutTime}</p>
                )}
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <p className="mb-1.5 text-sm font-bold text-slate-700">Foto Struk Barcode</p>
                {barcodePhotoPreviewUrl ? (
                  <img
                    alt="Preview foto barcode baru"
                    className="h-28 w-28 rounded border border-slate-200 object-cover"
                    src={barcodePhotoPreviewUrl}
                  />
                ) : (
                  <BarcodePhotoLink url={editingEntry.barcodePhotoUrl} />
                )}
                <div className="mt-3">
                  <Input
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    key={barcodePhotoInputKey}
                    label="Ganti Foto Barcode (Opsional)"
                    onChange={handleBarcodePhotoChange}
                    type="file"
                  />
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Format JPG, JPEG, PNG, atau WebP. Maksimal 5 MB.
                  </p>
                  {barcodePhotoFile && (
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      File baru dipilih: {barcodePhotoFile.name}
                    </p>
                  )}
                  {barcodePhotoError && (
                    <p className="mt-1 text-sm font-semibold text-red-600">{barcodePhotoError}</p>
                  )}
                  {(barcodePhotoFile || barcodePhotoError) && (
                    <Button type="button" variant="secondary" onClick={resetBarcodePhotoInput}>
                      Hapus Pilihan Foto
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <Card title={selectedVessel?.vesselName || 'Input Checker'} subtitle="Seluruh input checker untuk vessel terpilih.">
        <Table columns={columns} data={entries} emptyMessage="Belum ada input checker untuk vessel ini." />
      </Card>
    </div>
  )
}

export default InputMonitoringPage
