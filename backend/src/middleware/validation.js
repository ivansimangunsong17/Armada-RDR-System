import { createHttpError } from '../utils/httpError.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function getBodyValue(body, names) {
  return names.map((name) => body?.[name]).find((value) => value !== undefined)
}

function addRequiredStringError(errors, body, names, label) {
  const value = getBodyValue(body, names)
  if (!hasValue(value)) errors.push(`${label} wajib diisi.`)
}

function addPositiveNumberError(errors, body, names, label) {
  const value = Number(getBodyValue(body, names))
  if (!Number.isFinite(value) || value <= 0) errors.push(`${label} wajib lebih dari 0.`)
}

function addEnumError(errors, body, names, allowedValues, label) {
  const value = getBodyValue(body, names)
  if (!hasValue(value)) {
    errors.push(`${label} wajib diisi.`)
    return
  }

  if (!allowedValues.includes(String(value))) {
    errors.push(`${label} tidak valid.`)
  }
}

export function validateUuidParam(paramName) {
  return function validateUuidParamMiddleware(req, res, next) {
    const value = req.params[paramName]
    if (!UUID_PATTERN.test(String(value || '').trim())) {
      next(createHttpError(400, `${paramName} tidak valid.`))
      return
    }

    next()
  }
}

export function validateLoginBody(req, res, next) {
  const errors = []
  addRequiredStringError(errors, req.body, ['identifier'], 'Username/email')
  addRequiredStringError(errors, req.body, ['password'], 'Password')

  if (errors.length) {
    next(createHttpError(400, 'Request tidak valid.', errors))
    return
  }

  next()
}

export function validateUserBody({ requirePassword = false } = {}) {
  return function validateUserBodyMiddleware(req, res, next) {
    const errors = []
    addRequiredStringError(errors, req.body, ['fullName', 'full_name'], 'Full name')
    addEnumError(errors, req.body, ['role'], ['admin', 'checker', 'viewer'], 'Role')

    if (requirePassword) {
      addRequiredStringError(errors, req.body, ['password'], 'Password')
    }

    if (req.body?.email && !String(req.body.email).includes('@')) {
      errors.push('Email tidak valid.')
    }

    if (errors.length) {
      next(createHttpError(400, 'Request tidak valid.', errors))
      return
    }

    next()
  }
}

export function validatePasswordChangeBody(req, res, next) {
  const password = String(req.body?.password || '')
  const confirmPassword = String(req.body?.confirmPassword || req.body?.confirm_password || '')

  if (!password || password.length < 8) {
    next(createHttpError(400, 'Password minimal 8 karakter.'))
    return
  }

  if (confirmPassword && password !== confirmPassword) {
    next(createHttpError(400, 'Konfirmasi password tidak sama.'))
    return
  }

  next()
}

export function validateDestinationBody(req, res, next) {
  const errors = []
  addRequiredStringError(errors, req.body, ['name'], 'Destination')

  if (errors.length) {
    next(createHttpError(400, 'Request tidak valid.', errors))
    return
  }

  next()
}

export function validateStatusBody(allowedValues) {
  return function validateStatusBodyMiddleware(req, res, next) {
    const errors = []
    addEnumError(errors, req.body, ['status'], allowedValues, 'Status')

    if (errors.length) {
      next(createHttpError(400, 'Request tidak valid.', errors))
      return
    }

    next()
  }
}

export function validateBooleanBody(names, label) {
  return function validateBooleanBodyMiddleware(req, res, next) {
    const value = getBodyValue(req.body, names)
    if (typeof value !== 'boolean') {
      next(createHttpError(400, `${label} wajib berupa boolean.`))
      return
    }

    next()
  }
}

export function validateVesselBody(req, res, next) {
  const errors = []
  addRequiredStringError(errors, req.body, ['vesselName', 'vessel_name'], 'Vessel name')
  addRequiredStringError(errors, req.body, ['cargoOwner', 'cargo_owner'], 'Cargo owner')
  addRequiredStringError(errors, req.body, ['cargoType', 'cargo_type'], 'Cargo type')
  addRequiredStringError(errors, req.body, ['destinationId', 'destination_id'], 'Destination')
  addRequiredStringError(errors, req.body, ['startDischargeDate', 'start_discharge_date'], 'Start discharge date')
  addPositiveNumberError(errors, req.body, ['totalHatch', 'total_hatch'], 'Total hatch')

  if (errors.length) {
    next(createHttpError(400, 'Request tidak valid.', errors))
    return
  }

  next()
}

export function validateHatchCargoBody(req, res, next) {
  const rows = req.body?.rows || req.body?.hatchCargoRows

  if (!Array.isArray(rows) || rows.length === 0) {
    next(createHttpError(400, 'Rows hatch cargo wajib diisi.'))
    return
  }

  const invalidRow = rows.find((row) => {
    const hatchNo = Number(row.hatchNo || row.hatch_no)
    const initialCargo = Number(row.initialCargo || row.initial_cargo || 0)
    return !Number.isFinite(hatchNo) || hatchNo <= 0 || !Number.isFinite(initialCargo) || initialCargo < 0
  })

  if (invalidRow) {
    next(createHttpError(400, 'Data hatch cargo tidak valid.'))
    return
  }

  next()
}

export function validateCheckerAssignmentBody(req, res, next) {
  const checkerId = req.body?.checkerId || req.body?.checker_id
  if (!hasValue(checkerId)) {
    next(createHttpError(400, 'Checker wajib dipilih.'))
    return
  }

  next()
}

export function validateDischargeEntryBody(req, res, next) {
  const errors = []
  addRequiredStringError(errors, req.body, ['vesselId', 'vessel_id'], 'Vessel')
  addRequiredStringError(errors, req.body, ['hatchCargoId', 'hatch_cargo_id'], 'Hatch')
  addRequiredStringError(errors, req.body, ['checkerId', 'checker_id'], 'Checker')
  addRequiredStringError(errors, req.body, ['plateNumber', 'plate_number'], 'Nomor polisi')
  addRequiredStringError(errors, req.body, ['deliveryOrderNumber', 'delivery_order_number'], 'No Surat Jalan')
  addRequiredStringError(errors, req.body, ['scaleTicketNumber', 'scale_ticket_number'], 'No SJ Timbangan')
  addPositiveNumberError(errors, req.body, ['tonnage'], 'Tonnage')

  if (errors.length) {
    next(createHttpError(400, 'Request tidak valid.', errors))
    return
  }

  next()
}
