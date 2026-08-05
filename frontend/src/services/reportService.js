import { apiClient } from './apiClient.js'
import {
  buildDestinationSummaryTotal,
  buildSummary,
  buildTimedReportSummary,
  buildVesselReports,
  safeNumber,
} from '../utils/calculations.js'

export {
  buildDestinationSummaryTotal,
  buildSummary,
  buildTimedReportSummary,
  buildVesselReports,
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export function buildTruckDurationSummary(rows = []) {
  const completeRows = rows.filter((row) => row.durationMinutes !== null)
  const totalMinutes = completeRows.reduce(
    (total, row) => total + safeNumber(row.durationMinutes),
    0,
  )
  const durationValues = completeRows.map((row) => safeNumber(row.durationMinutes))

  return {
    totalRows: rows.length,
    completedRows: completeRows.length,
    incompleteRows: rows.length - completeRows.length,
    averageMinutes: completeRows.length > 0 ? totalMinutes / completeRows.length : 0,
    minMinutes: durationValues.length > 0 ? Math.min(...durationValues) : 0,
    maxMinutes: durationValues.length > 0 ? Math.max(...durationValues) : 0,
  }
}

export function buildRepeatTruckSummary(rows = []) {
  const groupedRows = rows.reduce((result, row) => {
    const plateNumber = String(row.plateNumber || '').trim().toUpperCase()
    if (!plateNumber || plateNumber === '-') return result

    const current = result[plateNumber] || []
    current.push(row)
    result[plateNumber] = current

    return result
  }, {})

  return Object.entries(groupedRows)
    .map(([plateNumber, truckRows]) => {
      const sortedRows = [...truckRows].sort((first, second) => {
        const firstTime = new Date(first.gateInAt || first.gateOutAt || 0).getTime()
        const secondTime = new Date(second.gateInAt || second.gateOutAt || 0).getTime()

        return firstTime - secondTime
      })
      const completedRows = sortedRows.filter((row) => row.durationMinutes !== null)
      const totalDurationMinutes = completedRows.reduce(
        (total, row) => total + safeNumber(row.durationMinutes),
        0,
      )
      const turnaroundMinutes = []

      for (let index = 1; index < sortedRows.length; index += 1) {
        const previousGateOut = sortedRows[index - 1].gateOutAt
        const currentGateIn = sortedRows[index].gateInAt

        if (!previousGateOut || !currentGateIn) continue

        const previousTime = new Date(previousGateOut)
        const currentTime = new Date(currentGateIn)

        if (Number.isNaN(previousTime.getTime()) || Number.isNaN(currentTime.getTime())) continue

        const diffMinutes = Math.round((currentTime.getTime() - previousTime.getTime()) / 60000)
        if (diffMinutes >= 0) turnaroundMinutes.push(diffMinutes)
      }

      const firstTrip = sortedRows[0] || {}
      const lastTrip = sortedRows[sortedRows.length - 1] || {}
      const totalTurnaroundMinutes = turnaroundMinutes.reduce((total, value) => total + value, 0)

      return {
        plateNumber,
        tripCount: sortedRows.length,
        completedTripCount: completedRows.length,
        firstGateInDate: firstTrip.gateInDate,
        firstGateInTime: firstTrip.gateInTime,
        lastGateInDate: lastTrip.gateInDate,
        lastGateInTime: lastTrip.gateInTime,
        lastGateOutDate: lastTrip.gateOutDate,
        lastGateOutTime: lastTrip.gateOutTime,
        averageDurationMinutes: completedRows.length > 0
          ? totalDurationMinutes / completedRows.length
          : 0,
        averageTurnaroundMinutes: turnaroundMinutes.length > 0
          ? totalTurnaroundMinutes / turnaroundMinutes.length
          : null,
      }
    })
    .filter((row) => row.tripCount > 1)
    .sort((first, second) => {
      if (second.tripCount !== first.tripCount) return second.tripCount - first.tripCount

      return String(first.plateNumber).localeCompare(String(second.plateNumber))
    })
}

export function buildSingleTripTruckSummary(rows = []) {
  const groupedRows = rows.reduce((result, row) => {
    const plateNumber = String(row.plateNumber || '').trim().toUpperCase()
    if (!plateNumber || plateNumber === '-') return result

    const current = result[plateNumber] || []
    current.push(row)
    result[plateNumber] = current

    return result
  }, {})

  return Object.entries(groupedRows)
    .filter(([, truckRows]) => truckRows.length === 1)
    .map(([plateNumber, truckRows]) => {
      const trip = truckRows[0] || {}

      return {
        plateNumber,
        tripCount: 1,
        gateInDate: trip.gateInDate,
        gateInTime: trip.gateInTime,
        gateOutDate: trip.gateOutDate,
        gateOutTime: trip.gateOutTime,
        hatch: trip.hatch || '-',
        destination: trip.destination || '-',
        durationMinutes: trip.durationMinutes,
        isDurationComplete: trip.isDurationComplete,
      }
    })
    .sort((first, second) => {
      const firstTime = `${first.gateOutDate || ''} ${first.gateOutTime || ''}`
      const secondTime = `${second.gateOutDate || ''} ${second.gateOutTime || ''}`

      return secondTime.localeCompare(firstTime)
    })
}

export async function getActiveVesselsForReports() {
  const { data, error } = await apiClient.request('/reports/active-vessels')

  return {
    data: data?.data || [],
    error,
  }
}

export async function getRunningDestinationSummary(vesselId) {
  if (!vesselId) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/reports/running-destination-summary${buildQuery({ vesselId })}`,
  )

  return {
    data: data?.data || [],
    error,
  }
}

export async function getRunningReportRows(vesselIds) {
  if (vesselIds.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/reports/running${buildQuery({ vesselIds })}`,
  )

  return {
    data: data?.data || [],
    error,
  }
}

