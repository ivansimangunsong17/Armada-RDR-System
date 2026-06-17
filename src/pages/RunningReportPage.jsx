import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Select from '../components/ui/Select.jsx'
import {
  buildDestinationSummaryTotal,
  buildSummary,
  getRunningDestinationSummary,
  getReportDataset,
} from '../services/reportService.js'
import { exportRunningReportExcel } from '../services/excelExportService.js'
import { exportRunningReportPDF, printRunningReportPDF } from '../services/pdfExportService.js'
import { formatDate, formatPercentage, formatTruck } from '../utils/formatters.js'

function formatManagementNumber(value) {
  const numericValue = Number(value) || 0

  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

function getEstimatedTruckRequirement(remainingCargo, averageLoadOverall) {
  const remaining = Number(remainingCargo) || 0
  const averageLoad = Number(averageLoadOverall) || 0

  if (remaining <= 0 || averageLoad <= 0) {
    return null
  }

  return Math.ceil(remaining / averageLoad)
}

function formatTruckRequirement(value) {
  return value ? formatTruck(value) : '-'
}

function ReportSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mx-auto h-4 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mx-auto mt-3 h-7 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mx-auto mt-3 h-4 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-6 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-64 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  )
}

function getHatchLagStatus(gap) {
  if (gap >= -5) {
    return { label: 'Normal', variant: 'normal' }
  }

  if (gap >= -10) {
    return { label: 'Perlu Dipantau', variant: 'watch' }
  }

  if (gap >= -20) {
    return { label: 'Palka Tertinggal', variant: 'lagging' }
  }

  return { label: 'Critical / Prioritas Utama', variant: 'critical' }
}

function getSelectedVesselStorageKey(currentUser) {
  const userKey = currentUser?.authUserId || currentUser?.id || 'guest'
  const roleKey = currentUser?.role || 'unknown'

  return `rdrs-running-report-selected-vessel-${roleKey}-${userKey}`
}

