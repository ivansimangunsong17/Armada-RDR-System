import {
  getTruckDurationMinutes,
  normalizeDateFields,
  safeNumber,
  toTime,
} from './report.utils.js'

export function mapVessel(row = {}) {
  const destinationRows = (row.vessel_destinations || []).map((item) => ({
    destinationId: item.destinationId || item.destination_id,
    name: item.name || item.destinations?.name || '-',
    isActive: item.isActive ?? item.is_active !== false,
  }))
  const activeDestinationRows = destinationRows.filter((item) => item.isActive)
  const destinationLabel = activeDestinationRows.length > 0
    ? activeDestinationRows.map((item) => item.name).filter(Boolean).join(', ')
    : row.destination_name || '-'

  return {
    id: row.id,
    vesselName: row.vessel_name,
    company: row.cargo_owner,
    cargo: row.cargo_type,
    destinationId: row.destination_id,
    destination: destinationLabel,
    destinations: destinationRows,
    totalHatch: row.total_hatch,
    eta: row.eta,
    startDate: row.start_discharge_date,
    status: row.status,
    deletedAt: row.deleted_at || '',
  }
}

export function mapRunningReportRow(row = {}) {
  const finalStowage = safeNumber(row.initial_cargo)
  const totalDischarge = safeNumber(row.total_discharge)

  return {
    vesselId: row.vessel_id,
    vesselName: row.vessel_name,
    destination: row.destination,
    hatchCargoId: row.hatch_cargo_id,
    hatchNo: row.hatch_no,
    hatch: row.hatch_label,
    finalStowage,
    totalDischarge,
    remainingOnBoard: finalStowage - totalDischarge,
    progressPercentage: finalStowage > 0 ? (totalDischarge / finalStowage) * 100 : 0,
    totalTruck: safeNumber(row.total_dt),
    averageLoad: safeNumber(row.average_tonnage),
  }
}

export function mapLatestEntry(row = {}) {
  return {
    id: row.id,
    vesselId: row.vessel_id,
    hatch: row.hatch_label || `H${row.hatch_no || ''}`,
    tonnage: safeNumber(row.tonnage),
    gateOutDate: row.gate_out_date,
    gateOutTime: toTime(row.gate_out_time),
    vesselName: row.vessel_name || '-',
  }
}

export function mapTimedReportRow(row = {}) {
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

export function mapHatchCargoRow(row = {}) {
  return {
    hatchCargoId: row.id,
    vesselId: row.vessel_id,
    hatchNo: row.hatch_no,
    hatch: row.hatch_label || `H${row.hatch_no}`,
    initialCargo: safeNumber(row.initial_cargo),
  }
}

export function mapTruckDurationRow(rawRow = {}) {
  const row = normalizeDateFields(rawRow)
  const durationMinutes = getTruckDurationMinutes(row)

  return {
    id: row.id,
    vesselId: row.vessel_id,
    vesselName: row.vessel_name || '-',
    destination: row.entry_destination_name || row.vessel_destination_name || '-',
    checkerName: row.checker_name || '-',
    plateNumber: row.plate_number || '-',
    hatch: row.hatch_label || `H${row.hatch_no || ''}`,
    tonnage: safeNumber(row.tonnage),
    deliveryOrderNumber: row.delivery_order_number || '-',
    scaleTicketNumber: row.scale_ticket_number || '-',
    gateInDate: row.gate_in_date,
    gateInTime: toTime(row.gate_in_time),
    gateInAt: row.gate_in_at,
    gateOutDate: row.gate_out_date,
    gateOutTime: toTime(row.gate_out_time),
    gateOutAt: row.gate_out_at,
    durationMinutes,
    isDurationComplete: durationMinutes !== null,
    notes: row.notes || '',
  }
}
