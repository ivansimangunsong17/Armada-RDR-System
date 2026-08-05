import { apiClient } from './apiClient.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i

function isUuid(value) {
  return UUID_PATTERN.test(String(value || '').trim())
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

function mapVesselDestination(row) {
  const destination = row.destinations || {}

  return {
    vesselDestinationId: row.vesselDestinationId || row.id,
    vesselId: row.vesselId || row.vessel_id,
    destinationId: row.destinationId || row.destination_id,
    name: row.name || destination.name || '-',
    isActive: Boolean(row.isActive ?? row.is_active),
  }
}

export function mapVesselDestinations(rows = []) {
  return rows.map(mapVesselDestination)
}

function mapVessel(row = {}) {
  return {
    ...row,
    destinations: mapVesselDestinations(row.destinations || row.vessel_destinations || []),
  }
}

export async function getDestinations() {
  const { data, error } = await apiClient.request('/destinations')

  return {
    data: data?.data || [],
    error,
  }
}

export async function getVessels() {
  const { data, error } = await apiClient.request('/vessels')

  return {
    data: (data?.data || []).map(mapVessel),
    error,
  }
}

export async function getVesselById(vesselId) {
  if (!vesselId) {
    return {
      data: null,
      error: null,
    }
  }

  const { data, error } = await apiClient.request(`/vessels/${vesselId}`)

  return {
    data: data?.data ? mapVessel(data.data) : null,
    error,
  }
}

export async function getCheckerProfiles() {
  const { data, error } = await apiClient.request('/users?role=checker&isActive=true')

  return {
    data: data?.users || [],
    error,
  }
}

export async function createDestination(destination) {
  const { data, error } = await apiClient.request('/destinations', {
    body: JSON.stringify(destination),
    method: 'POST',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function updateDestination(destinationId, destination) {
  const { data, error } = await apiClient.request(`/destinations/${destinationId}`, {
    body: JSON.stringify(destination),
    method: 'PUT',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function changeDestinationStatus(destinationId, isActive) {
  const { data, error } = await apiClient.request(`/destinations/${destinationId}/status`, {
    body: JSON.stringify({ isActive }),
    method: 'PATCH',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function getDestinationByName(name) {
  const { data, error } = await apiClient.request(
    `/destinations/by-name/${encodeURIComponent(name.trim())}`,
  )

  return {
    data: data?.data || null,
    error,
  }
}

export async function getDestinationById(destinationId) {
  if (!destinationId) {
    return {
      data: null,
      error: null,
    }
  }

  const { data, error } = await apiClient.request(`/destinations/${destinationId}`)

  return {
    data: data?.data || null,
    error,
  }
}

export async function getOrCreateDestinationByName(name) {
  const cleanName = name.trim()

  if (isUuid(cleanName)) {
    return getDestinationById(cleanName)
  }

  const { data, error } = await apiClient.request('/destinations/resolve', {
    body: JSON.stringify({
      description: null,
      is_active: true,
      name: cleanName,
    }),
    method: 'POST',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function getVesselDestinations(vesselId) {
  if (!vesselId) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(`/vessels/${vesselId}/destinations`)

  return {
    data: mapVesselDestinations(data?.data || []),
    error,
  }
}

export async function getActiveVesselDestinations(vesselId) {
  if (!vesselId) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/vessels/${vesselId}/destinations${buildQuery({ isActive: true })}`,
  )

  return {
    data: mapVesselDestinations(data?.data || []),
    error,
  }
}

export async function addDestinationToVessel(vesselId, destinationNameOrId, createdBy = null) {
  if (!vesselId) {
    return {
      data: null,
      error: new Error('Vessel wajib dipilih.'),
    }
  }

  const { data, error } = await apiClient.request(`/vessels/${vesselId}/destinations`, {
    body: JSON.stringify({
      createdBy,
      destinationId: destinationNameOrId,
    }),
    method: 'POST',
  })

  return {
    data: data?.data ? mapVesselDestination(data.data) : null,
    error,
  }
}

export async function deactivateVesselDestination(vesselId, destinationId) {
  if (!vesselId || !destinationId) {
    return {
      data: null,
      error: new Error('Vessel dan destination wajib dipilih.'),
    }
  }

  const { data, error } = await apiClient.request(
    `/vessels/${vesselId}/destinations/${destinationId}`,
    { method: 'DELETE' },
  )

  return {
    data: data?.data ? mapVesselDestination(data.data) : null,
    error,
  }
}

export async function getHatchCargoByVesselIds(vesselIds) {
  if (vesselIds.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/hatch-cargo${buildQuery({ vesselIds })}`,
  )

  return {
    data: data?.data || [],
    error,
  }
}

export async function getHatchCargoByVesselId(vesselId) {
  if (!vesselId) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(`/vessels/${vesselId}/hatch-cargo`)

  return {
    data: data?.data || [],
    error,
  }
}

export async function getCheckerAssignmentsByVesselIds(vesselIds) {
  if (vesselIds.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/checker-assignments${buildQuery({ vesselIds })}`,
  )

  return {
    data: data?.data || [],
    error,
  }
}

export async function getCheckerAssignmentByVesselId(vesselId) {
  if (!vesselId) {
    return {
      data: null,
      error: null,
    }
  }

  const { data, error } = await apiClient.request(`/vessels/${vesselId}/checker-assignment`)

  return {
    data: data?.data || null,
    error,
  }
}

export async function createVessel(vessel) {
  const { data, error } = await apiClient.request('/vessels', {
    body: JSON.stringify(vessel),
    method: 'POST',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function updateVessel(vesselId, vessel) {
  const { data, error } = await apiClient.request(`/vessels/${vesselId}`, {
    body: JSON.stringify(vessel),
    method: 'PUT',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function changeVesselStatus(vesselId, status) {
  const { data, error } = await apiClient.request(`/vessels/${vesselId}/status`, {
    body: JSON.stringify({ status }),
    method: 'PATCH',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function archiveVessel(vesselId) {
  const { data, error } = await apiClient.request(`/vessels/${vesselId}`, {
    method: 'DELETE',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function saveHatchCargo(vesselId, hatchCargoRows) {
  const { data, error } = await apiClient.request(`/vessels/${vesselId}/hatch-cargo`, {
    body: JSON.stringify({ rows: hatchCargoRows }),
    method: 'PUT',
  })

  return {
    data: data?.data || [],
    error,
  }
}

export async function deleteExtraHatchCargo(vesselId, totalHatch) {
  const { error } = await apiClient.request(
    `/vessels/${vesselId}/hatch-cargo/extra${buildQuery({ totalHatch })}`,
    { method: 'DELETE' },
  )

  return {
    error,
  }
}

export async function saveCheckerAssignment(vesselId, checkerId, assignedBy) {
  const { data, error } = await apiClient.request(`/vessels/${vesselId}/checker-assignment`, {
    body: JSON.stringify({
      assignedBy,
      checkerId,
    }),
    method: 'PUT',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export const vesselService = {
  addDestination: addDestinationToVessel,
  archive: archiveVessel,
  changeDestinationStatus,
  changeStatus: changeVesselStatus,
  create: createVessel,
  createDestination,
  deactivateDestination: deactivateVesselDestination,
  deleteExtraHatchCargo,
  getActiveDestinations: getActiveVesselDestinations,
  getAll: getVessels,
  getById: getVesselById,
  getCheckerAssignmentByVesselId,
  getCheckerAssignmentsByVesselIds,
  getCheckerProfiles,
  getDestinationById,
  getDestinationByName,
  getDestinations,
  getHatchCargoByVesselId,
  getHatchCargoByVesselIds,
  getOrCreateDestinationByName,
  getVesselDestinations,
  saveCheckerAssignment,
  saveHatchCargo,
  update: updateVessel,
  updateDestination,
}
