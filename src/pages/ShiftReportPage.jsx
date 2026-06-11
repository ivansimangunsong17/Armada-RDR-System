import { useEffect, useMemo, useState } from 'react'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import {
  buildTimedReportSummary,
  getActiveVesselsForReports,
  getShiftReportRows,
} from '../services/reportService.js'
import { exportShiftReportExcel } from '../services/excelExportService.js'
import { formatMT, formatTruck } from '../utils/formatters.js'
import Button from '../components/ui/Button.jsx'

const shiftOptions = [
  { value: 'shift_1', label: 'Shift 1 (08.00 - 16.00)' },
  { value: 'shift_2', label: 'Shift 2 (16.00 - 00.00)' },
  { value: 'shift_3', label: 'Shift 3 (00.00 - 08.00)' },
]

function ShiftReportPage({ appState }) {
  const { currentUser } = appState
  const [vessels, setVessels] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [shiftName, setShiftName] = useState('')
  const [rows, setRows] = useState([])
  const [isLoadingVessels, setIsLoadingVessels] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [error, setError] = useState('')

  const selectedVessel = useMemo(
    () => vessels.find((vessel) => vessel.id === selectedVesselId) || vessels[0],
    [selectedVesselId, vessels],
  )
  const selectedShift = shiftOptions.find((shift) => shift.value === shiftName)
  const isFilterComplete = Boolean(selectedVessel?.id && reportDate && shiftName)
  const summary = buildTimedReportSummary(rows)

  useEffect(() => {
    loadVessels()
  }, [currentUser?.id])

  useEffect(() => {
    loadReport()
  }, [selectedVessel?.id, reportDate, shiftName])

  async function loadVessels() {
    setIsLoadingVessels(true)
    setError('')

    const result = await getActiveVesselsForReports(currentUser)

    if (result.error) {
      setError('Gagal memuat daftar kapal.')
    }

    setVessels(result.data)
    setSelectedVesselId((current) => current || result.data[0]?.id || '')
    setIsLoadingVessels(false)
  }

  async function loadReport() {
    if (!isFilterComplete) {
      setRows([])
      return
    }

    setIsLoadingReport(true)
    setError('')

    const result = await getShiftReportRows({
      vesselId: selectedVessel.id,
      reportDate,
      shiftName,
    })

    if (result.error) {
      setError('Gagal memuat report shift dari Supabase.')
    }

    setRows(result.data)
    setIsLoadingReport(false)
  }

  const columns = [
    { key: 'hatch', label: 'Hatch' },
    {
      key: 'totalDischarge',
      label: 'Total Discharge',
      render: (row) => formatMT(row.totalDischarge),
    },
    { key: 'totalTruck', label: 'Total DT', render: (row) => formatTruck(row.totalTruck) },
    {
      key: 'averageTonnage',
      label: 'Average Tonnage',
      render: (row) => formatMT(row.averageTonnage),
    },
  ]

  function handleExportExcel() {
    exportShiftReportExcel({
      vessel: selectedVessel,
      reportDate,
      shiftLabel: selectedShift?.label,
      rows,
      summary,
    })
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Report per Shift</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rekap discharge per shift berdasarkan view shift_report Supabase.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card title="Filter Report">
        {isLoadingVessels ? (
          <p className="text-sm text-slate-500">Memuat kapal...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Kapal"
              value={selectedVessel?.id || ''}
              onChange={(event) => setSelectedVesselId(event.target.value)}
            >
              {vessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.vesselName}
                </option>
              ))}
            </Select>

            <Input
              label="Tanggal"
              type="date"
              value={reportDate}
              onChange={(event) => setReportDate(event.target.value)}
            />

            <Select
              label="Shift"
              value={shiftName}
              onChange={(event) => setShiftName(event.target.value)}
            >
              <option value="">Pilih shift</option>
              {shiftOptions.map((shift) => (
                <option key={shift.value} value={shift.value}>
                  {shift.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      {isFilterComplete && (
        <Card
          title={`${selectedVessel?.vesselName || '-'} - ${selectedShift?.label || '-'}`}
          subtitle="Data ditampilkan per hatch."
        >
          {isLoadingReport ? (
            <p className="text-sm text-slate-500">Memuat report shift...</p>
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <Button
                  type="button"
                  variant="success"
                  onClick={handleExportExcel}
                  disabled={rows.length === 0}
                >
                  Export Excel
                </Button>
              </div>
              <Table columns={columns} data={rows} emptyMessage="Data shift belum tersedia." />
              <div className="mt-4 grid gap-3 rounded-lg bg-slate-100 p-4 text-sm md:grid-cols-3">
                <p>
                  <span className="font-bold text-slate-900">Total Discharge:</span>{' '}
                  {formatMT(summary.totalDischarge)}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Total DT:</span>{' '}
                  {formatTruck(summary.totalTruck)}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Average:</span>{' '}
                  {formatMT(summary.averageTonnage)}
                </p>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

export default ShiftReportPage
