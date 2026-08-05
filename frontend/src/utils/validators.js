export function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase()
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateDestinationForm(form) {
  const errors = {}

  if (!String(form?.name || '').trim()) {
    errors.name = 'Destination wajib diisi.'
  }

  return errors
}

export function validateLoginForm({ identifier, password }) {
  const cleanIdentifier = String(identifier || '').trim()
  const cleanPassword = String(password || '').trim()

  if (!cleanIdentifier || !cleanPassword) {
    return {
      identifier: cleanIdentifier,
      password: cleanPassword,
      error: 'Username/email dan password wajib diisi.',
    }
  }

  return {
    identifier: cleanIdentifier,
    password: cleanPassword,
    error: '',
  }
}

export function validateDischargeEntryForm(form, options = {}) {
  const {
    destinationCount = 0,
    parseTonnage,
    plateLabel = 'Plat kendaraan',
    requireVessel = false,
  } = options
  const errors = {}
  const tonnage = parseTonnage
    ? parseTonnage(form?.tonnage)
    : Number(form?.tonnage) || 0

  if (requireVessel && !form?.vesselId) errors.vesselId = 'Kapal assignment wajib ada.'
  if (!form?.hatchCargoId) errors.hatchCargoId = 'Hatch wajib dipilih.'
  if (destinationCount > 0 && !form?.destinationId) {
    errors.destinationId = 'Destination wajib dipilih.'
  }
  if (!String(form?.plateNumber || '').trim()) {
    errors.plateNumber = `${plateLabel} wajib diisi.`
  }
  if (!form?.tonnage) errors.tonnage = 'Tonnage wajib diisi.'
  else if (tonnage <= 0) errors.tonnage = 'Tonnage wajib lebih dari 0.'
  if (!String(form?.deliveryOrderNumber || '').trim()) {
    errors.deliveryOrderNumber = 'No Surat Jalan wajib diisi.'
  } else if (!/^\d+$/.test(form.deliveryOrderNumber)) {
    errors.deliveryOrderNumber = 'No Surat Jalan hanya boleh angka.'
  }
  if (!String(form?.scaleTicketNumber || '').trim()) {
    errors.scaleTicketNumber = 'No SJ Timbangan wajib diisi.'
  } else if (!/^\d+$/.test(form.scaleTicketNumber)) {
    errors.scaleTicketNumber = 'No SJ Timbangan hanya boleh angka.'
  }

  return errors
}

export function validateVesselForm(form, options = {}) {
  const { parseTonnage } = options
  const errors = {}
  const activeDestinations = (form?.destinationRows || []).filter((row) => row.isActive)

  if (!String(form?.vesselName || '').trim()) errors.vesselName = 'Vessel name wajib diisi.'
  if (!String(form?.cargoOwner || '').trim()) errors.cargoOwner = 'Cargo owner wajib diisi.'
  if (!String(form?.cargoType || '').trim()) errors.cargoType = 'Cargo type wajib diisi.'
  if (activeDestinations.length === 0) {
    errors.destinationRows = 'Minimal satu destination active wajib tersedia.'
  }
  if (!form?.assignedCheckerId) errors.assignedCheckerId = 'Assigned checker wajib dipilih.'
  if (!form?.startDischargeDate) {
    errors.startDischargeDate = 'Start discharge date wajib diisi.'
  }
  if (Number(form?.totalHatch) < 1) errors.totalHatch = 'Total hatch minimal 1.'

  const invalidHatch = (form?.hatchCargoRows || []).find((row) => {
    const value = parseTonnage ? parseTonnage(row.initialCargo) : Number(row.initialCargo)
    return row.initialCargo === '' || value < 0
  })

  if (invalidHatch) {
    errors.hatchCargoRows = 'Final Stowage Plan per hatch wajib diisi dan tidak boleh minus.'
  }

  return errors
}

export function getUserValidationIssues(form) {
  const issues = []
  const fullName = String(form?.fullName || '').trim()
  const username = normalizeUsername(form?.username || '')
  const email = normalizeEmail(form?.email || '')

  if (!fullName) {
    issues.push('Full Name wajib diisi.')
  }

  if (username && !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    issues.push(
      'Username harus 3-32 karakter, diawali huruf/angka, hanya huruf kecil, angka, titik, underscore, atau dash.',
    )
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push('Format email tidak valid.')
  }

  return issues
}

export function getCreateUserValidationIssues(form) {
  const issues = getUserValidationIssues(form)
  const email = normalizeEmail(form?.email || '')

  if (!email) {
    issues.push('Email wajib diisi untuk membuat user login.')
  }

  if (!form?.password || form.password.length < 8) {
    issues.push('Password minimal 8 karakter.')
  }

  return issues
}

export function getChangePasswordValidationIssues(form) {
  const issues = []
  const password = String(form?.password || '')
  const confirmPassword = String(form?.confirmPassword || '')

  if (!password || password.length < 8) {
    issues.push('Password baru minimal 8 karakter.')
  }

  if (!confirmPassword) {
    issues.push('Konfirmasi password wajib diisi.')
  } else if (password !== confirmPassword) {
    issues.push('Konfirmasi password tidak sama.')
  }

  return issues
}
