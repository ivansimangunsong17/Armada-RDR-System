import { createHttpError } from '../../utils/httpError.js'
import {
  createDestination,
  findDestinationById,
  findDestinationByName,
  listDestinations,
  updateDestination,
  updateDestinationStatus,
} from './destination.repository.js'

function normalizeDestinationPayload(payload = {}) {
  return {
    description: payload.description ? String(payload.description).trim() : null,
    isActive: payload.isActive ?? payload.is_active ?? true,
    name: String(payload.name || '').trim(),
  }
}

export async function getDestinations(req, res, next) {
  try {
    res.json({
      data: await listDestinations(),
    })
  } catch (error) {
    next(error)
  }
}

export async function getDestinationById(req, res, next) {
  try {
    res.json({
      data: await findDestinationById(req.params.destinationId),
    })
  } catch (error) {
    next(error)
  }
}

export async function getDestinationByName(req, res, next) {
  try {
    res.json({
      data: await findDestinationByName(req.params.name),
    })
  } catch (error) {
    next(error)
  }
}

export async function resolveDestination(req, res, next) {
  try {
    const payload = normalizeDestinationPayload(req.body)

    if (!payload.name) {
      throw createHttpError(400, 'Destination wajib diisi.')
    }

    const existing = await findDestinationByName(payload.name)

    if (existing) {
      if (existing.is_active) {
        res.json({ data: existing })
        return
      }

      res.json({
        data: await updateDestinationStatus(existing.id, true),
      })
      return
    }

    res.status(201).json({
      data: await createDestination(payload),
    })
  } catch (error) {
    next(error)
  }
}

export async function createDestinationRecord(req, res, next) {
  try {
    const payload = normalizeDestinationPayload(req.body)

    if (!payload.name) {
      throw createHttpError(400, 'Destination wajib diisi.')
    }

    res.status(201).json({
      data: await createDestination(payload),
    })
  } catch (error) {
    next(error)
  }
}

export async function updateDestinationRecord(req, res, next) {
  try {
    const payload = normalizeDestinationPayload(req.body)

    if (!payload.name) {
      throw createHttpError(400, 'Destination wajib diisi.')
    }

    const destination = await updateDestination(req.params.destinationId, payload)

    if (!destination) {
      throw createHttpError(404, 'Destination tidak ditemukan.')
    }

    res.json({
      data: destination,
    })
  } catch (error) {
    next(error)
  }
}

export async function changeDestinationStatus(req, res, next) {
  try {
    const destination = await updateDestinationStatus(
      req.params.destinationId,
      req.body?.isActive ?? req.body?.is_active,
    )

    if (!destination) {
      throw createHttpError(404, 'Destination tidak ditemukan.')
    }

    res.json({
      data: destination,
    })
  } catch (error) {
    next(error)
  }
}
