import { createHttpError } from '../../utils/httpError.js'
import { findDestinationById, findDestinationByName } from '../destinations/destination.repository.js'
import {
  addDestinationToVessel,
  archiveVessel,
  createVessel,
  deactivateDestinationOnVessel,
  deleteExtraHatchCargo,
  findActiveCheckerAssignmentByVesselId,
  findVesselById,
  listHatchCargoByVesselId,
  listCheckerAssignmentsByVesselIds,
  listHatchCargoByVesselIds,
  listVesselDestinations,
  listVessels,
  saveCheckerAssignment,
  saveHatchCargo,
  updateVessel,
  updateVesselStatus,
} from './vessel.repository.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value) {
  return UUID_PATTERN.test(String(value || '').trim())
}

function normalizeVesselPayload(payload = {}) {
  return {
    cargoOwner: String(payload.cargoOwner || payload.cargo_owner || '').trim(),
    cargoType: String(payload.cargoType || payload.cargo_type || '').trim(),
    createdBy: payload.createdBy || payload.created_by || null,
    destinationId: payload.destinationId || payload.destination_id || '',
    eta: payload.eta || null,
    startDischargeDate: payload.startDischargeDate || payload.start_discharge_date || '',
    status: payload.status || 'pending',
    totalHatch: Number(payload.totalHatch || payload.total_hatch || 0),
    vesselName: String(payload.vesselName || payload.vessel_name || '').trim(),
  }
}

function validateVesselPayload(payload) {
  if (!payload.vesselName) throw createHttpError(400, 'Vessel name wajib diisi.')
  if (!payload.cargoOwner) throw createHttpError(400, 'Cargo owner wajib diisi.')
  if (!payload.cargoType) throw createHttpError(400, 'Cargo type wajib diisi.')
  if (!payload.destinationId) throw createHttpError(400, 'Destination wajib diisi.')
  if (!payload.totalHatch || payload.totalHatch <= 0) {
    throw createHttpError(400, 'Total hatch wajib lebih dari 0.')
  }
  if (!payload.startDischargeDate) {
    throw createHttpError(400, 'Start discharge date wajib diisi.')
  }
}

async function resolveDestinationId(destinationNameOrId) {
  const value = String(destinationNameOrId || '').trim()

  if (!value) {
    throw createHttpError(400, 'Destination wajib diisi.')
  }

  if (isUuid(value)) {
    const destination = await findDestinationById(value)
    if (!destination) throw createHttpError(404, 'Destination tidak ditemukan.')
    return destination.id
  }

  const destination = await findDestinationByName(value)
  if (!destination) throw createHttpError(404, 'Destination tidak ditemukan.')
  return destination.id
}

export async function getVessels(req, res, next) {
  try {
    res.json({
      data: await listVessels(),
    })
  } catch (error) {
    next(error)
  }
}

export async function getVesselById(req, res, next) {
  try {
    const vessel = await findVesselById(req.params.vesselId)
    if (!vessel) throw createHttpError(404, 'Vessel tidak ditemukan.')

    res.json({
      data: vessel,
    })
  } catch (error) {
    next(error)
  }
}

export async function createVesselRecord(req, res, next) {
  try {
    const payload = normalizeVesselPayload(req.body)
    validateVesselPayload(payload)

    res.status(201).json({
      data: await createVessel(payload),
    })
  } catch (error) {
    next(error)
  }
}

export async function updateVesselRecord(req, res, next) {
  try {
    const payload = normalizeVesselPayload(req.body)
    validateVesselPayload(payload)

    const vessel = await updateVessel(req.params.vesselId, payload)
    if (!vessel) throw createHttpError(404, 'Vessel tidak ditemukan.')

    res.json({
      data: vessel,
    })
  } catch (error) {
    next(error)
  }
}

export async function changeVesselStatus(req, res, next) {
  try {
    const vessel = await updateVesselStatus(req.params.vesselId, req.body?.status)
    if (!vessel) throw createHttpError(404, 'Vessel tidak ditemukan.')

    res.json({
      data: vessel,
    })
  } catch (error) {
    next(error)
  }
}

