import { createHttpError } from '../../utils/httpError.js'
import {
  createDischargeEntry,
  listAssignedVesselsForChecker,
  listDischargeEntries,
  updateDischargeEntry,
} from './discharge.repository.js'
import { mapAssignedVessel, mapDischargeEntry } from './discharge.mapper.js'

function normalizeEntryPayload(payload = {}) {
  const destinationId = payload.destinationId ?? payload.destination_id ?? null
  const barcodePhotoUrl = payload.barcodePhotoUrl ?? payload.barcode_photo_url ?? null

  return {
    barcode_photo_url: barcodePhotoUrl || null,
    checker_id: payload.checkerId || payload.checker_id,
    delivery_order_number: String(payload.deliveryOrderNumber || payload.delivery_order_number || '').trim(),
    destination_id: destinationId || null,
    gate_in_at: payload.gateInAt ?? payload.gate_in_at ?? null,
    gate_in_date: payload.gateInDate ?? payload.gate_in_date ?? null,
    gate_in_time: payload.gateInTime ?? payload.gate_in_time ?? null,
    gate_out_at: payload.gateOutAt ?? payload.gate_out_at ?? null,
    gate_out_date: payload.gateOutDate ?? payload.gate_out_date ?? null,
    gate_out_time: payload.gateOutTime ?? payload.gate_out_time ?? null,
    hatch_cargo_id: payload.hatchCargoId || payload.hatch_cargo_id,
    notes: payload.notes ? String(payload.notes).trim() : null,
    plate_number: String(payload.plateNumber || payload.plate_number || '').trim().toUpperCase(),
    scale_ticket_number: String(payload.scaleTicketNumber || payload.scale_ticket_number || '').trim(),
    tonnage: Number(payload.tonnage || 0),
    vessel_id: payload.vesselId || payload.vessel_id,
  }
}

function assertCheckerCanAccess(req, checkerId) {
  if (req.auth?.user?.role !== 'checker') return

  if (req.auth.user.id !== checkerId) {
    throw createHttpError(403, 'Checker hanya bisa mengakses data miliknya sendiri.')
  }
}

function validateEntryPayload(payload) {
  if (!payload.vessel_id) throw createHttpError(400, 'Vessel wajib dipilih.')
  if (!payload.hatch_cargo_id) throw createHttpError(400, 'Hatch wajib dipilih.')
  if (!payload.checker_id) throw createHttpError(400, 'Checker wajib diisi.')
  if (!payload.plate_number) throw createHttpError(400, 'Nomor polisi wajib diisi.')
  if (!payload.tonnage || payload.tonnage <= 0) throw createHttpError(400, 'Tonnage wajib lebih dari 0.')
  if (!payload.delivery_order_number) throw createHttpError(400, 'No Surat Jalan wajib diisi.')
  if (!payload.scale_ticket_number) throw createHttpError(400, 'No SJ Timbangan wajib diisi.')
}

function getEntryOptions(req, extra = {}) {
  return {
    destinationId: req.query.destinationId || req.query.destination_id,
    gateOutDate: req.query.gateOutDate || req.query.gate_out_date,
    hatchCargoId: req.query.hatchCargoId || req.query.hatch_cargo_id,
    page: req.query.page,
    pageSize: req.query.pageSize || req.query.page_size,
    searchTerm: req.query.searchTerm || req.query.search,
    ...extra,
  }
}

export async function getAssignedVesselsForChecker(req, res, next) {
  try {
    assertCheckerCanAccess(req, req.params.checkerId)

    const rows = await listAssignedVesselsForChecker(req.params.checkerId)

    res.json({
      data: rows.map(mapAssignedVessel),
    })
  } catch (error) {
    next(error)
  }
}

export async function getDischargeEntriesForChecker(req, res, next) {
  try {
    assertCheckerCanAccess(req, req.params.checkerId)

    const result = await listDischargeEntries(
      getEntryOptions(req, {
        checkerId: req.params.checkerId,
        vesselId: req.query.vesselId || req.query.vessel_id,
      }),
    )

    res.json({
      count: result.count,
      data: result.rows.map(mapDischargeEntry),
    })
  } catch (error) {
    next(error)
  }
}

export async function getDischargeEntriesForVessel(req, res, next) {
  try {
    const result = await listDischargeEntries(
      getEntryOptions(req, {
        vesselId: req.params.vesselId,
      }),
    )

    res.json({
      count: result.count,
      data: result.rows.map(mapDischargeEntry),
    })
  } catch (error) {
    next(error)
  }
}

export async function createDischargeEntryRecord(req, res, next) {
  try {
    const payload = normalizeEntryPayload(req.body)
    validateEntryPayload(payload)
    assertCheckerCanAccess(req, payload.checker_id)

    const entry = await createDischargeEntry(payload)

    res.status(201).json({
      data: mapDischargeEntry(entry),
    })
  } catch (error) {
    next(error)
  }
}

export async function updateDischargeEntryRecord(req, res, next) {
  try {
    const payload = normalizeEntryPayload(req.body)
    validateEntryPayload(payload)
    assertCheckerCanAccess(req, payload.checker_id)

    const entry = await updateDischargeEntry(req.params.entryId, payload)
    if (!entry) throw createHttpError(404, 'Input discharge tidak ditemukan.')

    res.json({
      data: mapDischargeEntry(entry),
    })
  } catch (error) {
    next(error)
  }
}
