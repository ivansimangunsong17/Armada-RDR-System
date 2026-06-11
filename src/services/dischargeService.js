import { supabase } from '../lib/supabaseClient.js'

function getSupabaseRequiredError() {
  return new Error(
    'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

function getClientError(message) {
  return new Error(message)
}

function mapDischargeEntry(row) {
  const hatchCargo = row.hatch_cargo || {}
  const vessel = row.vessels || {}
  const destination = vessel.destinations || {}
  const checker = row.profiles || {}

  return {
    id: row.id,
    vesselId: row.vessel_id,
    hatchCargoId: row.hatch_cargo_id,
    checkerId: row.checker_id,
    checkerName: checker.full_name || '-',
    plateNumber: row.plate_number,
    hatch: hatchCargo.hatch_label || `H${hatchCargo.hatch_no || ''}`,
    hatchNo: hatchCargo.hatch_no,
    tonnage: Number(row.tonnage) || 0,
    totalNetto: Number(row.tonnage) || 0,
    deliveryOrderNumber: row.delivery_order_number,
    scaleTicketNumber: row.scale_ticket_number,
    destination: destination.name || '-',
    company: vessel.cargo_owner || '-',
    vesselName: vessel.vessel_name || '-',
    cargo: vessel.cargo_type || '-',
    gateInDate: row.gate_in_date,
    gateInTime: row.gate_in_time ? String(row.gate_in_time).slice(0, 5) : '',
    gateInAt: row.gate_in_at,
    gateOutDate: row.gate_out_date,
    gateOutTime: row.gate_out_time ? String(row.gate_out_time).slice(0, 5) : '',
    gateOutAt: row.gate_out_at,
    barcodePhotoUrl: row.barcode_photo_url || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAssignedVessel(row) {
  const vessel = row.vessels || {}
  const destination = vessel.destinations || {}
  const hatchCargoRows = vessel.hatch_cargo || []

  return {
    assignmentId: row.id,
    id: vessel.id,
    vesselName: vessel.vessel_name,
    company: vessel.cargo_owner,
    cargo: vessel.cargo_type,
    destinationId: vessel.destination_id,
    destination: destination.name || '-',
    totalHatch: vessel.total_hatch,
    eta: vessel.eta,
    startDate: vessel.start_discharge_date,
    status: vessel.status,
    hatchCargoRows: hatchCargoRows.map((hatch) => ({
      id: hatch.id,
      vesselId: hatch.vessel_id,
      hatchNo: hatch.hatch_no,
      hatchLabel: hatch.hatch_label || `H${hatch.hatch_no}`,
      initialCargo: Number(hatch.initial_cargo) || 0,
    })),
  }
}

export async function getAssignedVesselsForChecker(checkerId) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('checker_assignments')
    .select(
      `
        id,
        vessel_id,
        checker_id,
        is_active,
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
          ),
          hatch_cargo (
            id,
            vessel_id,
            hatch_no,
            hatch_label,
            initial_cargo
          )
        )
      `,
    )
    .eq('checker_id', checkerId)
    .eq('is_active', true)

  return {
    data: (data || [])
      .filter((row) => row.vessels && row.vessels.status !== 'completed')
      .map(mapAssignedVessel),
    error,
  }
}

export async function getDischargeEntriesForChecker(checkerId) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('discharge_entries')
    .select(
      `
        id,
        vessel_id,
        hatch_cargo_id,
        checker_id,
        plate_number,
        tonnage,
        delivery_order_number,
        scale_ticket_number,
        gate_in_at,
        gate_in_date,
        gate_in_time,
        gate_out_at,
        gate_out_date,
        gate_out_time,
        barcode_photo_url,
        notes,
        created_at,
        updated_at,
        hatch_cargo (
          id,
          hatch_no,
          hatch_label
        ),
        vessels (
          id,
          vessel_name,
          cargo_owner,
          cargo_type,
          destination_id,
          destinations (
            id,
            name
          )
        ),
        profiles (
          id,
          full_name
        )
      `,
    )
    .eq('checker_id', checkerId)
    .order('gate_out_at', { ascending: false })

  return {
    data: (data || []).map(mapDischargeEntry),
    error,
  }
}

export async function createDischargeEntry(payload) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('discharge_entries')
    .insert([payload])
    .select(
      `
        id,
        vessel_id,
        hatch_cargo_id,
        checker_id,
        plate_number,
        tonnage,
        delivery_order_number,
        scale_ticket_number,
        gate_in_at,
        gate_in_date,
        gate_in_time,
        gate_out_at,
        gate_out_date,
        gate_out_time,
        barcode_photo_url,
        notes,
        created_at,
        updated_at,
        hatch_cargo (
          id,
          hatch_no,
          hatch_label
        ),
        vessels (
          id,
          vessel_name,
          cargo_owner,
          cargo_type,
          destination_id,
          destinations (
            id,
            name
          )
        ),
        profiles (
          id,
          full_name
        )
      `,
    )
    .single()

  return {
    data: data ? mapDischargeEntry(data) : null,
    error,
  }
}

export async function updateDischargeEntry(entryId, payload) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('discharge_entries')
    .update(payload)
    .eq('id', entryId)
    .select(
      `
        id,
        vessel_id,
        hatch_cargo_id,
        checker_id,
        plate_number,
        tonnage,
        delivery_order_number,
        scale_ticket_number,
        gate_in_at,
        gate_in_date,
        gate_in_time,
        gate_out_at,
        gate_out_date,
        gate_out_time,
        barcode_photo_url,
        notes,
        created_at,
        updated_at,
        hatch_cargo (
          id,
          hatch_no,
          hatch_label
        ),
        vessels (
          id,
          vessel_name,
          cargo_owner,
          cargo_type,
          destination_id,
          destinations (
            id,
            name
          )
        ),
        profiles (
          id,
          full_name
        )
      `,
    )
    .single()

  return {
    data: data ? mapDischargeEntry(data) : null,
    error,
  }
}

export async function getDischargeEntriesForVessel(vesselId) {
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

  const { data, error } = await supabase
    .from('discharge_entries')
    .select(
      `
        id,
        vessel_id,
        hatch_cargo_id,
        checker_id,
        plate_number,
        tonnage,
        delivery_order_number,
        scale_ticket_number,
        gate_in_at,
        gate_in_date,
        gate_in_time,
        gate_out_at,
        gate_out_date,
        gate_out_time,
        barcode_photo_url,
        notes,
        created_at,
        updated_at,
        hatch_cargo (
          id,
          hatch_no,
          hatch_label
        ),
        vessels (
          id,
          vessel_name,
          cargo_owner,
          cargo_type,
          destination_id,
          destinations (
            id,
            name
          )
        ),
        profiles (
          id,
          full_name
        )
      `,
    )
    .eq('vessel_id', vesselId)
    .order('gate_out_at', { ascending: false })

  return {
    data: (data || []).map(mapDischargeEntry),
    error,
  }
}

export function getDischargeMutationError(error) {
  if (!error) return null

  if (error.code === '23505') {
    const message = error.message || ''

    if (message.includes('delivery_order_number')) {
      return getClientError('No Surat Jalan sudah digunakan untuk kapal ini.')
    }

    if (message.includes('scale_ticket_number')) {
      return getClientError('No SJ Timbangan sudah digunakan untuk kapal ini.')
    }

    return getClientError('Nomor dokumen sudah digunakan untuk kapal ini.')
  }

  return error
}
