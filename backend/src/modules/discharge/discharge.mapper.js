function toTime(value) {
  return value ? String(value).slice(0, 5) : ''
}

export function mapDischargeEntry(row = {}) {
  return {
    id: row.id,
    vesselId: row.vessel_id,
    hatchCargoId: row.hatch_cargo_id,
    destinationId: row.destination_id || row.vessel_destination_id || '',
    checkerId: row.checker_id,
    checkerName: row.checker_name || '-',
    plateNumber: row.plate_number,
    hatch: row.hatch_label || `H${row.hatch_no || ''}`,
    hatchNo: row.hatch_no,
    tonnage: Number(row.tonnage) || 0,
    totalNetto: Number(row.tonnage) || 0,
    deliveryOrderNumber: row.delivery_order_number,
    scaleTicketNumber: row.scale_ticket_number,
    destination: row.entry_destination_name || row.vessel_destination_name || '-',
    company: row.cargo_owner || '-',
    vesselName: row.vessel_name || '-',
    cargo: row.cargo_type || '-',
    gateInDate: row.gate_in_date,
    gateInTime: toTime(row.gate_in_time),
    gateInAt: row.gate_in_at,
    gateOutDate: row.gate_out_date,
    gateOutTime: toTime(row.gate_out_time),
    gateOutAt: row.gate_out_at,
    barcodePhotoUrl: row.barcode_photo_url || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapAssignedVessel(row = {}) {
  return {
    assignmentId: row.assignment_id,
    id: row.id,
    vesselName: row.vessel_name,
    company: row.cargo_owner,
    cargo: row.cargo_type,
    destinationId: row.destination_id,
    destination: row.destination_name || '-',
    destinations: row.vessel_destinations || [],
    totalHatch: row.total_hatch,
    eta: row.eta,
    startDate: row.start_discharge_date,
    status: row.status,
    hatchCargoRows: row.hatch_cargo_rows || [],
  }
}
