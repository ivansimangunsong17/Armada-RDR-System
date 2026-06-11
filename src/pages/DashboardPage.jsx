import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import ProgressBar from '../components/ui/ProgressBar.jsx'
import Select from '../components/ui/Select.jsx'
import Table from '../components/ui/Table.jsx'
import {
  buildSummary,
  buildVesselReports,
  getReportDataset,
} from '../services/reportService.js'
import {
  formatDate,
  formatMT,
  formatPercentage,
  formatTruck,
} from '../utils/formatters.js'

function DashboardPage({ appState, dashboardTitle, dashboardDescription }) {
  const { currentUser } = appState
  const isChecker = currentUser?.role === 'checker'
  const [vessels, setVessels] = useState([])
  const [runningRows, setRunningRows] = useState([])
  const [latestEntries, setLatestEntries] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [currentUser?.id])

  async function loadDashboard() {
    setIsLoading(true)
    setError('')

    const result = await getReportDataset(currentUser)

    if (result.error) {
      setError('Gagal memuat dashboard dari Supabase.')
    }

    setVessels(result.vessels)
    setRunningRows(result.runningRows)
    setLatestEntries(result.latestEntries)
    setIsLoading(false)
  }

  const visibleVessels = vessels
  const selectedVessel = useMemo(() => {
    const fallback = visibleVessels[0]
    return visibleVessels.find((vessel) => String(vessel.id) === selectedVesselId) || fallback
  }, [selectedVesselId, visibleVessels])

  const vesselReports = buildVesselReports(visibleVessels, runningRows)
  const fleetSummary = buildSummary(runningRows)
  const fleetProgress = fleetSummary.overallProgress
  const fleetAverageLoad = fleetSummary.averageLoadPerTruck

  const selectedRunningReport = runningRows.filter((row) => row.vesselId === selectedVessel?.id)
  const selectedSummary = buildSummary(selectedRunningReport)
  const lastUpdate = latestEntries.find((entry) => entry.vesselId === selectedVessel?.id)

  const summaryCards = [
    { label: 'Total Cargo', value: formatMT(fleetSummary.totalCargo), note: 'Semua kapal berjalan' },
    {
      label: 'Total Discharge',
      value: formatMT(fleetSummary.totalDischarge),
      note: 'Akumulasi semua kapal',
    },
    {
      label: 'Remaining On Board',
      value: formatMT(fleetSummary.totalRemaining),
      note: 'Sisa semua kapal',
    },
    { label: 'Fleet Progress', value: formatPercentage(fleetProgress), note: 'Progress gabungan' },
    { label: 'Total Truck', value: formatTruck(fleetSummary.totalTruck), note: 'Semua kapal' },
    {
      label: 'Average Load / Truck',
      value: formatMT(fleetAverageLoad),
      note: 'Rata-rata gabungan',
    },
  ]

  const vesselColumns = [
    { key: 'vesselName', label: 'Vessel' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'destination', label: 'Destination' },
    { key: 'totalCargo', label: 'Total Cargo', render: (row) => formatMT(row.totalCargo) },
    { key: 'totalDischarge', label: 'Discharge', render: (row) => formatMT(row.totalDischarge) },
    { key: 'totalRemaining', label: 'Remaining', render: (row) => formatMT(row.totalRemaining) },
    {
      key: 'overallProgress',
      label: 'Progress',
      render: (row) => formatPercentage(row.overallProgress),
    },
    { key: 'totalTruck', label: 'Truck', render: (row) => formatTruck(row.totalTruck) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const status = String(row.status || '').toLowerCase()
        return <Badge variant={status === 'active' ? 'active' : 'pending'}>{row.status}</Badge>
      },
    },
  ]

  const hatchColumns = [
    { key: 'hatch', label: 'Hatch' },
    { key: 'finalStowage', label: 'Final Stowage Plan', render: (row) => formatMT(row.finalStowage) },
    { key: 'totalDischarge', label: 'Total Discharge', render: (row) => formatMT(row.totalDischarge) },
    {
      key: 'remainingOnBoard',
      label: 'Remaining On Board',
      render: (row) => formatMT(row.remainingOnBoard),
    },
    { key: 'progressPercentage', label: 'Progress', render: (row) => formatPercentage(row.progressPercentage) },
    { key: 'totalTruck', label: 'Total Truck', render: (row) => formatTruck(row.totalTruck) },
    { key: 'averageLoad', label: 'Average Load', render: (row) => formatMT(row.averageLoad) },
  ]

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {dashboardTitle || (isChecker ? 'Progress Discharge Kapal' : 'Dashboard Multi Kapal')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {dashboardDescription ||
              (isChecker
                ? 'Monitoring progress kapal yang ditugaskan kepada checker.'
                : 'Monitoring beberapa kapal berjalan secara paralel tanpa menunggu kapal lain selesai.')}
          </p>
        </div>
        <div className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
          <p className="font-bold text-slate-900">Kapal Dimonitor</p>
          <p className="mt-1 text-xl font-bold text-red-800">{visibleVessels.length} Kapal</p>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-500">Memuat dashboard dari Supabase...</p>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((item) => (
              <Card key={item.label}>
                <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
                <strong className="mt-2 block text-2xl font-bold text-slate-900">{item.value}</strong>
                <p className="mt-1 text-sm text-slate-500">{item.note}</p>
              </Card>
            ))}
          </section>

          <Card title="Fleet Overall Progress" subtitle="Progress gabungan semua kapal yang sedang dimonitor.">
            <ProgressBar value={fleetProgress} showLabel />
          </Card>

          <Card title="Progress Semua Kapal" subtitle="Ringkasan progress tiap kapal dari Supabase.">
            <Table columns={vesselColumns} data={vesselReports} />
          </Card>

          <Card title="Detail Kapal" subtitle="Pilih kapal untuk melihat progress per hatch.">
            <div className="mb-5 max-w-md">
              <Select
                label="Pilih Kapal"
                value={String(selectedVessel?.id || '')}
                onChange={(event) => setSelectedVesselId(event.target.value)}
              >
                {visibleVessels.map((vessel) => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.vesselName}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mb-5 grid gap-3 rounded-lg bg-slate-100 p-4 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
              <p><span className="font-bold text-slate-900">Company:</span> {selectedVessel?.company || '-'}</p>
              <p><span className="font-bold text-slate-900">Cargo:</span> {selectedVessel?.cargo || '-'}</p>
              <p><span className="font-bold text-slate-900">Destination:</span> {selectedVessel?.destination || '-'}</p>
              <p><span className="font-bold text-slate-900">Progress:</span> {formatPercentage(selectedSummary.overallProgress)}</p>
            </div>

            <Table columns={hatchColumns} data={selectedRunningReport} />
          </Card>

          <Card title="Update Terakhir" subtitle="Data discharge terakhir dari kapal yang dipilih.">
            {lastUpdate ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Tanggal</p>
                  <p className="mt-1 font-bold text-slate-900">{formatDate(lastUpdate.gateOutDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Gate Out Time</p>
                  <p className="mt-1 font-bold text-slate-900">{lastUpdate.gateOutTime}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Hatch</p>
                  <p className="mt-1 font-bold text-slate-900">{lastUpdate.hatch}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Discharge</p>
                  <p className="mt-1 font-bold text-slate-900">{formatMT(lastUpdate.tonnage)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data discharge untuk kapal ini.</p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default DashboardPage
