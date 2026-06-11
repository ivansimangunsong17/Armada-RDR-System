const JAKARTA_OFFSET = '+07:00'

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

export function normalizeTimeInput(value) {
  return value ? String(value).slice(0, 5) : ''
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
  if (!date || !cleanTime) return null

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
  if (!form.gateOutDate) errors.gateOutDate = 'Gate Out Date wajib diisi.'
  if (!form.gateOutTime) errors.gateOutTime = 'Gate Out Time wajib diisi.'

  if (
    form.gateInDate &&
    form.gateInTime &&
    form.gateOutDate &&
    form.gateOutTime
  ) {
    const gateIn = new Date(`${form.gateInDate}T${normalizeTimeInput(form.gateInTime)}:00`)
    const gateOut = new Date(`${form.gateOutDate}T${normalizeTimeInput(form.gateOutTime)}:00`)

    if (gateOut.getTime() < gateIn.getTime()) {
      errors.gateOutTime = 'Gate Out tidak boleh lebih awal dari Gate In.'
    }
  }

  return errors
}
