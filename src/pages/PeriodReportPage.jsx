import { useEffect, useMemo, useState } from 'react'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import {
  buildTimedReportSummary,
  getActiveVesselsForReports,
  getPeriodTwoHourReportRows,
} from '../services/reportService.js'
import { exportPeriodReportExcel } from '../services/excelExportService.js'
import { formatMT, formatTruck } from '../utils/formatters.js'
import Button from '../components/ui/Button.jsx'

const periods = [
  { label: '00.00 - 02.00', startHour: 0, endHour: 2 },
  { label: '02.00 - 04.00', startHour: 2, endHour: 4 },
  { label: '04.00 - 06.00', startHour: 4, endHour: 6 },
  { label: '06.00 - 08.00', startHour: 6, endHour: 8 },
  { label: '08.00 - 10.00', startHour: 8, endHour: 10 },
  { label: '10.00 - 12.00', startHour: 10, endHour: 12 },
  { label: '12.00 - 14.00', startHour: 12, endHour: 14 },
  { label: '14.00 - 16.00', startHour: 14, endHour: 16 },
  { label: '16.00 - 18.00', startHour: 16, endHour: 18 },
  { label: '18.00 - 20.00', startHour: 18, endHour: 20 },
  { label: '20.00 - 22.00', startHour: 20, endHour: 22 },
  { label: '22.00 - 24.00', startHour: 22, endHour: 24 },
]

function PeriodReportPage({ appState }) {
  const { currentUser } = appState
  const [vessels, setVessels] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [periodKey, setPeriodKey] = useState('')
  const [rows, setRows] = useState([])
  const [isLoadingVessels, setIsLoadingVessels] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [error, setError] = useState('')

  const selectedVessel = useMemo(
    () => vessels.find((vessel) => vessel.id === selectedVesselId) || vessels[0],
    [selectedVesselId, vessels],
  )
  const selectedPeriod = periods.find(
    (period) => `${period.startHour}-${period.endHour}` === periodKey,
  )
  const isFilterComplete = Boolean(selectedVessel?.id && reportDate && selectedPeriod)
  const summary = buildTimedReportSummary(rows)

  useEffect(() => {
    loadVessels()
  }, [currentUser?.id])

  useEffect(() => {
    loadReport()
  }, [selectedVessel?.id, reportDate, periodKey])

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

    const result = await getPeriodTwoHourReportRows({
      vesselId: selectedVessel.id,
      reportDate,
      periodStartHour: selectedPeriod.startHour,
      periodEndHour: selectedPeriod.endHour,
    })

    if (result.error) {
      setError('Gagal memuat report 2 jam dari Supabase.')
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
    exportPeriodReportExcel({
      vessel: selectedVessel,
      reportDate,
      periodLabel: selectedPeriod?.label,
      rows,
      summary,
    })
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Report 2 Jam</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rekap discharge per periode 2 jam berdasarkan view period_2_hour_report Supabase.
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
              label="Periode"
              value={periodKey}
              onChange={(event) => setPeriodKey(event.target.value)}
            >
              <option value="">Pilih periode</option>
              {periods.map((period) => (
                <option key={`${period.startHour}-${period.endHour}`} value={`${period.startHour}-${period.endHour}`}>
                  {period.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      {isFilterComplete && (
        <Card
          title={`${selectedVessel?.vesselName || '-'} - ${selectedPeriod?.label || '-'}`}
          subtitle="Data ditampilkan per hatch."
        >
          {isLoadingReport ? (
            <p className="text-sm text-slate-500">Memuat report 2 jam...</p>
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
              <Table columns={columns} data={rows} emptyMessage="Data periode belum tersedia." />
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

export default PeriodReportPage
