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
  const selectedStatus = String(selectedVessel?.status || '').toLowerCase()

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
    {
      key: 'totalRemaining',
      label: 'Remaining',
      render: (row) => (
        <div>
          <span className="font-semibold">{formatMT(row.totalRemaining)}</span>
          {Number(row.totalRemaining) < 0 && (
            <div className="mt-1">
              <Badge variant="danger">Over Discharge</Badge>
            </div>
          )}
        </div>
      ),
    },
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
      render: (row) => (
        <div>
          <span className="font-semibold">{formatMT(row.remainingOnBoard)}</span>
          {Number(row.remainingOnBoard) < 0 && (
            <div className="mt-1">
              <Badge variant="danger">Over Discharge</Badge>
            </div>
          )}
        </div>
      ),
    },
    { key: 'progressPercentage', label: 'Progress', render: (row) => formatPercentage(row.progressPercentage) },
    { key: 'totalTruck', label: 'Total Truck', render: (row) => formatTruck(row.totalTruck) },
    { key: 'averageLoad', label: 'Average Load', render: (row) => formatMT(row.averageLoad) },
  ]

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
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
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((item) => (
              <Card key={item.label} className="min-w-0">
                <p className="text-xs font-bold uppercase text-slate-500">{item.label}</p>
                <strong className="mt-2 block break-words text-xl font-bold text-slate-900 sm:text-2xl">
                  {item.value}
                </strong>
                <p className="mt-1 text-sm text-slate-500">{item.note}</p>
              </Card>
            ))}
          </section>

          <Card title="Fleet Overall Progress" subtitle="Progress gabungan semua kapal yang sedang dimonitor.">
            <ProgressBar value={fleetProgress} showLabel />
          </Card>

          <Card title="Progress Semua Kapal" subtitle="Ringkasan progress tiap kapal dari Supabase.">
            <div className="grid gap-3 md:hidden">
              {vesselReports.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  Data kapal belum tersedia.
                </div>
              ) : (
                vesselReports.map((row) => {
                  const status = String(row.status || '').toLowerCase()

                  return (
                    <article key={row.id || row.vesselName} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-slate-950">{row.vesselName}</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {row.cargo || '-'} · {row.destination || '-'}
                          </p>
                        </div>
                        <Badge variant={status === 'active' ? 'active' : 'pending'}>{row.status}</Badge>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Total Cargo</dt>
                          <dd className="mt-1 font-black text-slate-950">{formatMT(row.totalCargo)}</dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Discharge</dt>
                          <dd className="mt-1 font-black text-slate-950">{formatMT(row.totalDischarge)}</dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Remaining</dt>
                          <dd className="mt-1 font-black text-slate-950">{formatMT(row.totalRemaining)}</dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Progress</dt>
                          <dd className="mt-1 font-black text-slate-950">{formatPercentage(row.overallProgress)}</dd>
                        </div>
                        <div>
                          <dt className="font-bold uppercase text-slate-500">Truck</dt>
                          <dd className="mt-1 font-black text-slate-950">{formatTruck(row.totalTruck)}</dd>
                        </div>
                      </dl>
                      {Number(row.totalRemaining) < 0 && (
                        <div className="mt-3">
                          <Badge variant="danger">Over Discharge</Badge>
                        </div>
                      )}
                    </article>
                  )
                })
              )}
            </div>
            <div className="hidden md:block">
              <Table columns={vesselColumns} data={vesselReports} />
            </div>
          </Card>

          <Card title="Detail Kapal" subtitle="Pilih kapal untuk melihat progress per hatch.">
            <div className="mb-5 w-full sm:max-w-md">
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

            <div className="mb-5 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Vessel Information
                  </p>
                  <h3 className="mt-1 break-words text-lg font-black text-slate-950">
                    {selectedVessel?.vesselName || '-'}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Cargo owner: {selectedVessel?.company || '-'}
                  </p>
                </div>
                <Badge variant={selectedStatus === 'active' ? 'active' : 'pending'}>
                  {selectedVessel?.status || '-'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">Jenis Cargo</p>
                  <p className="mt-1 font-bold text-slate-950">{selectedVessel?.cargo || '-'}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">Destination</p>
                  <p className="mt-1 font-bold text-slate-950">{selectedVessel?.destination || '-'}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">Start Discharge</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedVessel?.startDate ? formatDate(selectedVessel.startDate) : '-'}
                  </p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">ETA</p>
                  <p className="mt-1 font-bold text-slate-950">
                    {selectedVessel?.eta ? formatDate(selectedVessel.eta) : '-'}
                  </p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">Total Hatch</p>
                  <p className="mt-1 font-bold text-slate-950">{selectedVessel?.totalHatch || 0} Hatch</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">Total Cargo</p>
                  <p className="mt-1 font-bold text-slate-950">{formatMT(selectedSummary.totalCargo)}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">Discharge</p>
                  <p className="mt-1 font-bold text-slate-950">{formatMT(selectedSummary.totalDischarge)}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-extrabold uppercase text-slate-500">Progress</p>
                  <p className="mt-1 font-bold text-slate-950">{formatPercentage(selectedSummary.overallProgress)}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Final Stowage Plan
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedRunningReport.length === 0 ? (
                    <span className="text-sm font-semibold text-slate-500">Data FSP belum tersedia.</span>
                  ) : (
                    selectedRunningReport.map((row) => (
                      <span
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
                        key={row.hatchCargoId || row.hatch}
                      >
                        {row.hatch}: {formatMT(row.finalStowage)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {selectedRunningReport.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  Data hatch belum tersedia.
                </div>
              ) : (
                selectedRunningReport.map((row) => (
                  <article key={row.hatch} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="text-lg font-black text-slate-950">{row.hatch}</h3>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Final Stowage</dt>
                        <dd className="mt-1 font-black text-slate-950">{formatMT(row.finalStowage)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Discharge</dt>
                        <dd className="mt-1 font-black text-slate-950">{formatMT(row.totalDischarge)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Remaining</dt>
                        <dd className="mt-1 font-black text-slate-950">{formatMT(row.remainingOnBoard)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Progress</dt>
                        <dd className="mt-1 font-black text-slate-950">{formatPercentage(row.progressPercentage)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Truck</dt>
                        <dd className="mt-1 font-black text-slate-950">{formatTruck(row.totalTruck)}</dd>
                      </div>
                      <div>
                        <dt className="font-bold uppercase text-slate-500">Average Load</dt>
                        <dd className="mt-1 font-black text-slate-950">{formatMT(row.averageLoad)}</dd>
                      </div>
                    </dl>
                    {Number(row.remainingOnBoard) < 0 && (
                      <div className="mt-3">
                        <Badge variant="danger">Over Discharge</Badge>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
            <div className="hidden md:block">
              <Table columns={hatchColumns} data={selectedRunningReport} />
            </div>
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
