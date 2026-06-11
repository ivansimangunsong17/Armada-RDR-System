import {
  formatOperationalTonnageFromNumber,
  formatOperationalTonnageInput,
  getNumericInputDigits,
  parseOperationalTonnageInput,
} from './numberFormat.js'

export function getTonnageInputDigits(value) {
  return getNumericInputDigits(value)
}

export function formatTonnageInput(value) {
  return formatOperationalTonnageInput(value)
}

export function parseTonnageInputToNumber(value) {
  return parseOperationalTonnageInput(value)
}

export function formatTonnageInputFromNumber(value) {
  return formatOperationalTonnageFromNumber(value)
}
