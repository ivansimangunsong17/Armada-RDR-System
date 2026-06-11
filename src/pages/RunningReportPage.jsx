import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Select from '../components/ui/Select.jsx'
import {
  buildSummary,
  getReportDataset,
} from '../services/reportService.js'
import { exportRunningReportExcel } from '../services/excelExportService.js'
import { formatDate, formatPercentage, formatTruck } from '../utils/formatters.js'

function formatManagementMT(value) {
  const numericValue = Number(value) || 0

  return `${numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} MT`
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
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const selectedVesselStorageKey = getSelectedVesselStorageKey(currentUser)

  useEffect(() => {
    loadReport()
  }, [currentUser?.id])

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

  const selectedVessel = useMemo(() => {
    const fallback = availableVessels[0]
    return availableVessels.find((vessel) => String(vessel.id) === selectedVesselId) || fallback
  }, [availableVessels, selectedVesselId])

  const runningReport = runningRows.filter((row) => row.vesselId === selectedVessel?.id)
  const summaryReport = buildSummary(runningReport)

  const averageLoad = summaryReport.averageLoadPerTruck
  const estimatedTruckRequirementTotal = getEstimatedTruckRequirement(
    summaryReport.totalRemaining,
    averageLoad,
  )
  const summaryCards = [
    { label: 'Total Cargo', value: formatManagementMT(summaryReport.totalCargo) },
    { label: 'Total Discharge', value: formatManagementMT(summaryReport.totalDischarge) },
    { label: 'Remaining Cargo', value: formatManagementMT(summaryReport.totalRemaining) },
    { label: 'Progress %', value: formatPercentage(summaryReport.overallProgress) },
    { label: 'Total Truck', value: formatTruck(summaryReport.totalTruck) },
    { label: 'Average Load', value: formatManagementMT(averageLoad) },
  ]

  function handlePrint() {
    window.print()
  }

  function handleExportExcel() {
    exportRunningReportExcel({
      vessel: selectedVessel,
      rows: runningReport,
      summary: summaryReport,
      averageLoadOverall: averageLoad,
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
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Running Discharge Result dari view running_report Supabase.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          <Button
            type="button"
            variant="success"
            onClick={handleExportExcel}
            disabled={!selectedVessel || runningReport.length === 0}
          >
            Export Excel
          </Button>
          <Button type="button" variant="secondary" onClick={handlePrint}>
            Print
          </Button>
          {secondaryReportLinks.map((link) => (
            <Link
              key={link.to}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-200"
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
        <Card>
          <p className="text-sm text-slate-500">Memuat running report dari Supabase...</p>
        </Card>
      ) : (
        <>
          {!isChecker && (
            <Card title="Filter Kapal">
              <div className="max-w-md">
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
            </Card>
          )}

          <Card>
            <div className="mb-5 text-center">
              <p className="text-lg font-extrabold uppercase text-slate-950">
                {selectedVessel?.company || '-'}
              </p>
              <p className="mt-1 text-lg font-extrabold uppercase text-slate-950">
                {selectedVessel?.vesselName || '-'}
              </p>
              <p className="mt-2 text-xl font-black uppercase tracking-wide text-red-800">
                RUNNING DISCHARGE RESULT
              </p>
              <p className="mt-1 text-sm text-slate-500">Printed preview: {formatDate(new Date())}</p>
            </div>

            <section className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {summaryCards.map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-extrabold text-slate-950">{item.value}</p>
                </div>
              ))}
            </section>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">Hatch</th>
                    <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">Initial Cargo</th>
                    <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">Discharge</th>
                    <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">Remaining</th>
                    <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">Progress %</th>
                    <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">Total Truck</th>
                    <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">
                      Est. Truck Requirement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {runningReport.map((row) => {
                    const estimatedTruckRequirement = getEstimatedTruckRequirement(
                      row.remainingOnBoard,
                      averageLoad,
                    )

                    return (
                      <tr key={row.hatch} className="hover:bg-red-50/40">
                        <td className="border border-slate-200 px-4 py-3 font-bold text-slate-900">{row.hatch}</td>
                        <td className="border border-slate-200 px-4 py-3 text-right">{formatManagementMT(row.finalStowage)}</td>
                        <td className="border border-slate-200 px-4 py-3 text-right">{formatManagementMT(row.totalDischarge)}</td>
                        <td className="border border-slate-200 px-4 py-3 text-right font-bold text-slate-900">
                          {formatManagementMT(row.remainingOnBoard)}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-right">
                          {formatPercentage(row.progressPercentage)}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-right">
                          {formatTruck(row.totalTruck)}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-right font-bold text-slate-900">
                          {formatTruckRequirement(estimatedTruckRequirement)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-slate-100 font-extrabold text-slate-950">
                    <td className="border border-slate-200 px-4 py-3">TOTAL</td>
                    <td className="border border-slate-200 px-4 py-3 text-right">
                      {formatManagementMT(summaryReport.totalCargo)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right">
                      {formatManagementMT(summaryReport.totalDischarge)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right">
                      {formatManagementMT(summaryReport.totalRemaining)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right">
                      {formatPercentage(summaryReport.overallProgress)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right">
                      {formatTruck(summaryReport.totalTruck)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right">
                      {formatTruckRequirement(estimatedTruckRequirementTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Additional Calculation">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full border-collapse text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-4 py-3 font-bold text-slate-800">
                        Average load / truck
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-right font-bold">
                        {formatManagementMT(averageLoad)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-4 py-3 font-bold text-slate-800">
                        Est. truck requirement
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-right font-bold">
                        {formatTruckRequirement(estimatedTruckRequirementTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Destination Summary">
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-200 px-4 py-3 text-left">Destination</th>
                      <th className="border border-slate-200 px-4 py-3">Netto</th>
                      <th className="border border-slate-200 px-4 py-3">DT</th>
                      <th className="border border-slate-200 px-4 py-3">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-4 py-3 font-bold">
                        {selectedVessel?.destination || '-'}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-center">
                        {formatManagementMT(summaryReport.totalDischarge)}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-center">
                        {formatTruck(summaryReport.totalTruck)}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-center">
                        {formatManagementMT(averageLoad)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default RunningReportPage
