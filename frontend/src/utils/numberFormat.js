function toSafeNumber(value) {
  return Number(value) || 0
}

function formatIntegerWithThousands(value) {
  return Math.trunc(value).toLocaleString('en-US')
}

function formatScaledOperationalNumber(value) {
  const numericValue = toSafeNumber(value)
  const scaledValue = Math.round(numericValue * 1000)
  const integerDigits = Math.trunc(scaledValue / 1000)
  const decimalDigits = Math.abs(scaledValue % 1000)
    .toString()
    .padStart(3, '0')

  return `${formatIntegerWithThousands(integerDigits)},${decimalDigits}`
}

export function getNumericInputDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function parseOperationalTonnageInput(value) {
  const digits = getNumericInputDigits(value)

  if (!digits) return 0

  return Number(digits) / 1000
}

export function formatOperationalTonnageInput(value) {
  const digits = getNumericInputDigits(value)

  if (!digits) return ''

  const normalizedDigits = digits.padStart(4, '0')
  const integerDigits = normalizedDigits.slice(0, -3)
  const decimalDigits = normalizedDigits.slice(-3)
  const integerValue = Number(integerDigits)

  return `${formatIntegerWithThousands(integerValue)},${decimalDigits}`
}

export function formatOperationalTonnageFromNumber(value) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return ''

  return formatOperationalTonnageInput(String(Math.round(numericValue * 1000)))
}

export function formatOperationalNumber(value) {
  return formatScaledOperationalNumber(value)
}

export function formatWholeNumber(value) {
  return formatIntegerWithThousands(toSafeNumber(value))
}

export function formatOperationalPercentage(value) {
  return `${toSafeNumber(value).toFixed(2).replace('.', ',')}%`
}

/*
Manual examples:
40491 -> display 40,491 -> numeric 40.491
26320 -> display 26,320 -> numeric 26.320
50000 -> display 50,000 -> numeric 50.000
9999000 -> display 9,999,000 -> numeric 9999.000
*/
