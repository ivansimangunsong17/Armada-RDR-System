import { useEffect, useMemo, useState } from 'react'
import BarcodePhotoLink from '../components/ui/BarcodePhotoLink.jsx'
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
  getAssignedVesselsForChecker,
  getDischargeEntriesForChecker,
  getDischargeMutationError,
  updateDischargeEntry,
} from '../services/dischargeService.js'
import { uploadBarcodeReceiptPhoto } from '../services/storageService.js'
import { validateBarcodePhotoFile } from '../utils/barcodePhoto.js'
import {
  getDefaultGateTimeFields,
  getGateTimeFieldsFromEntry,
  getGateTimePayload,
  validateGateTimes,
} from '../utils/gateTimes.js'
import {
  buildDeliveryOrderNumber,
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

const PAGE_SIZE = 10

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

function InputHistoryPage({ appState }) {
  const { setDischargeEntries, currentUser } = appState
  const [assignedVessels, setAssignedVessels] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [entries, setEntries] = useState([])
  const [editingEntry, setEditingEntry] = useState(null)
  const [form, setForm] = useState(() => getEmptyForm())
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [modalError, setModalError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEntriesLoading, setIsEntriesLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [barcodePhotoError, setBarcodePhotoError] = useState('')
  const [barcodePhotoFile, setBarcodePhotoFile] = useState(null)
  const [barcodePhotoPreviewUrl, setBarcodePhotoPreviewUrl] = useState('')
  const [barcodePhotoInputKey, setBarcodePhotoInputKey] = useState(0)

  const checkerId = getCheckerId(currentUser)
  const selectedVessel = useMemo(
    () =>
      assignedVessels.find((vessel) => vessel.id === selectedVesselId) || assignedVessels[0],
    [assignedVessels, selectedVesselId],
  )
  const hatches = selectedVessel?.hatchCargoRows || []
  const visibleEntries = entries.filter((entry) => entry.vesselId === selectedVessel?.id)
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE))
  const pageStart = totalEntries === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalEntries)

  useEffect(() => {
    loadData()
  }, [checkerId])

  useEffect(() => {
    loadEntries()
  }, [checkerId, selectedVessel?.id, currentPage])

  async function loadData() {
    if (!checkerId) {
      setIsLoading(false)
      setLoadError('User checker tidak ditemukan.')
      return
    }

    setIsLoading(true)
    setLoadError('')

    const assignedResult = await getAssignedVesselsForChecker(checkerId)

    if (assignedResult.error) {
      setLoadError('Gagal memuat kapal assignment checker.')
    } else {
      setAssignedVessels(assignedResult.data)
      setSelectedVesselId((current) => current || assignedResult.data[0]?.id || '')
    }

    setIsLoading(false)
  }

  async function loadEntries() {
    if (!checkerId || !selectedVessel?.id) {
      setEntries([])
      setTotalEntries(0)
      return
    }

    setIsEntriesLoading(true)
    setLoadError('')

    const entriesResult = await getDischargeEntriesForChecker(checkerId, {
      page: currentPage,
      pageSize: PAGE_SIZE,
      vesselId: selectedVessel.id,
    })

    if (entriesResult.error) {
      setLoadError('Gagal memuat riwayat input.')
    } else {
      setEntries(entriesResult.data)
      setTotalEntries(entriesResult.count || 0)
      setDischargeEntries(entriesResult.data)
    }

    setIsEntriesLoading(false)
  }

  function updateForm(field, value) {
    if (field === 'plateNumber') {
      setForm((current) => ({
        ...current,
        plateNumber: value.toUpperCase(),
      }))
      return
    }

    if (field === 'deliveryOrderNumber' || field === 'scaleTicketNumber') {
      setForm((current) => ({
        ...current,
        [field]: normalizeDocumentDigits(value),
      }))
      return
    }

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

  function handleEdit(entry) {
    setEditingEntry(entry)
    setSelectedVesselId(entry.vesselId)
    setForm({
      vesselId: entry.vesselId,
      hatchCargoId: entry.hatchCargoId,
      plateNumber: entry.plateNumber,
      tonnage: formatTonnageInputFromNumber(entry.tonnage),
      deliveryOrderNumber: parseDeliveryOrderDigits(entry.deliveryOrderNumber),
      scaleTicketNumber: normalizeDocumentDigits(entry.scaleTicketNumber),
      ...getGateTimeFieldsFromEntry(entry),
      notes: entry.notes || '',
    })
    setErrors({})
    setMessage('')
    setLoadError('')
    setModalError('')
    resetBarcodePhotoInput()
  }

  function handleCancelEdit() {
    setEditingEntry(null)
    setForm(getEmptyForm())
    setErrors({})
    setModalError('')
    resetBarcodePhotoInput()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!editingEntry || !validateForm() || barcodePhotoError) return

    setIsSaving(true)
    setMessage('')
    setLoadError('')
    setModalError('')

    let uploadedBarcodePhotoUrl = ''

    if (barcodePhotoFile) {
      const uploadResult = await uploadBarcodeReceiptPhoto({
        checkerId,
        deliveryOrderNumber: buildDeliveryOrderNumber(form.deliveryOrderNumber),
        file: barcodePhotoFile,
        vesselId: form.vesselId,
      })

      if (uploadResult.error) {
        setModalError(uploadResult.error.message || 'Gagal upload foto barcode.')
        setIsSaving(false)
        return
      }

      uploadedBarcodePhotoUrl = uploadResult.data?.publicUrl || ''
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

    if (uploadedBarcodePhotoUrl) {
      payload.barcode_photo_url = uploadedBarcodePhotoUrl
    }

    const result = await updateDischargeEntry(editingEntry.id, payload)

    if (result.error) {
      const friendlyError = getDischargeMutationError(result.error)
      const orphanNote = uploadedBarcodePhotoUrl
        ? ' Foto baru sudah terupload tetapi data gagal diupdate; file baru mungkin orphan di storage.'
        : ''
      setModalError(`${friendlyError.message || 'Gagal mengupdate data truck.'}${orphanNote}`)
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
    setModalError('')
    resetBarcodePhotoInput()
    setMessage('Data input berhasil diupdate.')
    setIsSaving(false)
  }

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (_row, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    { key: 'plateNumber', label: 'Plat' },
    { key: 'hatch', label: 'Hatch' },
    { key: 'tonnage', label: 'Tonnage', render: (row) => formatMT(row.tonnage) },
    { key: 'totalNetto', label: 'Total Netto', render: (row) => formatMT(row.totalNetto) },
    { key: 'deliveryOrderNumber', label: 'No Surat Jalan' },
    { key: 'scaleTicketNumber', label: 'No SJ Timbangan' },
    { key: 'barcodePhotoUrl', label: 'Foto Barcode', render: (row) => <BarcodePhotoLink url={row.barcodePhotoUrl} /> },
    { key: 'vesselName', label: 'Vessel' },
    { key: 'destination', label: 'Destination' },
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
        <h2 className="text-2xl font-bold text-slate-900">Riwayat Input</h2>
        <p className="mt-1 text-sm text-slate-500">
          Riwayat data truck untuk kapal yang ditugaskan kepada checker.
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

      <Card title="Filter Kapal">
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat riwayat input...</p>
        ) : assignedVessels.length === 0 ? (
          <p className="text-sm font-semibold text-slate-600">
            Belum ada kapal aktif yang di-assign ke checker ini.
          </p>
        ) : (
          <div className="max-w-md">
            <Select
              label="Vessel Assignment"
              value={selectedVessel?.id || ''}
              onChange={(event) => {
                setSelectedVesselId(event.target.value)
                setCurrentPage(1)
                handleCancelEdit()
              }}
              disabled={Boolean(editingEntry)}
            >
              {assignedVessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.vesselName}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      {editingEntry && (
        <Modal isOpen={Boolean(editingEntry)} onClose={handleCancelEdit} title="Edit Data Input">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {modalError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {modalError}
              </div>
            )}
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
                  label="Plat Kendaraan"
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

      <Card
        className="min-w-0"
        title={selectedVessel?.vesselName || 'Kapal belum tersedia'}
        subtitle="Geser tabel ke kanan untuk melihat semua kolom."
      >
        <Table
          tableClassName="min-w-full"
          columns={columns}
          data={visibleEntries}
          emptyMessage={isEntriesLoading ? 'Memuat data...' : 'Belum ada data input untuk kapal ini.'}
        />
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p className="font-semibold">
            Menampilkan {pageStart}-{pageEnd} dari {totalEntries} data
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1 || isEntriesLoading}
            >
              Prev
            </Button>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 font-bold text-slate-800">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages || isEntriesLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default InputHistoryPage
