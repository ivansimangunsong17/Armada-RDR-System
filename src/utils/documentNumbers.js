const DELIVERY_ORDER_PREFIX = 'DT'

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function padDeliveryOrderDigits(value) {
  const digits = onlyDigits(value)
  if (!digits) return ''

  return digits.padStart(4, '0')
}

export function normalizeDocumentDigits(value) {
  return onlyDigits(value)
}

export function parseDeliveryOrderDigits(value) {
  const text = String(value || '').trim()
  const match = text.match(/^DT\s+(\d+)$/i)

  if (match) {
    return padDeliveryOrderDigits(match[1])
  }

  return padDeliveryOrderDigits(text)
}

export function buildDeliveryOrderNumber(value) {
  const digits = padDeliveryOrderDigits(value)
  return digits ? `${DELIVERY_ORDER_PREFIX} ${digits}` : ''
}

export function getNextDeliveryOrderDigits(entries, vesselId) {
  const maxNumber = (entries || []).reduce((currentMax, entry) => {
    if (vesselId && entry.vesselId !== vesselId) return currentMax

    const digits = parseDeliveryOrderDigits(entry.deliveryOrderNumber)
    const number = Number(digits)

    if (!number || Number.isNaN(number)) return currentMax

    return Math.max(currentMax, number)
  }, 0)

  return padDeliveryOrderDigits(String(maxNumber + 1))
}

export function getNextScaleTicketNumber(entries, vesselId) {
  const maxNumber = (entries || []).reduce((currentMax, entry) => {
    if (vesselId && entry.vesselId !== vesselId) return currentMax

    const digits = normalizeDocumentDigits(entry.scaleTicketNumber)
    const number = Number(digits)

    if (!number || Number.isNaN(number)) return currentMax

    return Math.max(currentMax, number)
  }, 0)

  return String(maxNumber + 1)
}