function RunningReportPage({ appState }) {
  const { currentUser } = appState
  const isChecker = currentUser?.role === 'checker'
  const [availableVessels, setAvailableVessels] = useState([])
  const [runningRows, setRunningRows] = useState([])
  const [destinationSummary, setDestinationSummary] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDestinationSummaryLoading, setIsDestinationSummaryLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedVesselStorageKey = getSelectedVesselStorageKey(currentUser)

  useEffect(() => {
    loadReport()
  }, [currentUser?.id])

  useEffect(() => {
    let isCurrentRequest = true
    loadDestinationSummary(selectedVesselId, () => isCurrentRequest)

    return () => {
      isCurrentRequest = false
    }
  }, [selectedVesselId])

  useEffect(() => {
    if (availableVessels.length === 0) {
      if (selectedVesselId) {
        setSelectedVesselId('')
      }
      return
    }

    const storedVesselId = window.localStorage.getItem(selectedVesselStorageKey) || ''
    const hasSelectedVessel = availableVessels.some(
      (vessel) => String(vessel.id) === selectedVesselId,
    )
    const hasStoredVessel = availableVessels.some(
      (vessel) => String(vessel.id) === storedVesselId,
    )

    if (selectedVesselId && hasSelectedVessel) {
      return
    }

    const nextVesselId = hasStoredVessel ? storedVesselId : String(availableVessels[0].id)
    setSelectedVesselId(nextVesselId)
    window.localStorage.setItem(selectedVesselStorageKey, nextVesselId)
  }, [availableVessels, selectedVesselId, selectedVesselStorageKey])

  function handleSelectVessel(vesselId) {
    setSelectedVesselId(vesselId)
    window.localStorage.setItem(selectedVesselStorageKey, vesselId)
  }

  async function loadReport() {
    setIsLoading(true)
    setError('')

    const result = await getReportDataset(currentUser)

    if (result.error) {
      setError('Gagal memuat running report dari Supabase.')
    }

    setAvailableVessels(result.vessels)
    setRunningRows(result.runningRows)
    setIsLoading(false)
  }

  async function loadDestinationSummary(vesselId, isCurrentRequest = () => true) {
    if (!vesselId) {
      setDestinationSummary([])
      setIsDestinationSummaryLoading(false)
      return
    }

    setDestinationSummary([])
    setIsDestinationSummaryLoading(true)

    const result = await getRunningDestinationSummary(vesselId)

    if (!isCurrentRequest()) return

    if (result.error) {
      setError((current) => `${current} Gagal memuat destination summary.`.trim())
      setDestinationSummary([])
    } else {
      setDestinationSummary(result.data)
    }

    setIsDestinationSummaryLoading(false)
  }

  const selectedVessel = useMemo(() => {
    const fallback = availableVessels[0]
    return availableVessels.find((vessel) => String(vessel.id) === selectedVesselId) || fallback
  }, [availableVessels, selectedVesselId])

  const runningReport = runningRows.filter((row) => row.vesselId === selectedVessel?.id)
  const summaryReport = buildSummary(runningReport)
  const destinationSummaryTotal = buildDestinationSummaryTotal(destinationSummary)

  const averageLoad = summaryReport.averageLoadPerTruck
  const estimatedTruckRequirementTotal = getEstimatedTruckRequirement(
    summaryReport.totalRemaining,
    averageLoad,
  )
  const hasReportData = runningReport.length > 0
  const summaryCards = [
    { label: 'Total Cargo', value: formatManagementNumber(summaryReport.totalCargo) },
    { label: 'Total Discharge', value: formatManagementNumber(summaryReport.totalDischarge) },
    { label: 'Remaining Cargo', value: formatManagementNumber(summaryReport.totalRemaining) },
    { label: 'Progress %', value: formatPercentage(summaryReport.overallProgress) },
    { label: 'Total Truck', value: formatTruck(summaryReport.totalTruck) },
    { label: 'Average Load', value: formatManagementNumber(averageLoad) },
  ]

  async function handlePrint() {
    await printRunningReportPDF({
      vessel: selectedVessel,
      summary: summaryReport,
      hatchRows: runningReport,
      destinationSummary,
    })
  }

  async function handleExportExcel() {
    await exportRunningReportExcel({
      vessel: selectedVessel,
      rows: runningReport,
      summary: summaryReport,
      averageLoadOverall: averageLoad,
      destinationSummary,
    })
  }

  async function handleExportPDF() {
    await exportRunningReportPDF({
      vessel: selectedVessel,
      summary: summaryReport,
      hatchRows: runningReport,
      destinationSummary,
    })
  }

  const secondaryReportLinks =
    currentUser?.role === 'admin'
      ? [
          { to: '/admin/shift-report', label: 'Report Shift' },
          { to: '/admin/period-report', label: 'Report 2 Jam' },
        ]
      : currentUser?.role === 'supervisor'
        ? [
            { to: '/supervisor/shift-report', label: 'Report Shift' },
            { to: '/supervisor/period-report', label: 'Report 2 Jam' },
          ]
        : []

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-red-800">
            Running Report
          </p>
          <h2 className="mt-1 truncate text-2xl font-black text-slate-950">
            {selectedVessel?.vesselName || 'Running Discharge Result'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Management view untuk progress discharge vessel.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:justify-end">
          <Button
            type="button"
            variant="success"
            onClick={handleExportExcel}
            disabled={!selectedVessel || !hasReportData}
            className="w-full lg:w-auto lg:min-w-28"
          >
            Export Excel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleExportPDF}
            disabled={!selectedVessel || !hasReportData}
            className="w-full lg:w-auto lg:min-w-28"
          >
            Export PDF
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrint}
            disabled={!selectedVessel || !hasReportData}
            className="w-full lg:w-auto lg:min-w-20"
          >
            Print
          </Button>
          {secondaryReportLinks.map((link) => (
            <Link
              key={link.to}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200 lg:w-auto"
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <ReportSkeleton />
      ) : (
        <>
          {!isChecker && (
            <Card className="print:hidden">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Filter Kapal</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Pilih vessel untuk melihat running report terbaru.
                  </p>
                </div>
                <div className="w-full md:max-w-sm">
                <Select
                  label="Pilih Kapal"
                  value={String(selectedVessel?.id || '')}
                  onChange={(event) => handleSelectVessel(event.target.value)}
                >
                  {availableVessels.map((vessel) => (
                    <option key={vessel.id} value={vessel.id}>
                      {vessel.vesselName}
                    </option>
                  ))}
                </Select>
                </div>
              </div>
            </Card>
          )}

          {!selectedVessel ? (
            <Card>
              <div className="py-10 text-center">
                <h3 className="text-lg font-extrabold text-slate-950">Belum ada vessel tersedia</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Running report akan tampil setelah vessel dan cargo information tersedia.
                </p>
              </div>
            </Card>
          ) : !hasReportData ? (
            <Card>
              <div className="py-10 text-center">
                <p className="text-xs font-extrabold uppercase tracking-wide text-red-800">
                  {selectedVessel.vesselName || 'Selected Vessel'}
                </p>
                <h3 className="mt-2 text-lg font-extrabold text-slate-950">
                  Belum ada data running discharge
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Data akan muncul setelah FSP dan transaksi discharge vessel ini tersedia.
                </p>
              </div>
            </Card>
          ) : (
            <>
          <Card className="print-root p-0">
            <div className="border-b border-slate-200 px-5 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Running Discharge Result
                  </p>
                  <h1 className="mt-2 truncate text-2xl font-black uppercase text-slate-950 md:text-3xl">
                    {selectedVessel?.vesselName || '-'}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
                      Company: {selectedVessel?.company || '-'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700">
                      Printed preview: {formatDate(new Date())}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-left lg:text-right">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-red-700">
                    Overall Progress
                  </p>
                  <p className="mt-1 text-2xl font-black text-red-900">
                    {formatPercentage(summaryReport.overallProgress)}
                  </p>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {summaryCards.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 break-words text-lg font-black text-slate-950 sm:text-xl">
                    {item.value}
                  </p>
                </div>
              ))}
            </section>

            <div className="mx-4 mb-5 grid gap-3 md:hidden">
              {runningReport.map((row) => {
                const estimatedTruckRequirement = getEstimatedTruckRequirement(
                  row.remainingOnBoard,
                  averageLoad,
                )
                const progressGap = (Number(row.progressPercentage) || 0) - summaryReport.overallProgress
                const hatchLagStatus = getHatchLagStatus(progressGap)

                return (
                  <article
                    key={row.hatch}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black text-slate-950">{row.hatch}</h3>
                      <Badge variant={hatchLagStatus.variant}>{hatchLagStatus.label}</Badge>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Discharge</dt>
                        <dd className="mt-1 font-black text-slate-950">
                          {formatManagementNumber(row.totalDischarge)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Remaining</dt>
                        <dd className="mt-1 font-black text-slate-950">
                          {formatManagementNumber(row.remainingOnBoard)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Progress</dt>
                        <dd className="mt-1 font-black text-slate-950">
                          {formatPercentage(row.progressPercentage)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Truck</dt>
                        <dd className="mt-1 font-black text-slate-950">
                          {formatTruck(row.totalTruck)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Est. Truck</dt>
                        <dd className="mt-1 font-black text-slate-950">
                          {formatTruckRequirement(estimatedTruckRequirement)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Initial Cargo</dt>
                        <dd className="mt-1 font-black text-slate-950">
                          {formatManagementNumber(row.finalStowage)}
                        </dd>
                      </div>
                    </dl>
                    {Number(row.remainingOnBoard) < 0 && (
                      <div className="mt-3">
                        <Badge variant="danger">Over Discharge</Badge>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            <div className="mx-4 mb-5 hidden overflow-x-auto rounded-lg border border-slate-200 sm:mx-5 md:block">
              <table className="w-full min-w-[980px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[7%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[11%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="sticky top-0 bg-slate-100 text-slate-700">
                  <tr>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-left font-extrabold">Hatch</th>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-extrabold">Initial Cargo</th>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-extrabold">Discharge</th>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-extrabold">Remaining</th>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-extrabold">
                      Est. Truck
                    </th>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-extrabold">Progress %</th>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-left font-extrabold">Status</th>
                    <th className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-extrabold">Total Truck</th>
                  </tr>
                </thead>
                <tbody>
                  {runningReport.map((row) => {
                    const estimatedTruckRequirement = getEstimatedTruckRequirement(
                      row.remainingOnBoard,
                      averageLoad,
                    )
                    const progressGap = (Number(row.progressPercentage) || 0) - summaryReport.overallProgress
                    const hatchLagStatus = getHatchLagStatus(progressGap)

                    return (
                      <tr key={row.hatch} className="hover:bg-red-50/40">
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 font-bold text-slate-900">{row.hatch}</td>
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right">{formatManagementNumber(row.finalStowage)}</td>
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right">{formatManagementNumber(row.totalDischarge)}</td>
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-900">
                          {formatManagementNumber(row.remainingOnBoard)}
                          {Number(row.remainingOnBoard) < 0 && (
                            <div className="mt-1">
                              <Badge variant="danger">Over Discharge</Badge>
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 bg-slate-50 px-3 py-2.5 text-right font-black text-slate-950">
                          {formatTruckRequirement(estimatedTruckRequirement)}
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right">
                          {formatPercentage(row.progressPercentage)}
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                          <Badge variant={hatchLagStatus.variant}>{hatchLagStatus.label}</Badge>
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right">
                          {formatTruck(row.totalTruck)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-slate-100 font-extrabold text-slate-950">
                    <td className="whitespace-nowrap border border-slate-300 px-3 py-3">TOTAL</td>
                    <td className="whitespace-nowrap border border-slate-300 px-3 py-3 text-right">
                      {formatManagementNumber(summaryReport.totalCargo)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-300 px-3 py-3 text-right">
                      {formatManagementNumber(summaryReport.totalDischarge)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-300 px-3 py-3 text-right">
                      {formatManagementNumber(summaryReport.totalRemaining)}
                      {Number(summaryReport.totalRemaining) < 0 && (
                        <div className="mt-1">
                          <Badge variant="danger">Over Discharge</Badge>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap border border-slate-300 bg-slate-200 px-3 py-3 text-right">
                      {formatTruckRequirement(estimatedTruckRequirementTotal)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-300 px-3 py-3 text-right">
                      {formatPercentage(summaryReport.overallProgress)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-300 px-3 py-3">-</td>
                    <td className="whitespace-nowrap border border-slate-300 px-3 py-3 text-right">
                      {formatTruck(summaryReport.totalTruck)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Card className="p-0">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-extrabold text-slate-950">Additional Calculation</h2>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-[520px] border-collapse text-sm">
                  <tbody>
                    <tr className="hover:bg-slate-50">
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3 font-extrabold text-slate-800">
                        Average load / truck
                      </td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right font-black text-slate-950">
                        {formatManagementNumber(averageLoad)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3 font-extrabold text-slate-800">
                        Est. truck requirement
                      </td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right font-black text-slate-950">
                        {formatTruckRequirement(estimatedTruckRequirementTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-0">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-base font-extrabold text-slate-950">Destination Summary</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Berdasarkan destination per truck.
                </p>
              </div>
              <div className="grid gap-3 p-4 md:hidden">
                {isDestinationSummaryLoading ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    Memuat destination summary...
                  </div>
                ) : destinationSummary.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    Belum ada data discharge.
                  </div>
                ) : (
                  <>
                    {destinationSummary.map((row) => (
                      <article key={row.destinationId} className="rounded-lg border border-slate-200 bg-white p-4">
                        <h3 className="font-black text-slate-950">{row.destination || '-'}</h3>
                        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <dt className="font-bold uppercase text-slate-500">Netto</dt>
                            <dd className="mt-1 font-black text-slate-950">
                              {formatManagementNumber(row.totalDischarge)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-bold uppercase text-slate-500">DT</dt>
                            <dd className="mt-1 font-black text-slate-950">
                              {formatTruck(row.totalDt)}
                            </dd>
                          </div>
                          <div>
                            <dt className="font-bold uppercase text-slate-500">Average</dt>
                            <dd className="mt-1 font-black text-slate-950">
                              {formatManagementNumber(row.averageTonnage)}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                    <article className="rounded-lg border border-slate-300 bg-slate-100 p-4">
                      <h3 className="font-black text-slate-950">{destinationSummaryTotal.destination}</h3>
                      <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Netto</dt>
                          <dd className="mt-1 font-black text-slate-950">
                            {formatManagementNumber(destinationSummaryTotal.totalDischarge)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">DT</dt>
                          <dd className="mt-1 font-black text-slate-950">
                            {formatTruck(destinationSummaryTotal.totalDt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Average</dt>
                          <dd className="mt-1 font-black text-slate-950">
                            {formatManagementNumber(destinationSummaryTotal.averageTonnage)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  </>
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[680px] border-collapse text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="whitespace-nowrap border border-slate-200 px-4 py-3 text-left font-extrabold">Destination</th>
                      <th className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right font-extrabold">Netto</th>
                      <th className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right font-extrabold">DT</th>
                      <th className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right font-extrabold">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isDestinationSummaryLoading ? (
                      <tr>
                        <td className="border border-slate-200 px-4 py-4 text-center font-semibold text-slate-500" colSpan="4">
                          Memuat destination summary...
                        </td>
                      </tr>
                    ) : destinationSummary.length === 0 ? (
                      <tr>
                        <td className="border border-slate-200 px-4 py-4 text-center font-semibold text-slate-500" colSpan="4">
                          Belum ada data discharge.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {destinationSummary.map((row) => (
                          <tr key={row.destinationId} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap border border-slate-200 px-4 py-3 font-bold">
                              {row.destination || '-'}
                            </td>
                            <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right">
                              {formatManagementNumber(row.totalDischarge)}
                            </td>
                            <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right">
                              {formatTruck(row.totalDt)}
                            </td>
                            <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right">
                              {formatManagementNumber(row.averageTonnage)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-black text-slate-950">
                          <td className="whitespace-nowrap border border-slate-200 px-4 py-3">
                            {destinationSummaryTotal.destination}
                          </td>
                          <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right">
                            {formatManagementNumber(destinationSummaryTotal.totalDischarge)}
                          </td>
                          <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right">
                            {formatTruck(destinationSummaryTotal.totalDt)}
                          </td>
                          <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right">
                            {formatManagementNumber(destinationSummaryTotal.averageTonnage)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default RunningReportPage
