import { supabase } from '../lib/supabaseClient.js'

function getSupabaseRequiredError() {
  return new Error(
    'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

export async function getDestinations() {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('destinations')
    .select('id, name, description, is_active')
    .order('name', { ascending: true })

  return {
    data: data || [],
    error,
  }
}

export async function getVessels() {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('vessels')
    .select(
      'id, vessel_name, cargo_owner, cargo_type, destination_id, total_hatch, eta, start_discharge_date, status, created_by',
    )
    .order('id', { ascending: true })

  return {
    data: data || [],
    error,
  }
}

export async function getCheckerProfiles() {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('role', 'checker')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  return {
    data: data || [],
    error,
  }
}

export async function createDestination(destination) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('destinations')
    .insert([destination])
    .select('id, name, description, is_active')
    .single()

  return {
    data,
    error,
  }
}

export async function updateDestination(destinationId, destination) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('destinations')
    .update(destination)
    .eq('id', destinationId)
    .select('id, name, description, is_active')
    .single()

  return {
    data,
    error,
  }
}

export async function changeDestinationStatus(destinationId, isActive) {
  return updateDestination(destinationId, { is_active: isActive })
}

export async function getDestinationByName(name) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('destinations')
    .select('id, name, description, is_active')
    .ilike('name', name.trim())
    .maybeSingle()

  return {
    data,
    error,
  }
}

export async function getOrCreateDestinationByName(name) {
  const cleanName = name.trim()
  const existingResult = await getDestinationByName(cleanName)

  if (existingResult.error) {
    return existingResult
  }

  if (existingResult.data) {
    if (!existingResult.data.is_active) {
      return updateDestination(existingResult.data.id, { is_active: true })
    }

    return existingResult
  }

  return createDestination({
    name: cleanName,
    description: null,
    is_active: true,
  })
}

export async function getHatchCargoByVesselIds(vesselIds) {
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
    .from('hatch_cargo')
    .select('id, vessel_id, hatch_no, hatch_label, initial_cargo')
    .in('vessel_id', vesselIds)
    .order('hatch_no', { ascending: true })

  return {
    data: data || [],
    error,
  }
}

export async function getCheckerAssignmentsByVesselIds(vesselIds) {
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
    .from('checker_assignments')
    .select('id, vessel_id, checker_id, is_active')
    .in('vessel_id', vesselIds)
    .eq('is_active', true)

  return {
    data: data || [],
    error,
  }
}

export async function createVessel(vessel) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('vessels')
    .insert([vessel])
    .select()
    .single()

  return {
    data,
    error,
  }
}

export async function updateVessel(vesselId, vessel) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('vessels')
    .update(vessel)
    .eq('id', vesselId)
    .select()
    .single()

  return {
    data,
    error,
  }
}

export async function changeVesselStatus(vesselId, status) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const { data, error } = await supabase
    .from('vessels')
    .update({ status })
    .eq('id', vesselId)
    .select()
    .single()

  return {
    data,
    error,
  }
}

export async function saveHatchCargo(vesselId, hatchCargoRows) {
  if (!supabase) {
    return {
      data: [],
      error: getSupabaseRequiredError(),
    }
  }

  const rows = hatchCargoRows.map((row) => ({
    vessel_id: vesselId,
    hatch_no: Number(row.hatchNo),
    initial_cargo: Number(row.initialCargo) || 0,
  }))

  const { data, error } = await supabase
    .from('hatch_cargo')
    .upsert(rows, { onConflict: 'vessel_id,hatch_no' })
    .select('id, vessel_id, hatch_no, hatch_label, initial_cargo')

  return {
    data: data || [],
    error,
  }
}

export async function deleteExtraHatchCargo(vesselId, totalHatch) {
  if (!supabase) {
    return {
      error: getSupabaseRequiredError(),
    }
  }

  const { error } = await supabase
    .from('hatch_cargo')
    .delete()
    .eq('vessel_id', vesselId)
    .gt('hatch_no', Number(totalHatch))

  return {
    error,
  }
}

export async function saveCheckerAssignment(vesselId, checkerId, assignedBy) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  const deactivateResult = await supabase
    .from('checker_assignments')
    .update({ is_active: false })
    .eq('vessel_id', vesselId)
    .eq('is_active', true)

  if (deactivateResult.error) {
    return {
      data: null,
      error: deactivateResult.error,
    }
  }

  const { data, error } = await supabase
    .from('checker_assignments')
    .upsert(
      [
        {
          vessel_id: vesselId,
          checker_id: checkerId,
          assigned_by: assignedBy,
          is_active: true,
        },
      ],
      { onConflict: 'vessel_id,checker_id' },
    )
    .select('id, vessel_id, checker_id, is_active')
    .single()

  return {
    data,
    error,
  }
}
