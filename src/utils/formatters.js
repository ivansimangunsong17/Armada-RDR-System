import {
  formatOperationalNumber,
  formatOperationalPercentage,
  formatWholeNumber,
} from './numberFormat.js'

export function formatNumber(value) {
  return formatOperationalNumber(value)
}

export function formatMT(value) {
  return formatNumber(value)
}

export function formatTruck(value) {
  const truckValue = Math.round(Number(value) || 0)
  return `${formatWholeNumber(truckValue)} Unit`
}

export function formatPercentage(value) {
  return formatOperationalPercentage(value)
}

export function formatDate(value) {
  if (!value) {
    return '00/00/0000'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '00/00/0000'
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}
