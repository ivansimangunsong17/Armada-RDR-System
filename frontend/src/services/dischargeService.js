import { apiClient } from './apiClient.js'

function getClientError(message) {
  return new Error(message)
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

function mapDischargeOptions(options = {}) {
  return {
    destinationId: options.destinationId,
    gateOutDate: options.gateOutDate,
    hatchCargoId: options.hatchCargoId,
    page: options.page,
    pageSize: options.pageSize,
    searchTerm: options.searchTerm,
    vesselId: options.vesselId,
  }
}

export async function getAssignedVesselsForChecker(checkerId) {
  const { data, error } = await apiClient.request(
    `/discharge/checker/${checkerId}/assigned-vessels`,
  )

  return {
    data: data?.data || [],
    error,
  }
}

export async function getDischargeEntriesForChecker(checkerId, options = {}) {
  const { data, error } = await apiClient.request(
    `/discharge/checker/${checkerId}/entries${buildQuery(mapDischargeOptions(options))}`,
  )

  return {
    data: data?.data || [],
    count: data?.count ?? 0,
    error,
  }
}

export async function createDischargeEntry(payload) {
  const { data, error } = await apiClient.request('/discharge/entries', {
    body: JSON.stringify(payload),
    method: 'POST',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function updateDischargeEntry(entryId, payload) {
  const { data, error } = await apiClient.request(`/discharge/entries/${entryId}`, {
    body: JSON.stringify(payload),
    method: 'PUT',
  })

  return {
    data: data?.data || null,
    error,
  }
}

export async function getDischargeEntriesForVessel(vesselId, options = {}) {
  if (!vesselId) {
    return {
      data: [],
      count: 0,
      error: null,
    }
  }

  const { data, error } = await apiClient.request(
    `/vessels/${vesselId}/discharge-entries${buildQuery(mapDischargeOptions(options))}`,
  )

  return {
    data: data?.data || [],
    count: data?.count ?? 0,
    error,
  }
}

export function getDischargeMutationError(error) {
  if (!error) return null

  if (error.code === '23505') {
    const message = `${error.message || ''} ${error.constraint || ''}`

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

export const dischargeService = {
  create: createDischargeEntry,
  getAssignedVesselsForChecker,
  getForChecker: getDischargeEntriesForChecker,
  getForVessel: getDischargeEntriesForVessel,
  getMutationError: getDischargeMutationError,
  update: updateDischargeEntry,
}
