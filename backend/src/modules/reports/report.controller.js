import {
  listActiveVesselsForReports,
  listDestinations,
  listEntriesUntilDate,
  listHatchCargoRows,
  listLatestDischargeEntries,
  listRunningDestinationSummary,
  listRunningReportRows,
  listShiftReportRows,
  listTruckDurationRows,
} from './report.repository.js'
import {
  mapHatchCargoRow,
  mapLatestEntry,
  mapRunningReportRow,
  mapTimedReportRow,
  mapTruckDurationRow,
  mapVessel,
} from './report.mapper.js'
import {
  buildRepeatTruckSummary,
  buildSingleTripTruckSummary,
  buildTruckDurationSummary,
  getTimeMinutes,
  safeNumber,
} from './report.utils.js'

function parseVesselIds(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildTimedRowsFromEntries(hatchRows, entries) {
  const totalsByHatchId = entries.reduce((result, entry) => {
    const hatchCargoId = entry.hatch_cargo_id
    if (!hatchCargoId) return result

    const current = result[hatchCargoId] || {
      totalDischarge: 0,
      totalTruck: 0,
    }

    current.totalDischarge += safeNumber(entry.tonnage)
    current.totalTruck += 1
    result[hatchCargoId] = current

    return result
  }, {})

  return hatchRows.map((hatch) => {
    const totals = totalsByHatchId[hatch.hatchCargoId] || {}
    const totalDischarge = safeNumber(totals.totalDischarge)
    const totalTruck = safeNumber(totals.totalTruck)

    return {
      vesselId: hatch.vesselId,
      vesselName: '',
      destination: '',
      gateOutDate: '',
      periodStartHour: null,
      periodEndHour: null,
      hatchCargoId: hatch.hatchCargoId,
      hatchNo: hatch.hatchNo,
      hatch: hatch.hatch,
      totalDischarge,
      totalTruck,
      averageTonnage: totalTruck > 0 ? totalDischarge / totalTruck : 0,
    }
  })
}

function buildRunningPositionAfterPeriod(hatchRows, entries) {
  const totalCargo = hatchRows.reduce((total, hatch) => total + safeNumber(hatch.initialCargo), 0)
  const totalDischarge = entries.reduce((total, entry) => total + safeNumber(entry.tonnage), 0)
  const totalTruck = entries.length
  const remainingCargo = totalCargo - totalDischarge
  const progressPercentage = totalCargo > 0 ? (totalDischarge / totalCargo) * 100 : 0
  const averageLoad = totalTruck > 0 ? totalDischarge / totalTruck : 0
  const hatchRunningRows = buildTimedRowsFromEntries(hatchRows, entries).map((row) => {
    const hatchCargo = hatchRows.find((hatch) => hatch.hatchCargoId === row.hatchCargoId)
    const initialCargo = safeNumber(hatchCargo?.initialCargo)

    return {
      ...row,
      initialCargo,
      remainingCargo: initialCargo - safeNumber(row.totalDischarge),
      progressPercentage: initialCargo > 0
        ? (safeNumber(row.totalDischarge) / initialCargo) * 100
        : 0,
    }
  })

  return {
    totalCargo,
    totalDischarge,
    totalTruck,
    remainingCargo,
    progressPercentage,
    averageLoad,
    hatchRows: hatchRunningRows,
  }
}

function isEntryIncludedAfterPeriod(entry, reportDate, periodEndHour) {
  if (!entry.gate_out_date || !entry.gate_out_time) return false
  if (entry.gate_out_date < reportDate) return true
  if (entry.gate_out_date > reportDate) return false

  const minutes = getTimeMinutes(entry.gate_out_time)
  if (minutes === null) return false

  return minutes < Number(periodEndHour) * 60
}

function isEntryIncludedInPeriod(entry, reportDate, periodStartHour, periodEndHour) {
  if (!entry.gate_out_date || !entry.gate_out_time) return false
  if (entry.gate_out_date !== reportDate) return false

  const minutes = getTimeMinutes(entry.gate_out_time)
  if (minutes === null) return false

  const startMinutes = Number(periodStartHour) * 60
  const endMinutes = Number(periodEndHour) * 60

  return minutes >= startMinutes && minutes < endMinutes
}

function buildPeriodDestinationSummary(entries, destinationMap) {
  const groupedRows = entries.reduce((result, entry) => {
    const destinationId = entry.destination_id || entry.vessel_destination_id || 'unknown'
    const current = result[destinationId] || {
      destinationId,
      destination: destinationMap[destinationId] || '-',
      totalDischarge: 0,
      totalDt: 0,
      averageTonnage: 0,
    }

    current.totalDischarge += safeNumber(entry.tonnage)
    current.totalDt += 1
    current.averageTonnage = current.totalDt > 0 ? current.totalDischarge / current.totalDt : 0
    result[destinationId] = current

    return result
  }, {})

  return Object.values(groupedRows).sort((a, b) => a.destination.localeCompare(b.destination))
}

export async function getActiveVessels(req, res, next) {
  try {
    const rows = await listActiveVesselsForReports(req.auth.user)

    res.json({
      data: rows.map(mapVessel),
    })
  } catch (error) {
    next(error)
  }
}

export async function getDashboardDataset(req, res, next) {
  try {
    const vessels = (await listActiveVesselsForReports(req.auth.user)).map(mapVessel)
    const vesselIds = vessels.map((vessel) => vessel.id)
    const [runningRows, latestEntries] = await Promise.all([
      listRunningReportRows(vesselIds),
      listLatestDischargeEntries(vesselIds),
    ])

    res.json({
      vessels,
      runningRows: runningRows.map(mapRunningReportRow),
      latestEntries: latestEntries.map(mapLatestEntry),
    })
  } catch (error) {
    next(error)
  }
}

export async function getRunningReport(req, res, next) {
  try {
    const rows = await listRunningReportRows(parseVesselIds(req.query.vesselIds))

    res.json({
      data: rows.map(mapRunningReportRow),
    })
  } catch (error) {
    next(error)
  }
}

export async function getRunningDestinationSummary(req, res, next) {
  try {
    const rows = await listRunningDestinationSummary(req.query.vesselId)

    res.json({
      data: rows.map((row) => ({
        destinationId: row.destination_id,
        destination: row.destination,
        totalDischarge: safeNumber(row.total_discharge),
        totalDt: safeNumber(row.total_dt),
        averageTonnage: safeNumber(row.average_tonnage),
      })),
    })
  } catch (error) {
    next(error)
  }
}

export async function getShiftReport(req, res, next) {
  try {
    const { vesselId, reportDate, shiftName } = req.query

    if (!vesselId || !reportDate || !shiftName) {
      res.json({ data: [] })
      return
    }

    const rows = await listShiftReportRows({ vesselId, reportDate, shiftName })

    res.json({
      data: rows.map(mapTimedReportRow),
    })
  } catch (error) {
    next(error)
  }
}

export async function getPeriodTwoHourReport(req, res, next) {
  try {
    const { vesselId, reportDate, periodStartHour, periodEndHour } = req.query

    if (!vesselId || !reportDate || periodStartHour === '' || periodEndHour === '') {
      res.json({
        data: [],
        runningPosition: buildRunningPositionAfterPeriod([], []),
        destinationSummary: [],
      })
      return
    }

    const [hatchRowsResult, entries, destinations] = await Promise.all([
      listHatchCargoRows(vesselId),
      listEntriesUntilDate(vesselId, reportDate),
      listDestinations(),
    ])
    const hatchRows = hatchRowsResult.map(mapHatchCargoRow)
    const periodEntries = entries.filter((entry) =>
      isEntryIncludedInPeriod(entry, reportDate, periodStartHour, periodEndHour),
    )
    const runningEntries = entries.filter((entry) =>
      isEntryIncludedAfterPeriod(entry, reportDate, periodEndHour),
    )
    const destinationMap = Object.fromEntries(
      destinations.map((destination) => [destination.id, destination.name]),
    )

    res.json({
      data: buildTimedRowsFromEntries(hatchRows, periodEntries),
      runningPosition: buildRunningPositionAfterPeriod(hatchRows, runningEntries),
      destinationSummary: buildPeriodDestinationSummary(periodEntries, destinationMap),
    })
  } catch (error) {
    next(error)
  }
}

export async function getTruckDurationReport(req, res, next) {
  try {
    const { vesselId, reportDate = '', page = 1, pageSize = 20 } = req.query

    if (!vesselId) {
      const emptyRows = []
      res.json({
        data: [],
        count: 0,
        summary: buildTruckDurationSummary(emptyRows),
        repeatSummary: [],
        singleTripSummary: [],
      })
      return
    }

    const result = await listTruckDurationRows({ vesselId, reportDate, page, pageSize })
    const pageRows = result.pageRows.map(mapTruckDurationRow)
    const summaryRows = result.summaryRows.map(mapTruckDurationRow)

    res.json({
      data: pageRows,
      count: result.count,
      summary: buildTruckDurationSummary(summaryRows),
      repeatSummary: buildRepeatTruckSummary(summaryRows),
      singleTripSummary: buildSingleTripTruckSummary(summaryRows),
    })
  } catch (error) {
    next(error)
  }
}
