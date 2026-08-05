const JAKARTA_OFFSET = '+07:00'
const TIME_24H_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function padNumber(value) {
  return String(value).padStart(2, '0')
}

export function getTodayDateInputValue() {
  const now = new Date()
  return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}-${padNumber(now.getDate())}`
}

export function getCurrentTimeInputValue() {
  const now = new Date()
  return `${padNumber(now.getHours())}:${padNumber(now.getMinutes())}`
}

export function formatTimeInputValue(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) return digits

  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function normalizeTimeInput(value) {
  const rawValue = String(value || '').trim()

  if (!rawValue) return ''
  if (TIME_24H_PATTERN.test(rawValue.slice(0, 5))) return rawValue.slice(0, 5)

  const digits = rawValue.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''

  const normalizedDigits = digits.length === 3 ? digits.padStart(4, '0') : digits
  if (normalizedDigits.length !== 4) return rawValue

  const normalizedTime = `${normalizedDigits.slice(0, 2)}:${normalizedDigits.slice(2)}`

  return TIME_24H_PATTERN.test(normalizedTime) ? normalizedTime : rawValue
}

export function isValidTime24(value) {
  return TIME_24H_PATTERN.test(normalizeTimeInput(value))
}

export function getDefaultGateTimeFields() {
  const date = getTodayDateInputValue()
  const time = getCurrentTimeInputValue()

  return {
    gateInDate: date,
    gateInTime: time,
    gateOutDate: date,
    gateOutTime: time,
  }
}

export function getGateTimeFieldsFromEntry(entry = {}) {
  const defaults = getDefaultGateTimeFields()

  return {
    gateInDate: entry.gateInDate || entry.gateOutDate || defaults.gateInDate,
    gateInTime: normalizeTimeInput(entry.gateInTime || entry.gateOutTime || defaults.gateInTime),
    gateOutDate: entry.gateOutDate || defaults.gateOutDate,
    gateOutTime: normalizeTimeInput(entry.gateOutTime || defaults.gateOutTime),
  }
}

export function buildGateAt(date, time) {
  const cleanTime = normalizeTimeInput(time)
  if (!date || !isValidTime24(cleanTime)) return null

  return `${date}T${cleanTime}:00${JAKARTA_OFFSET}`
}

export function getGateTimePayload(form) {
  return {
    gate_in_at: buildGateAt(form.gateInDate, form.gateInTime),
    gate_in_date: form.gateInDate,
    gate_in_time: normalizeTimeInput(form.gateInTime),
    gate_out_at: buildGateAt(form.gateOutDate, form.gateOutTime),
    gate_out_date: form.gateOutDate,
    gate_out_time: normalizeTimeInput(form.gateOutTime),
  }
}

export function validateGateTimes(form) {
  const errors = {}

  if (!form.gateInDate) errors.gateInDate = 'Gate In Date wajib diisi.'
  if (!form.gateInTime) errors.gateInTime = 'Gate In Time wajib diisi.'
  else if (!isValidTime24(form.gateInTime)) {
    errors.gateInTime = 'Gunakan format 24 jam, contoh 08:00, 16:00, 23:59.'
  }

  if (!form.gateOutDate) errors.gateOutDate = 'Gate Out Date wajib diisi.'
  if (!form.gateOutTime) errors.gateOutTime = 'Gate Out Time wajib diisi.'
  else if (!isValidTime24(form.gateOutTime)) {
    errors.gateOutTime = 'Gunakan format 24 jam, contoh 08:00, 16:00, 23:59.'
  }

  if (
    form.gateInDate &&
    isValidTime24(form.gateInTime) &&
    form.gateOutDate &&
    isValidTime24(form.gateOutTime)
  ) {
    const gateIn = new Date(`${form.gateInDate}T${normalizeTimeInput(form.gateInTime)}:00`)
    const gateOut = new Date(`${form.gateOutDate}T${normalizeTimeInput(form.gateOutTime)}:00`)

    if (gateOut.getTime() < gateIn.getTime()) {
      errors.gateOutTime = 'Gate Out tidak boleh lebih awal dari Gate In.'
    }
  }

  return errors
}