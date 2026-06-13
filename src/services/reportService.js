import { supabase } from '../lib/supabaseClient.js'

function getSupabaseRequiredError() {
  return new Error(
    'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

function safeNumber(value) {
  return Number(value) || 0
}

function mapVessel(row) {
  const destination = row.destinations || {}

  return {
    id: row.id,
    vesselName: row.vessel_name,
    company: row.cargo_owner,
    cargo: row.cargo_type,
    destinationId: row.destination_id,
    destination: destination.name || '-',
    totalHatch: row.total_hatch,
    eta: row.eta,
    startDate: row.start_discharge_date,
    status: row.status,
  }
}

function mapRunningReportRow(row) {
  return {
    vesselId: row.vessel_id,
    vesselName: row.vessel_name,
    destination: row.destination,
    hatchCargoId: row.hatch_cargo_id,
    hatchNo: row.hatch_no,
    hatch: row.hatch_label,
    finalStowage: safeNumber(row.initial_cargo),
    totalDischarge: safeNumber(row.total_discharge),
    remainingOnBoard: safeNumber(row.remaining_cargo),
    progressPercentage: safeNumber(row.progress_percentage),
    totalTruck: safeNumber(row.total_dt),
    averageLoad: safeNumber(row.average_tonnage),
  }
}

function mapLatestEntry(row) {
  const hatchCargo = row.hatch_cargo || {}
  const vessel = row.vessels || {}

  return {
    id: row.id,
    vesselId: row.vessel_id,
    hatch: hatchCargo.hatch_label || `H${hatchCargo.hatch_no || ''}`,
    tonnage: safeNumber(row.tonnage),
    gateOutDate: row.gate_out_date,
    gateOutTime: row.gate_out_time ? String(row.gate_out_time).slice(0, 5) : '',
    vesselName: vessel.vessel_name || '-',
  }
}

export function buildSummary(rows) {
  const totalCargo = rows.reduce((total, row) => total + safeNumber(row.finalStowage), 0)
  const totalDischarge = rows.reduce((total, row) => total + safeNumber(row.totalDischarge), 0)
  const totalRemaining = rows.reduce((total, row) => total + safeNumber(row.remainingOnBoard), 0)
  const totalTruck = rows.reduce((total, row) => total + safeNumber(row.totalTruck), 0)
  const overallProgress = totalCargo > 0 ? Math.min((totalDischarge / totalCargo) * 100, 100) : 0
  const averageLoadPerTruck = totalTruck > 0 ? totalDischarge / totalTruck : 0
  const estimatedTruckRequirement =
    averageLoadPerTruck > 0 ? Math.ceil(totalRemaining / averageLoadPerTruck) : 0

  return {
    totalCargo,
    totalDischarge,
    totalRemaining,
    overallProgress,
    totalTruck,
    averageLoadPerTruck,
    estimatedTruckRequirement,
  }
}

export function buildVesselReports(vessels, runningRows) {
  return vessels.map((vessel) => {
    const rows = runningRows.filter((row) => row.vesselId === vessel.id)
    return {
      ...vessel,
      ...buildSummary(rows),
      hatchRows: rows,
    }
  })
}

function mapTimedReportRow(row) {
  return {
    vesselId: row.vessel_id,
    vesselName: row.vessel_name,
    destination: row.destination,
    gateOutDate: row.gate_out_date,
    shiftName: row.shift_name,
    periodStartHour: row.period_start_hour,
    periodEndHour: row.period_end_hour,
    hatchCargoId: row.hatch_cargo_id,
    hatchNo: row.hatch_no,
    hatch: row.hatch_label,
    totalDischarge: safeNumber(row.total_discharge),
    totalTruck: safeNumber(row.total_dt),
    averageTonnage: safeNumber(row.average_tonnage),
  }
}

function mapHatchCargoRow(row) {
  return {
    hatchCargoId: row.id,
    vesselId: row.vessel_id,
    hatchNo: row.hatch_no,
    hatch: row.hatch_label || `H${row.hatch_no}`,
    initialCargo: safeNumber(row.initial_cargo),
  }
}

function getTimeMinutes(value) {
  if (!value) return null
  const [hour, minute] = String(value).slice(0, 5).split(':').map(Number)

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null
  }

  return hour * 60 + minute
}

function isEntryIncludedAfterPeriod(entry, reportDate, periodEndHour) {
  if (!entry.gate_out_date || !entry.gate_out_time) return false
  if (entry.gate_out_date < reportDate) return true
  if (entry.gate_out_date > reportDate) return false

  const minutes = getTimeMinutes(entry.gate_out_time)
  if (minutes === null) return false

  return minutes < Number(periodEndHour) * 60
}

function buildPeriodRowsWithAllHatches(hatchRows, periodRows) {
  const periodByHatchId = Object.fromEntries(periodRows.map((row) => [row.hatchCargoId, row]))

  return hatchRows.map((hatch) => {
    const periodRow = periodByHatchId[hatch.hatchCargoId]
    const totalDischarge = safeNumber(periodRow?.totalDischarge)
    const totalTruck = safeNumber(periodRow?.totalTruck)

    return {
      vesselId: hatch.vesselId,
      vesselName: periodRow?.vesselName || '',
      destination: periodRow?.destination || '',
      gateOutDate: periodRow?.gateOutDate || '',
      periodStartHour: periodRow?.periodStartHour ?? null,
      periodEndHour: periodRow?.periodEndHour ?? null,
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
  const remainingCargo = Math.max(totalCargo - totalDischarge, 0)
  const progressPercentage = totalCargo > 0 ? Math.min((totalDischarge / totalCargo) * 100, 100) : 0
  const averageLoad = totalTruck > 0 ? totalDischarge / totalTruck : 0

  return {
    totalCargo,
    totalDischarge,
    totalTruck,
    remainingCargo,
    progressPercentage,
    averageLoad,
  }
}

export function buildTimedReportSummary(rows) {
  const totalDischarge = rows.reduce((total, row) => total + safeNumber(row.totalDischarge), 0)
  const totalTruck = rows.reduce((total, row) => total + safeNumber(row.totalTruck), 0)
  const averageTonnage = totalTruck > 0 ? totalDischarge / totalTruck : 0

  return {
    totalDischarge,
    totalTruck,
    averageTonnage,
  }
}

export function buildDestinationSummaryTotal(rows) {
  const totalDischarge = rows.reduce((total, row) => total + safeNumber(row.totalDischarge), 0)
  const totalDt = rows.reduce((total, row) => total + safeNumber(row.totalDt), 0)

  return {
    destinationId: 'total',
    destination: 'TOTAL',
    totalDischarge,
    totalDt,
    averageTonnage: totalDt > 0 ? totalDischarge / totalDt : 0,
  }
}

export async function getActiveVesselsForReports(currentUser) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  if (currentUser?.role === 'checker') {
    const { data, error } = await supabase
      .from('checker_assignments')
      .select(
        `
          vessel_id,
          vessels (
            id,
            vessel_name,
            cargo_owner,
            cargo_type,
            destination_id,
            total_hatch,
            eta,
            start_discharge_date,
            status,
            destinations (
              id,
              name
            )
          )
        `,
      )
      .eq('checker_id', currentUser.authUserId || currentUser.id)
      .eq('is_active', true)

    return {
      data: (data || [])
        .filter((row) => row.vessels && row.vessels.status !== 'completed')
        .map((row) => mapVessel(row.vessels)),
      error,
    }
  }

  const { data, error } = await supabase
    .from('vessels')
    .select(
      `
        id,
        vessel_name,
        cargo_owner,
        cargo_type,
        destination_id,
        total_hatch,
        eta,
        start_discharge_date,
        status,
        destinations (
          id,
          name
        )
      `,
    )
    .neq('status', 'completed')
    .order('start_discharge_date', { ascending: false })

  return {
    data: (data || []).map(mapVessel),
    error,
  }
}

export async function getRunningDestinationSummary(vesselId) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  if (!vesselId) {
    return {
      data: [],
      error: null,
    }
  }

  const [entriesResult, destinationsResult] = await Promise.all([
    supabase
      .from('discharge_entries')
      .select(
        `
          id,
          destination_id,
          tonnage,
          vessels (
            destination_id
          )
        `,
      )
      .eq('vessel_id', vesselId),
    supabase
      .from('destinations')
      .select('id, name'),
  ])

  if (entriesResult.error || destinationsResult.error) {
    return {
      data: [],
      error: entriesResult.error || destinationsResult.error,
    }
  }

  const destinationMap = Object.fromEntries(
    (destinationsResult.data || []).map((destination) => [destination.id, destination.name]),
  )
  const groupedRows = (entriesResult.data || []).reduce((result, entry) => {
    const destinationId = entry.destination_id || entry.vessels?.destination_id || 'unknown'
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

  return {
    data: Object.values(groupedRows).sort((a, b) => a.destination.localeCompare(b.destination)),
    error: null,
  }
}

export async function getRunningReportRows(vesselIds) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  if (vesselIds.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await supabase
    .from('running_report')
    .select(
      'vessel_id, vessel_name, destination, hatch_cargo_id, hatch_no, hatch_label, initial_cargo, total_discharge, total_dt, average_tonnage, remaining_cargo, progress_percentage',
    )
    .in('vessel_id', vesselIds)
    .order('hatch_no', { ascending: true })

  return {
    data: (data || []).map(mapRunningReportRow),
    error,
  }
}

export async function getLatestDischargeEntries(vesselIds) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  if (vesselIds.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await supabase
    .from('discharge_entries')
    .select(
      `
        id,
        vessel_id,
        hatch_cargo_id,
        tonnage,
        gate_out_date,
        gate_out_time,
        gate_out_at,
        hatch_cargo (
          id,
          hatch_no,
          hatch_label
        ),
        vessels (
          id,
          vessel_name
        )
      `,
    )
    .in('vessel_id', vesselIds)
    .order('gate_out_at', { ascending: false })
    .limit(50)

  return {
    data: (data || []).map(mapLatestEntry),
    error,
  }
}

export async function getReportDataset(currentUser) {
  const vesselsResult = await getActiveVesselsForReports(currentUser)

  if (vesselsResult.error) {
    return {
      vessels: [],
      runningRows: [],
      latestEntries: [],
      error: vesselsResult.error,
    }
  }

  const vesselIds = vesselsResult.data.map((vessel) => vessel.id)
  const [runningResult, latestEntriesResult] = await Promise.all([
    getRunningReportRows(vesselIds),
    getLatestDischargeEntries(vesselIds),
  ])

  return {
    vessels: vesselsResult.data,
    runningRows: runningResult.data,
    latestEntries: latestEntriesResult.data,
    error: runningResult.error || latestEntriesResult.error,
  }
}

export async function getShiftReportRows({ vesselId, reportDate, shiftName }) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  if (!vesselId || !reportDate || !shiftName) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await supabase
    .from('shift_report')
    .select(
      'vessel_id, vessel_name, destination, gate_out_date, shift_name, hatch_cargo_id, hatch_no, hatch_label, total_discharge, total_dt, average_tonnage',
    )
    .eq('vessel_id', vesselId)
    .eq('gate_out_date', reportDate)
    .eq('shift_name', shiftName)
    .order('hatch_no', { ascending: true })

  return {
    data: (data || []).map(mapTimedReportRow),
    error,
  }
}

export async function getPeriodTwoHourReportRows({
  vesselId,
  reportDate,
  periodStartHour,
  periodEndHour,
}) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  if (!vesselId || !reportDate || periodStartHour === '' || periodEndHour === '') {
    return {
      data: [],
      runningPosition: buildRunningPositionAfterPeriod([], []),
      error: null,
    }
  }

  const [periodResult, hatchResult, entriesResult] = await Promise.all([
    supabase
    .from('period_2_hour_report')
    .select(
      'vessel_id, vessel_name, destination, gate_out_date, period_start_hour, period_end_hour, hatch_cargo_id, hatch_no, hatch_label, total_discharge, total_dt, average_tonnage',
    )
    .eq('vessel_id', vesselId)
    .eq('gate_out_date', reportDate)
    .eq('period_start_hour', Number(periodStartHour))
    .eq('period_end_hour', Number(periodEndHour))
      .order('hatch_no', { ascending: true }),
    supabase
      .from('hatch_cargo')
      .select('id, vessel_id, hatch_no, hatch_label, initial_cargo')
      .eq('vessel_id', vesselId)
      .order('hatch_no', { ascending: true }),
    supabase
      .from('discharge_entries')
      .select('id, tonnage, gate_out_date, gate_out_time')
      .eq('vessel_id', vesselId)
      .lte('gate_out_date', reportDate),
  ])

  const hatchRows = (hatchResult.data || []).map(mapHatchCargoRow)
  const periodRows = (periodResult.data || []).map(mapTimedReportRow)
  const runningEntries = (entriesResult.data || []).filter((entry) =>
    isEntryIncludedAfterPeriod(entry, reportDate, periodEndHour),
  )

  return {
    data: buildPeriodRowsWithAllHatches(hatchRows, periodRows),
    runningPosition: buildRunningPositionAfterPeriod(hatchRows, runningEntries),
    error: periodResult.error || hatchResult.error || entriesResult.error,
  }
}
