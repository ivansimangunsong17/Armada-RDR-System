import { useEffect, useMemo, useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import PaginationControls from '../components/ui/PaginationControls.jsx'
import Select from '../components/ui/Select.jsx'
import { reportService } from '../services/reportService.js'
import { formatDate, formatMT, formatTruck } from '../utils/formatters.js'

const PAGE_SIZE = 20
const REPEAT_PAGE_SIZE = 20
const SINGLE_TRIP_PAGE_SIZE = 20

function getTodayDateInput() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '-'
}

function formatTripCount(value) {
  const tripCount = Math.round(Number(value) || 0)

  return `${tripCount.toLocaleString('en-US')} Trip`
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '-'

  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0))
  const days = Math.floor(safeMinutes / 1440)
  const hours = Math.floor((safeMinutes % 1440) / 60)
  const remainingMinutes = safeMinutes % 60

  if (days > 0) return `${days}d ${hours}j ${remainingMinutes}m`
  if (hours > 0) return `${hours}j ${remainingMinutes}m`

  return `${remainingMinutes}m`
}

function getDurationBadge(row) {
  if (!row.isDurationComplete) {
    return { label: 'Belum lengkap', variant: 'pending' }
  }

  const minutes = Number(row.durationMinutes) || 0

  if (minutes <= 120) return { label: 'Normal', variant: 'completed' }
  if (minutes <= 240) return { label: 'Dipantau', variant: 'watch' }

  return { label: 'Lama', variant: 'danger' }
}

function getStorageKey(currentUser) {
  const userKey = currentUser?.authUserId || currentUser?.id || 'guest'
  const roleKey = currentUser?.role || 'unknown'

  return `rdrs-truck-duration-selected-vessel-${roleKey}-${userKey}`
}