export async function archiveVesselRecord(req, res, next) {
  try {
    const vessel = await archiveVessel(req.params.vesselId)
    if (!vessel) throw createHttpError(404, 'Vessel tidak ditemukan atau sudah diarchive.')

    res.json({
      data: vessel,
    })
  } catch (error) {
    next(error)
  }
}

export async function getVesselDestinations(req, res, next) {
  try {
    const isActive = req.query.isActive === undefined
      ? null
      : ['1', 'true', 'yes'].includes(String(req.query.isActive).toLowerCase())

    res.json({
      data: await listVesselDestinations(req.params.vesselId, isActive),
    })
  } catch (error) {
    next(error)
  }
}

export async function addVesselDestination(req, res, next) {
  try {
    const destinationId = await resolveDestinationId(req.body?.destinationId || req.body?.destination_id || req.body?.destination)

    await addDestinationToVessel({
      createdBy: req.body?.createdBy || req.body?.created_by || req.auth?.user?.id || null,
      destinationId,
      vesselId: req.params.vesselId,
    })

    const rows = await listVesselDestinations(req.params.vesselId)
    const row = rows.find((item) => item.destination_id === destinationId)

    res.json({
      data: row || null,
    })
  } catch (error) {
    next(error)
  }
}

export async function deactivateVesselDestination(req, res, next) {
  try {
    const destination = await deactivateDestinationOnVessel({
      destinationId: req.params.destinationId,
      vesselId: req.params.vesselId,
    })

    if (!destination) {
      throw createHttpError(404, 'Destination vessel tidak ditemukan.')
    }

    const rows = await listVesselDestinations(req.params.vesselId)
    const row = rows.find((item) => item.destination_id === req.params.destinationId)

    res.json({
      data: row || null,
    })
  } catch (error) {
    next(error)
  }
}

export async function getHatchCargo(req, res, next) {
  try {
    const vesselIds = String(req.query.vesselIds || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    res.json({
      data: await listHatchCargoByVesselIds(vesselIds),
    })
  } catch (error) {
    next(error)
  }
}

export async function saveVesselHatchCargo(req, res, next) {
  try {
    const rows = (req.body?.rows || req.body?.hatchCargoRows || []).map((row) => ({
      hatchNo: Number(row.hatchNo || row.hatch_no),
      initialCargo: Number(row.initialCargo || row.initial_cargo || 0),
    }))

    if (rows.some((row) => !row.hatchNo || row.hatchNo <= 0 || row.initialCargo < 0)) {
      throw createHttpError(400, 'Data hatch cargo tidak valid.')
    }

    res.json({
      data: await saveHatchCargo(req.params.vesselId, rows),
    })
  } catch (error) {
    next(error)
  }
}

export async function getVesselHatchCargo(req, res, next) {
  try {
    res.json({
      data: await listHatchCargoByVesselId(req.params.vesselId),
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteExtraVesselHatchCargo(req, res, next) {
  try {
    const totalHatch = Number(req.query.totalHatch || req.body?.totalHatch || 0)

    if (!totalHatch || totalHatch <= 0) {
      throw createHttpError(400, 'Total hatch wajib lebih dari 0.')
    }

    await deleteExtraHatchCargo(req.params.vesselId, totalHatch)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function getVesselCheckerAssignment(req, res, next) {
  try {
    res.json({
      data: await findActiveCheckerAssignmentByVesselId(req.params.vesselId),
    })
  } catch (error) {
    next(error)
  }
}

export async function getCheckerAssignments(req, res, next) {
  try {
    const vesselIds = String(req.query.vesselIds || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    res.json({
      data: await listCheckerAssignmentsByVesselIds(vesselIds),
    })
  } catch (error) {
    next(error)
  }
}

export async function saveVesselCheckerAssignment(req, res, next) {
  try {
    const checkerId = req.body?.checkerId || req.body?.checker_id
    if (!checkerId) throw createHttpError(400, 'Checker wajib dipilih.')

    res.json({
      data: await saveCheckerAssignment({
        assignedBy: req.body?.assignedBy || req.body?.assigned_by || req.auth?.user?.id || null,
        checkerId,
        vesselId: req.params.vesselId,
      }),
    })
  } catch (error) {
    next(error)
  }
}
