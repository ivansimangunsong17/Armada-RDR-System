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
import { exportInputEntriesExcel } from '../services/excelExportService.js'
import { exportInputEntriesPDF } from '../services/pdfExportService.js'
import { uploadBarcodeReceiptPhoto } from '../services/storageService.js'
import { getActiveVesselsForReports } from '../services/reportService.js'
import { getHatchCargoByVesselIds, getVesselDestinations } from '../services/vesselService.js'
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
import {
  buildDeliveryOrderNumber,
  normalizeDocumentDigits,
  parseDeliveryOrderDigits,
} from '../utils/documentNumbers.js'

const emptyForm = {
  hatchCargoId: '',
  destinationId: '',
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

function getFallbackVesselDestinations(vessel) {
  const destinations = vessel?.destinations || []

  if (destinations.length > 0) return destinations
  if (!vessel?.destinationId) return []

  return [
    {
      destinationId: vessel.destinationId,
      name: vessel.destination || '-',
      isActive: true,
    },
  ]
}

function getActiveDestinationOptions(destinations) {
  return (destinations || []).filter((destination) => destination.isActive)
}

function getDestinationOptionsForEntry(destinations, entry) {
  const options = getActiveDestinationOptions(destinations)
  const entryDestinationId = entry?.destinationId

  if (
    entryDestinationId &&
    !options.some((destination) => destination.destinationId === entryDestinationId)
  ) {
    options.push({
      destinationId: entryDestinationId,
      name: entry.destination || '-',
      isActive: false,
    })
  }

  return options
}

function getDefaultDestinationId(destinations) {
  const activeDestinations = getActiveDestinationOptions(destinations)

  return activeDestinations.length === 1 ? activeDestinations[0].destinationId : ''
}

function InputMonitoringPage({ appState }) {
  const { currentUser, setDischargeEntries } = appState
  const [vessels, setVessels] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [hatches, setHatches] = useState([])
  const [vesselDestinations, setVesselDestinations] = useState([])
  const [entries, setEntries] = useState([])
  const [editingEntry, setEditingEntry] = useState(null)
  const [form, setForm] = useState(() => getEmptyForm())
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEntriesLoading, setIsEntriesLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalEntries, setTotalEntries] = useState(0)
  const [barcodePhotoError, setBarcodePhotoError] = useState('')
  const [barcodePhotoFile, setBarcodePhotoFile] = useState(null)
  const [barcodePhotoPreviewUrl, setBarcodePhotoPreviewUrl] = useState('')
  const [barcodePhotoInputKey, setBarcodePhotoInputKey] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const selectedVessel = useMemo(
    () => vessels.find((vessel) => vessel.id === selectedVesselId) || vessels[0],
    [selectedVesselId, vessels],
  )
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE))
  const destinationOptions = getDestinationOptionsForEntry(vesselDestinations, editingEntry)
  const pageStart = totalEntries === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalEntries)

  useEffect(() => {
    loadVessels()
  }, [currentUser?.id])

  useEffect(() => {
    loadMonitoringData()
  }, [selectedVessel?.id, currentPage])

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
      setVesselDestinations([])
      setTotalEntries(0)
      return
    }

    setIsEntriesLoading(true)
    setLoadError('')
    setMessage('')

    const [entriesResult, hatchResult, destinationsResult] = await Promise.all([
      getDischargeEntriesForVessel(selectedVessel.id, {
        page: currentPage,
        pageSize: PAGE_SIZE,
      }),
      getHatchCargoByVesselIds([selectedVessel.id]),
      getVesselDestinations(selectedVessel.id),
    ])

    if (entriesResult.error) {
      setLoadError('Gagal memuat input checker.')
    } else {
      setEntries(entriesResult.data)
      setTotalEntries(entriesResult.count || 0)
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

    if (destinationsResult.error) {
      setLoadError((current) => `${current} Gagal memuat destination vessel.`.trim())
      setVesselDestinations(getFallbackVesselDestinations(selectedVessel))
    } else {
      setVesselDestinations(
        destinationsResult.data.length > 0
          ? destinationsResult.data
          : getFallbackVesselDestinations(selectedVessel),
      )
    }

    setIsEntriesLoading(false)
  }

  async function getAllEntriesForExport() {
    if (!selectedVessel?.id) {
      return []
    }

    setIsExporting(true)
    setLoadError('')

    const result = await getDischargeEntriesForVessel(selectedVessel.id)

    if (result.error) {
      setLoadError('Gagal memuat semua input checker untuk export.')
      setIsExporting(false)
      return []
    }

    setIsExporting(false)
    return result.data
  }

  async function handleExportExcel() {
    const exportRows = await getAllEntriesForExport()
    if (exportRows.length === 0) return

    exportInputEntriesExcel({
      vessel: selectedVessel,
      rows: exportRows,
    })
  }

  async function handleExportPDF() {
    const exportRows = await getAllEntriesForExport()
    if (exportRows.length === 0) return

    await exportInputEntriesPDF({
      vessel: selectedVessel,
      rows: exportRows,
    })
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
    if (destinationOptions.length > 0 && !form.destinationId) {
      nextErrors.destinationId = 'Destination wajib dipilih.'
    }
    if (!form.plateNumber.trim()) nextErrors.plateNumber = 'Plate number wajib diisi.'
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
    setForm({
      hatchCargoId: entry.hatchCargoId,
      destinationId: entry.destinationId || getDefaultDestinationId(vesselDestinations),
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
        deliveryOrderNumber: buildDeliveryOrderNumber(form.deliveryOrderNumber),
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
      destination_id: form.destinationId || null,
      hatch_cargo_id: form.hatchCargoId,
      checker_id: editingEntry.checkerId,
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
    { key: 'plateNumber', label: 'Plate No.' },
    { key: 'hatch', label: 'Hatch' },
    { key: 'destination', label: 'Destination' },
    { key: 'tonnage', label: 'Tonnage', render: (row) => formatMT(row.tonnage) },
    { key: 'deliveryOrderNumber', label: 'No Surat Jalan' },
    { key: 'scaleTicketNumber', label: 'No SJ Timbangan' },
    { key: 'barcodePhotoUrl', label: 'Barcode Receipt', render: (row) => <BarcodePhotoLink url={row.barcodePhotoUrl} /> },
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
                setCurrentPage(1)
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
                <Select
                  label="Destination"
                  value={form.destinationId}
                  onChange={(event) => updateForm('destinationId', event.target.value)}
                >
                  <option value="">Pilih Destination</option>
                  {destinationOptions.map((destination) => (
                    <option key={destination.destinationId} value={destination.destinationId}>
                      {destination.name}
                      {destination.isActive ? '' : ' (Inactive)'}
                    </option>
                  ))}
                </Select>
                {errors.destinationId && (
                  <p className="mt-1 text-sm font-semibold text-red-600">{errors.destinationId}</p>
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

      <Card
        title={selectedVessel?.vesselName || 'Input Checker'}
        subtitle="Data input checker per vessel. Gunakan pagination untuk menjaga halaman tetap ringan."
      >
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:justify-end">
          <Button
            type="button"
            variant="success"
            onClick={handleExportExcel}
            disabled={!selectedVessel || totalEntries === 0 || isExporting}
          >
            {isExporting ? 'Preparing...' : 'Export Excel'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleExportPDF}
            disabled={!selectedVessel || totalEntries === 0 || isExporting}
          >
            {isExporting ? 'Preparing...' : 'Export PDF'}
          </Button>
        </div>
        <Table
          columns={columns}
          data={entries}
          emptyMessage={isEntriesLoading ? 'Memuat input checker...' : 'Belum ada input checker untuk vessel ini.'}
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

export default InputMonitoringPage
