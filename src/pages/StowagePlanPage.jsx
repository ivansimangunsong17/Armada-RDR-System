import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import { formatMT } from '../utils/formatters.js'
import {
  formatTonnageInput,
  formatTonnageInputFromNumber,
  parseTonnageInputToNumber,
} from '../utils/tonnageInput.js'
import {
  deleteExtraHatchCargo,
  getHatchCargoByVesselIds,
  getVessels,
  saveHatchCargo,
} from '../services/vesselService.js'

function createHatchRows(totalHatch, existingRows = []) {
  return Array.from({ length: Number(totalHatch) || 0 }, (_, index) => {
    const hatchNo = index + 1
    const existing = existingRows.find((row) => Number(row.hatchNo) === hatchNo)

    return {
      hatchNo,
      hatch: `H${hatchNo}`,
      finalStowage:
        existing?.finalStowage === undefined || existing?.finalStowage === ''
          ? ''
          : typeof existing.finalStowage === 'number'
            ? formatTonnageInputFromNumber(existing.finalStowage)
            : formatTonnageInput(existing.finalStowage),
    }
  })
}

function mapVessel(row) {
  return {
    id: row.id,
    vesselName: row.vessel_name,
    company: row.cargo_owner,
    cargo: row.cargo_type,
    destinationId: row.destination_id,
    totalHatch: row.total_hatch,
    eta: row.eta,
    startDate: row.start_discharge_date,
    status: row.status,
    createdBy: row.created_by,
  }
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

function StowagePlanPage({ appState }) {
  const { vessels, setVessels, hatchCargo, setHatchCargo } = appState
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [hatchRows, setHatchRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedVessel = useMemo(
    () => vessels.find((vessel) => String(vessel.id) === selectedVesselId),
    [selectedVesselId, vessels],
  )

  const totalCargo = hatchRows.reduce(
    (total, row) => total + parseTonnageInputToNumber(row.finalStowage),
    0,
  )

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    setError('')

    const vesselsResult = await getVessels()

    if (vesselsResult.error) {
      setError('Gagal memuat data kapal dari Supabase.')
      setIsLoading(false)
      return
    }

    const nextVessels = vesselsResult.data.map(mapVessel)
    setVessels(nextVessels)

    const vesselIds = nextVessels.map((vessel) => vessel.id)
    const hatchCargoResult = await getHatchCargoByVesselIds(vesselIds)

    if (hatchCargoResult.error) {
      setError('Gagal memuat Final Stowage Plan dari Supabase.')
    } else {
      setHatchCargo(mapHatchCargoForApp(hatchCargoResult.data))
    }

    setIsLoading(false)
  }

  function handleSelectVessel(value) {
    const vessel = vessels.find((item) => String(item.id) === value)
    const existingHatchCargo = hatchCargo.filter((cargo) => String(cargo.vesselId) === value)

    setMessage('')
    setError('')
    setSelectedVesselId(value)
    setHatchRows(
      vessel
        ? createHatchRows(
            vessel.totalHatch,
            existingHatchCargo.map((cargo) => ({
              hatchNo: cargo.hatchNo,
              finalStowage: cargo.tonnage,
            })),
          )
        : [],
    )
  }

  function updateHatchValue(hatchNo, value) {
    setHatchRows((current) =>
      current.map((row) =>
        row.hatchNo === hatchNo ? { ...row, finalStowage: formatTonnageInput(value) } : row,
      ),
    )
  }

  async function handleSave() {
    if (!selectedVessel) return

    const invalidRow = hatchRows.find(
      (row) => row.finalStowage === '' || parseTonnageInputToNumber(row.finalStowage) < 0,
    )

    if (invalidRow) {
      setError('Semua nilai Final Stowage Plan wajib diisi dan tidak boleh minus.')
      setMessage('')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    const saveResult = await saveHatchCargo(
      selectedVessel.id,
      hatchRows.map((row) => ({
        hatchNo: row.hatchNo,
        initialCargo: parseTonnageInputToNumber(row.finalStowage),
      })),
    )

    if (saveResult.error) {
      setError(`Gagal menyimpan Final Stowage Plan. ${saveResult.error.message || ''}`)
      setIsSaving(false)
      return
    }

    const deleteResult = await deleteExtraHatchCargo(selectedVessel.id, selectedVessel.totalHatch)

    if (deleteResult.error) {
      setError(`Data tersimpan, tetapi hatch lama gagal dibersihkan. ${deleteResult.error.message || ''}`)
      setIsSaving(false)
      return
    }

    setHatchCargo((current) => [
      ...current.filter((cargo) => cargo.vesselId !== selectedVessel.id),
      ...mapHatchCargoForApp(saveResult.data),
    ])
    setMessage('Data Final Stowage Plan berhasil disimpan ke Supabase.')
    setIsSaving(false)
  }

  const previewColumns = [
    { key: 'hatch', label: 'Hatch' },
    {
      key: 'finalStowage',
      label: 'Final Stowage Plan',
      render: (row) => formatMT(row.finalStowage),
    },
  ]

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Final Stowage Plan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Input final stowage plan per hatch berdasarkan kapal yang dipilih.
        </p>
      </div>

      <Card title="Pilih Kapal">
        {isLoading ? (
          <p className="text-sm text-slate-500">Memuat data kapal dan Final Stowage Plan...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Vessel"
              value={selectedVesselId}
              onChange={(event) => handleSelectVessel(event.target.value)}
            >
              <option value="">Pilih kapal</option>
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.vesselName}
                </option>
              ))}
            </Select>

            <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
              <p>
                <span className="font-bold text-slate-900">Total Hatch:</span>{' '}
                {selectedVessel?.totalHatch || 0}
              </p>
              <p className="mt-1">
                <span className="font-bold text-slate-900">Cargo:</span>{' '}
                {selectedVessel?.cargo || '-'}
              </p>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {selectedVessel && (
        <>
          <Card
            title="Input Final Stowage Plan"
            subtitle={`Input cargo dalam MT untuk ${selectedVessel.vesselName}.`}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {hatchRows.map((row) => (
                <Input
                  key={row.hatchNo}
                  label={row.hatch}
                  inputMode="numeric"
                  placeholder="40491"
                  value={row.finalStowage}
                  onChange={(event) => updateHatchValue(row.hatchNo, event.target.value)}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-4 rounded-lg bg-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-slate-500">Total Cargo</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{formatMT(totalCargo)}</p>
              </div>

              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan ke Supabase'}
              </Button>
            </div>
          </Card>

          <Card title="Preview Final Stowage Plan">
            <Table columns={previewColumns} data={hatchRows} />
          </Card>
        </>
      )}
    </div>
  )
}

export default StowagePlanPage