function TruckDurationReportPage({ appState }) {
  const { currentUser } = appState
  const [availableVessels, setAvailableVessels] = useState([])
  const [selectedVesselId, setSelectedVesselId] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [rows, setRows] = useState([])
  const [repeatSummary, setRepeatSummary] = useState([])
  const [singleTripSummary, setSingleTripSummary] = useState([])
  const [summary, setSummary] = useState({
    totalRows: 0,
    completedRows: 0,
    incompleteRows: 0,
    averageMinutes: 0,
    minMinutes: 0,
    maxMinutes: 0,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [repeatCurrentPage, setRepeatCurrentPage] = useState(1)
  const [singleTripCurrentPage, setSingleTripCurrentPage] = useState(1)
  const [isVesselLoading, setIsVesselLoading] = useState(true)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [error, setError] = useState('')
  const storageKey = getStorageKey(currentUser)

  useEffect(() => {
    loadVessels()
  }, [currentUser?.id])

  useEffect(() => {
    if (availableVessels.length === 0) {
      setSelectedVesselId('')
      return
    }

    const storedVesselId = window.localStorage.getItem(storageKey) || ''
    const hasSelected = availableVessels.some((vessel) => String(vessel.id) === selectedVesselId)
    const hasStored = availableVessels.some((vessel) => String(vessel.id) === storedVesselId)

    if (selectedVesselId && hasSelected) return

    const nextVesselId = hasStored ? storedVesselId : String(availableVessels[0].id)
    setSelectedVesselId(nextVesselId)
    window.localStorage.setItem(storageKey, nextVesselId)
  }, [availableVessels, selectedVesselId, storageKey])

  useEffect(() => {
    loadReport()
  }, [selectedVesselId, reportDate, currentPage])

  async function loadVessels() {
    setIsVesselLoading(true)
    setError('')

    const result = await reportService.getActiveVessels(currentUser)

    if (result.error) {
      setError('Gagal memuat vessel untuk report durasi truck.')
      setAvailableVessels([])
    } else {
      setAvailableVessels(result.data || [])
    }

    setIsVesselLoading(false)
  }

  async function loadReport() {
    if (!selectedVesselId) {
      setRows([])
      setRepeatSummary([])
      setSingleTripSummary([])
      setRepeatCurrentPage(1)
      setSingleTripCurrentPage(1)
      setTotalCount(0)
      return
    }

    setIsReportLoading(true)
    setError('')

    const result = await reportService.getTruckDurationReport({
      vesselId: selectedVesselId,
      reportDate,
      page: currentPage,
      pageSize: PAGE_SIZE,
    })

    if (result.error) {
      setError('Gagal memuat report durasi truck dari server.')
      setRows([])
      setRepeatSummary([])
      setSingleTripSummary([])
      setRepeatCurrentPage(1)
      setSingleTripCurrentPage(1)
      setTotalCount(0)
    } else {
      setRows(result.data || [])
      setRepeatSummary(result.repeatSummary || [])
      setSingleTripSummary(result.singleTripSummary || [])
      setRepeatCurrentPage((page) => {
        const nextTotalPages = Math.max(1, Math.ceil((result.repeatSummary || []).length / REPEAT_PAGE_SIZE))
        return Math.min(page, nextTotalPages)
      })
      setSingleTripCurrentPage((page) => {
        const nextTotalPages = Math.max(1, Math.ceil((result.singleTripSummary || []).length / SINGLE_TRIP_PAGE_SIZE))
        return Math.min(page, nextTotalPages)
      })
      setTotalCount(result.count || 0)
      setSummary(result.summary || summary)
    }

    setIsReportLoading(false)
  }

  function handleSelectVessel(value) {
    setSelectedVesselId(value)
    setCurrentPage(1)
    setRepeatCurrentPage(1)
    setSingleTripCurrentPage(1)
    window.localStorage.setItem(storageKey, value)
  }

  function handleDateChange(value) {
    setReportDate(value)
    setCurrentPage(1)
    setRepeatCurrentPage(1)
    setSingleTripCurrentPage(1)
  }

  const selectedVessel = useMemo(
    () => availableVessels.find((vessel) => String(vessel.id) === selectedVesselId),
    [availableVessels, selectedVesselId],
  )
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const repeatTotalPages = Math.max(1, Math.ceil(repeatSummary.length / REPEAT_PAGE_SIZE))
  const repeatFirstItem = repeatSummary.length === 0 ? 0 : (repeatCurrentPage - 1) * REPEAT_PAGE_SIZE + 1
  const repeatLastItem = Math.min(repeatCurrentPage * REPEAT_PAGE_SIZE, repeatSummary.length)
  const visibleRepeatSummary = repeatSummary.slice(repeatFirstItem === 0 ? 0 : repeatFirstItem - 1, repeatLastItem)
  const singleTripTotalPages = Math.max(1, Math.ceil(singleTripSummary.length / SINGLE_TRIP_PAGE_SIZE))
  const singleTripFirstItem = singleTripSummary.length === 0 ? 0 : (singleTripCurrentPage - 1) * SINGLE_TRIP_PAGE_SIZE + 1
  const singleTripLastItem = Math.min(singleTripCurrentPage * SINGLE_TRIP_PAGE_SIZE, singleTripSummary.length)
  const visibleSingleTripSummary = singleTripSummary.slice(singleTripFirstItem === 0 ? 0 : singleTripFirstItem - 1, singleTripLastItem)
  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(currentPage * PAGE_SIZE, totalCount)
  const summaryCards = [
    { label: 'Total DT', value: formatTruck(summary.totalRows) },
    { label: 'Data Lengkap', value: formatTruck(summary.completedRows) },
    { label: 'Belum Lengkap', value: formatTruck(summary.incompleteRows) },
    { label: 'Rata-rata Durasi', value: formatDuration(summary.averageMinutes) },
    { label: 'Durasi Tercepat', value: formatDuration(summary.minMinutes) },
    { label: 'Durasi Terlama', value: formatDuration(summary.maxMinutes) },
    { label: 'Truck Repeat', value: `${repeatSummary.length} Plate` },
    { label: 'Single Trip', value: `${singleTripSummary.length} Plate` },
  ]

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-red-800">
            Truck Duration Report
          </p>
          <h2 className="mt-1 truncate text-2xl font-black text-slate-950">
            {selectedVessel?.vesselName || 'Durasi Truck di Pelabuhan'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Menghitung selisih waktu dari gate in sampai gate out.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Select
            label="Vessel"
            value={selectedVesselId}
            onChange={(event) => handleSelectVessel(event.target.value)}
            disabled={isVesselLoading || availableVessels.length === 0}
          >
            {availableVessels.length === 0 ? (
              <option value="">Tidak ada vessel aktif</option>
            ) : (
              availableVessels.map((vessel) => (
                <option key={vessel.id} value={vessel.id}>
                  {vessel.vesselName}
                </option>
              ))
            )}
          </Select>
          <Input
            label="Gate Out Date"
            type="date"
            value={reportDate}
            onChange={(event) => handleDateChange(event.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => handleDateChange(getTodayDateInput())}
              disabled={isReportLoading}
            >
              Hari Ini
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => handleDateChange('')}
              disabled={!reportDate || isReportLoading}
            >
              Semua Tanggal
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {summaryCards.map((card) => (
          <Card key={card.label} className="p-4">
            <p className="text-xs font-extrabold uppercase text-slate-500">{card.label}</p>
            <p className="mt-2 text-xl font-black text-slate-950">{card.value}</p>
          </Card>
        ))}
      </div>


      <Card
        title="Repeat Truck Summary"
        subtitle="Truck dengan plate yang muncul lebih dari sekali pada vessel dan filter tanggal yang dipilih."
        className="p-0"
      >
        <div className="max-h-[460px] overflow-auto rounded-b-lg border-t border-slate-100">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-700 shadow-sm">
              <tr>
                <th className="w-12 border border-slate-200 px-3 py-2.5 text-right font-extrabold">No</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Plate</th>
                <th className="border border-slate-200 px-3 py-2.5 text-right font-extrabold">Total Trip</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">First Gate In</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Last Gate In</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Last Gate Out</th>
                <th className="border border-slate-200 px-3 py-2.5 text-right font-extrabold">Avg Duration</th>
                <th className="border border-slate-200 px-3 py-2.5 text-right font-extrabold">Avg Return Time</th>
                <th className="border border-slate-200 px-3 py-2.5 text-center font-extrabold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isReportLoading ? (
                <tr>
                  <td className="border border-slate-200 px-4 py-5 text-center font-semibold text-slate-500" colSpan="9">
                    Memuat repeat truck summary...
                  </td>
                </tr>
              ) : repeatSummary.length === 0 ? (
                <tr>
                  <td className="border border-slate-200 px-4 py-5 text-center font-semibold text-slate-500" colSpan="9">
                    Belum ada truck yang datang lebih dari sekali pada filter ini.
                  </td>
                </tr>
              ) : (
                visibleRepeatSummary.map((row, index) => (
                  <tr key={row.plateNumber} className="odd:bg-white even:bg-slate-50/60 hover:bg-red-50/40">
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right text-xs font-black text-slate-500">
                      {repeatFirstItem + index}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                      <span className="inline-flex rounded-md bg-slate-900 px-2.5 py-1 text-xs font-black tracking-wide text-white">
                        {row.plateNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-black text-slate-950">
                      {formatTripCount(row.tripCount)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                      <span className="block font-bold text-slate-900">{formatDate(row.firstGateInDate)}</span>
                      <span className="text-xs font-semibold text-slate-500">{formatTime(row.firstGateInTime)}</span>
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                      <span className="block font-bold text-slate-900">{formatDate(row.lastGateInDate)}</span>
                      <span className="text-xs font-semibold text-slate-500">{formatTime(row.lastGateInTime)}</span>
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                      <span className="block font-bold text-slate-900">{formatDate(row.lastGateOutDate)}</span>
                      <span className="text-xs font-semibold text-slate-500">{formatTime(row.lastGateOutTime)}</span>
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-900">
                      {formatDuration(row.averageDurationMinutes)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-900">
                      {formatDuration(row.averageTurnaroundMinutes)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-center">
                      <Badge variant="active">Repeat</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-bold text-slate-600">
            Menampilkan {repeatFirstItem}-{repeatLastItem} dari {repeatSummary.length} plate repeat
          </p>
          <PaginationControls
            currentPage={repeatCurrentPage}
            disabled={isReportLoading || repeatSummary.length === 0}
            totalPages={repeatTotalPages}
            onPageChange={setRepeatCurrentPage}
          />
        </div>
      </Card>


      <Card
        title="Single Trip Truck Summary"
        subtitle="Truck dengan plate yang hanya muncul satu kali pada vessel dan filter tanggal yang dipilih."
        className="p-0"
      >
        <div className="max-h-[460px] overflow-auto rounded-b-lg border-t border-slate-100">
          <table className="w-full min-w-[1060px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-slate-700 shadow-sm">
              <tr>
                <th className="w-12 border border-slate-200 px-3 py-2.5 text-right font-extrabold">No</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Plate</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Gate In</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Gate Out</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Hatch</th>
                <th className="border border-slate-200 px-3 py-2.5 text-left font-extrabold">Destination</th>
                <th className="border border-slate-200 px-3 py-2.5 text-right font-extrabold">Duration</th>
                <th className="border border-slate-200 px-3 py-2.5 text-center font-extrabold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isReportLoading ? (
                <tr>
                  <td className="border border-slate-200 px-4 py-5 text-center font-semibold text-slate-500" colSpan="8">
                    Memuat single trip truck summary...
                  </td>
                </tr>
              ) : singleTripSummary.length === 0 ? (
                <tr>
                  <td className="border border-slate-200 px-4 py-5 text-center font-semibold text-slate-500" colSpan="8">
                    Belum ada truck yang hanya satu trip pada filter ini.
                  </td>
                </tr>
              ) : (
                visibleSingleTripSummary.map((row, index) => (
                  <tr key={row.plateNumber} className="odd:bg-white even:bg-slate-50/60 hover:bg-red-50/40">
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right text-xs font-black text-slate-500">
                      {singleTripFirstItem + index}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                      <span className="inline-flex rounded-md bg-slate-900 px-2.5 py-1 text-xs font-black tracking-wide text-white">
                        {row.plateNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                      <span className="block font-bold text-slate-900">{formatDate(row.gateInDate)}</span>
                      <span className="text-xs font-semibold text-slate-500">{formatTime(row.gateInTime)}</span>
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5">
                      <span className="block font-bold text-slate-900">{formatDate(row.gateOutDate)}</span>
                      <span className="text-xs font-semibold text-slate-500">{formatTime(row.gateOutTime)}</span>
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 font-bold text-slate-900">
                      {row.hatch}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 font-bold text-slate-900">
                      {row.destination}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-right font-bold text-slate-900">
                      {formatDuration(row.durationMinutes)}
                    </td>
                    <td className="whitespace-nowrap border border-slate-200 px-3 py-2.5 text-center">
                      <Badge variant={row.isDurationComplete ? 'normal' : 'pending'}>
                        Single Trip
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-bold text-slate-600">
            Menampilkan {singleTripFirstItem}-{singleTripLastItem} dari {singleTripSummary.length} plate single trip
          </p>
          <PaginationControls
            currentPage={singleTripCurrentPage}
            disabled={isReportLoading || singleTripSummary.length === 0}
            totalPages={singleTripTotalPages}
            onPageChange={setSingleTripCurrentPage}
          />
        </div>
      </Card>

      <Card
        title="Detail Durasi Truck"
        subtitle="Data diurutkan berdasarkan waktu keluar terbaru."
        className="p-0"
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] border-collapse text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">Gate In</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">Gate Out</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">Plate</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">Checker</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">Hatch</th>
                <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">Netto</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">No Surat Jalan</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">No SJ Timbangan</th>
                <th className="border border-slate-200 px-4 py-3 text-right font-extrabold">Durasi</th>
                <th className="border border-slate-200 px-4 py-3 text-left font-extrabold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isReportLoading ? (
                <tr>
                  <td className="border border-slate-200 px-4 py-5 text-center font-semibold text-slate-500" colSpan="10">
                    Memuat report durasi truck...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="border border-slate-200 px-4 py-5 text-center font-semibold text-slate-500" colSpan="10">
                    Belum ada data truck untuk filter ini.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const status = getDurationBadge(row)

                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3">
                        <span className="block font-bold text-slate-900">{formatDate(row.gateInDate)}</span>
                        <span className="text-xs font-semibold text-slate-500">{formatTime(row.gateInTime)}</span>
                      </td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3">
                        <span className="block font-bold text-slate-900">{formatDate(row.gateOutDate)}</span>
                        <span className="text-xs font-semibold text-slate-500">{formatTime(row.gateOutTime)}</span>
                      </td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3 font-bold text-slate-900">
                        {row.plateNumber}
                      </td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3">{row.checkerName}</td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3">{row.hatch}</td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right">{formatMT(row.tonnage)}</td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3">{row.deliveryOrderNumber}</td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3">{row.scaleTicketNumber}</td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3 text-right font-black text-slate-950">
                        {formatDuration(row.durationMinutes)}
                      </td>
                      <td className="whitespace-nowrap border border-slate-200 px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-bold text-slate-600">
            Menampilkan {firstItem}-{lastItem} dari {totalCount} data
          </p>
          <PaginationControls
            currentPage={currentPage}
            disabled={isReportLoading}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>
    </div>
  )
}

export default TruckDurationReportPage
