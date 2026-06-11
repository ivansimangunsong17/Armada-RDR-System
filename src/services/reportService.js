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
      error: null,
    }
  }

  const { data, error } = await supabase
    .from('period_2_hour_report')
    .select(
      'vessel_id, vessel_name, destination, gate_out_date, period_start_hour, period_end_hour, hatch_cargo_id, hatch_no, hatch_label, total_discharge, total_dt, average_tonnage',
    )
    .eq('vessel_id', vesselId)
    .eq('gate_out_date', reportDate)
    .eq('period_start_hour', Number(periodStartHour))
    .eq('period_end_hour', Number(periodEndHour))
    .order('hatch_no', { ascending: true })

  return {
    data: (data || []).map(mapTimedReportRow),
    error,
  }
}
