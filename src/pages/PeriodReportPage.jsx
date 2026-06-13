import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { formatMT, formatPercentage, formatTruck } from '../utils/formatters.js'
import Button from '../components/ui/Button.jsx'

const periods = [
  { label: '00:00-02:00', startHour: 0, endHour: 2 },
  { label: '02:00-04:00', startHour: 2, endHour: 4 },
  { label: '04:00-06:00', startHour: 4, endHour: 6 },
  { label: '06:00-08:00', startHour: 6, endHour: 8 },
  { label: '08:00-10:00', startHour: 8, endHour: 10 },
  { label: '10:00-12:00', startHour: 10, endHour: 12 },
  { label: '12:00-14:00', startHour: 12, endHour: 14 },
  { label: '14:00-16:00', startHour: 14, endHour: 16 },
  { label: '16:00-18:00', startHour: 16, endHour: 18 },
  { label: '18:00-20:00', startHour: 18, endHour: 20 },
  { label: '20:00-22:00', startHour: 20, endHour: 22 },
  { label: '22:00-24:00', startHour: 22, endHour: 24 },
]

const supervisorReportLinks = [
  { to: '/supervisor/running-report', label: 'Running Report' },
  { to: '/supervisor/shift-report', label: 'Report Shift' },
  { to: '/supervisor/period-report', label: 'Report 2 Jam' },
]

const emptyRunningPosition = {
  totalCargo: 0,
  totalDischarge: 0,
  totalTruck: 0,
  remainingCargo: 0,
  progressPercentage: 0,
  averageLoad: 0,
}

function ReportNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {supervisorReportLinks.map((link) => (
        <Link
          key={link.to}
          className={[
            'inline-flex min-h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-bold shadow-sm transition-colors',
            link.to.includes('period-report')
              ? 'border-red-800 bg-red-800 text-white'
              : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
          ].join(' ')}
          to={link.to}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

function ReportLoadingState({ message }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-6 w-32 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
        {message}
      </div>
    </div>
  )
}

function PeriodReportPage({ appState }) {
  const { currentUser } = appState
  const [vessels, setVessels] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [periodKey, setPeriodKey] = useState('')
  const [rows, setRows] = useState([])
  const [runningPosition, setRunningPosition] = useState(emptyRunningPosition)
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
      setRunningPosition(emptyRunningPosition)
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
    setRunningPosition(result.runningPosition || emptyRunningPosition)
    setIsLoadingReport(false)
  }

  const columns = [
    { key: 'hatch', label: 'Hatch' },
    {
      key: 'totalTruck',
      label: 'Truck',
      render: (row) => <span className="block text-right">{formatTruck(row.totalTruck)}</span>,
    },
    {
      key: 'totalDischarge',
      label: 'Tonnage',
      render: (row) => <span className="block text-right">{formatMT(row.totalDischarge)}</span>,
    },
    {
      key: 'averageTonnage',
      label: 'Average',
      render: (row) => <span className="block text-right">{formatMT(row.averageTonnage)}</span>,
    },
  ]

  function handleExportExcel() {
    exportPeriodReportExcel({
      vessel: selectedVessel,
      reportDate,
      periodLabel: selectedPeriod?.label,
      rows,
      summary,
      runningPosition,
    })
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-red-800">
            Supervisor Report
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Report 2 Jam</h2>
          <p className="mt-1 text-sm text-slate-500">
            Rekap discharge per periode 2 jam berdasarkan Gate Out.
          </p>
        </div>
        <ReportNav />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        {isLoadingVessels ? (
          <ReportLoadingState message="Memuat daftar kapal..." />
        ) : (
          <>
            <div className="mb-4 border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-950">Filter Report</h3>
              <p className="mt-1 text-sm text-slate-500">
                Pilih kapal, tanggal, dan periode 2 jam.
              </p>
            </div>
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
          </>
        )}
      </Card>

      {!isFilterComplete ? (
        <Card>
          <div className="py-8 text-center">
            <h3 className="text-lg font-extrabold text-slate-950">Lengkapi filter report</h3>
            <p className="mt-2 text-sm text-slate-500">
              Report 2 jam akan tampil setelah kapal, tanggal, dan periode dipilih.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Two-Hour Report
              </p>
              <h3 className="mt-1 truncate text-xl font-black text-slate-950">
                {selectedVessel?.vesselName || '-'}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {selectedPeriod?.label || '-'} - {reportDate || '-'}
              </p>
            </div>
            <Button
              type="button"
              variant="success"
              onClick={handleExportExcel}
              disabled={rows.length === 0}
            >
              Export Excel
            </Button>
          </div>

          <div className="p-5">
          {isLoadingReport ? (
            <ReportLoadingState message="Memuat report 2 jam..." />
          ) : (
            <>
              <section className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Total Truck</p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {formatTruck(summary.totalTruck)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Total Discharge</p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {formatMT(summary.totalDischarge)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Average Load</p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {formatMT(summary.averageTonnage)}
                  </p>
                </div>
              </section>

              <section className="mt-6">
                <h3 className="mb-3 text-base font-extrabold text-slate-900">Breakdown Per Hatch</h3>
                <Table
                  columns={columns}
                  data={rows}
                  emptyMessage="Data hatch belum tersedia."
                  tableClassName="min-w-[720px]"
                />
              </section>

              <section className="mt-6">
                <h3 className="mb-3 text-base font-extrabold text-slate-900">
                  Running Position Setelah Periode
                </h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Total Cargo</p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {formatMT(runningPosition.totalCargo)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Total Discharge</p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {formatMT(runningPosition.totalDischarge)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Remaining Cargo</p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {formatMT(runningPosition.remainingCargo)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Progress %</p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {formatPercentage(runningPosition.progressPercentage)}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default PeriodReportPage
