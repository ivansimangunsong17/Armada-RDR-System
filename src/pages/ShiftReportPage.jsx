import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { exportShiftReportPDF } from '../services/pdfExportService.js'
import { formatMT, formatTruck } from '../utils/formatters.js'
import Button from '../components/ui/Button.jsx'
import { normalizeRole } from '../utils/roles.js'

const shiftOptions = [
  { value: 'shift_1', label: 'Shift 1 (08.00 - 16.00)' },
  { value: 'shift_2', label: 'Shift 2 (16.00 - 00.00)' },
  { value: 'shift_3', label: 'Shift 3 (00.00 - 08.00)' },
]

function getReportLinks(role) {
  const basePath = normalizeRole(role) === 'admin' ? '/admin' : '/viewer'

  return [
    { to: `${basePath}/running-report`, label: 'Running Report' },
    { to: `${basePath}/shift-report`, label: 'Report Shift' },
    { to: `${basePath}/period-report`, label: 'Report 2 Jam' },
  ]
}

function ReportNav({ role }) {
  const reportLinks = getReportLinks(role)

  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 xl:flex xl:w-auto xl:flex-wrap">
      {reportLinks.map((link) => (
        <Link
          key={link.to}
          className={[
            'inline-flex min-h-10 w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-bold shadow-sm transition-colors xl:w-auto',
            link.to.includes('shift-report')
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
      render: (row) => <span className="block text-right">{formatMT(row.totalDischarge)}</span>,
    },
    {
      key: 'totalTruck',
      label: 'Total DT',
      render: (row) => <span className="block text-right">{formatTruck(row.totalTruck)}</span>,
    },
    {
      key: 'averageTonnage',
      label: 'Average Tonnage',
      render: (row) => <span className="block text-right">{formatMT(row.averageTonnage)}</span>,
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

  async function handleExportPDF() {
    await exportShiftReportPDF({
      vessel: selectedVessel,
      reportDate,
      shiftLabel: selectedShift?.label,
      rows,
      summary,
    })
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-red-800">
            Report Viewer
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Report per Shift</h2>
          <p className="mt-1 text-sm text-slate-500">
            Rekap discharge per shift berdasarkan Gate Out.
          </p>
        </div>
        <ReportNav role={currentUser?.role} />
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
                Pilih kapal, tanggal, dan shift untuk melihat detail discharge.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          </>
        )}
      </Card>

      {!isFilterComplete ? (
        <Card>
          <div className="py-8 text-center">
            <h3 className="text-lg font-extrabold text-slate-950">Lengkapi filter report</h3>
            <p className="mt-2 text-sm text-slate-500">
              Report shift akan tampil setelah kapal, tanggal, dan shift dipilih.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Shift Report
              </p>
              <h3 className="mt-1 truncate text-xl font-black text-slate-950">
                {selectedVessel?.vesselName || '-'}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {selectedShift?.label || '-'} - {reportDate || '-'}
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:w-auto">
              <Button
                type="button"
                variant="success"
                onClick={handleExportExcel}
                disabled={rows.length === 0}
                className="w-full md:w-auto"
              >
                Export Excel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleExportPDF}
                disabled={rows.length === 0}
                className="w-full md:w-auto"
              >
                Export PDF
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
          {isLoadingReport ? (
            <ReportLoadingState message="Memuat report shift..." />
          ) : (
            <>
              <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    Total Discharge
                  </p>
                  <p className="mt-2 break-words text-lg font-black text-slate-950 sm:text-xl">
                    {formatMT(summary.totalDischarge)}
                  </p>
                </div>
                <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    Total DT
                  </p>
                  <p className="mt-2 break-words text-lg font-black text-slate-950 sm:text-xl">
                    {formatTruck(summary.totalTruck)}
                  </p>
                </div>
                <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    Average Load
                  </p>
                  <p className="mt-2 break-words text-lg font-black text-slate-950 sm:text-xl">
                    {formatMT(summary.averageTonnage)}
                  </p>
                </div>
              </section>

              <div className="grid gap-3 md:hidden">
                {rows.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    Data shift belum tersedia.
                  </div>
                ) : (
                  rows.map((row) => (
                    <article key={row.hatch} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="text-lg font-black text-slate-950">{row.hatch}</h3>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Total Discharge</dt>
                          <dd className="mt-1 font-black text-slate-950">
                            {formatMT(row.totalDischarge)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Total DT</dt>
                          <dd className="mt-1 font-black text-slate-950">
                            {formatTruck(row.totalTruck)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Average Tonnage</dt>
                          <dd className="mt-1 font-black text-slate-950">
                            {formatMT(row.averageTonnage)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))
                )}
              </div>

              <div className="hidden md:block">
                <Table
                  columns={columns}
                  data={rows}
                  emptyMessage="Data shift belum tersedia."
                  tableClassName="min-w-[720px]"
                />
              </div>
            </>
          )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default ShiftReportPage