export async function getLatestDischargeEntries(vesselIds) {
  if (vesselIds.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const datasetResult = await getReportDataset()

  return {
    data: datasetResult.latestEntries,
    error: datasetResult.error,
  }
}

export async function getReportDataset() {
  const { data, error } = await apiClient.request('/reports/dashboard')

  return {
    vessels: data?.vessels || [],
    runningRows: data?.runningRows || [],
    latestEntries: data?.latestEntries || [],
    error,
  }
}

export async function getShiftReportRows({ vesselId, reportDate, shiftName }) {
  if (!vesselId || !reportDate || !shiftName) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/reports/shift${buildQuery({ vesselId, reportDate, shiftName })}`,
  )

  return {
    data: data?.data || [],
    error,
  }
}

export async function getPeriodTwoHourReportRows({
  vesselId,
  reportDate,
  periodStartHour,
  periodEndHour,
}) {
  if (!vesselId || !reportDate || periodStartHour === '' || periodEndHour === '') {
    return {
      data: [],
      runningPosition: {
        totalCargo: 0,
        totalDischarge: 0,
        totalTruck: 0,
        remainingCargo: 0,
        progressPercentage: 0,
        averageLoad: 0,
        hatchRows: [],
      },
      destinationSummary: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/reports/period-two-hour${buildQuery({
      periodEndHour,
      periodStartHour,
      reportDate,
      vesselId,
    })}`,
  )

  return {
    data: data?.data || [],
    runningPosition: data?.runningPosition || {},
    destinationSummary: data?.destinationSummary || [],
    error,
  }
}

export async function getTruckDurationReportRows({
  vesselId,
  reportDate = '',
  page = 1,
  pageSize = 20,
}) {
  if (!vesselId) {
    return {
      data: [],
      count: 0,
      summary: buildTruckDurationSummary([]),
      repeatSummary: [],
      singleTripSummary: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/reports/truck-duration${buildQuery({ page, pageSize, reportDate, vesselId })}`,
  )

  return {
    data: data?.data || [],
    count: data?.count ?? 0,
    summary: data?.summary || buildTruckDurationSummary([]),
    repeatSummary: data?.repeatSummary || [],
    singleTripSummary: data?.singleTripSummary || [],
    error,
  }
}

export const reportService = {
  getActiveVessels: getActiveVesselsForReports,
  getDataset: getReportDataset,
  getLatestDischargeEntries,
  getPeriodTwoHourReport: getPeriodTwoHourReportRows,
  getRunningDestinationSummary,
  getRunningReport: getRunningReportRows,
  getShiftReport: getShiftReportRows,
  getTruckDurationReport: getTruckDurationReportRows,
}
