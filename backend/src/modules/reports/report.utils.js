export function safeNumber(value) {
  return Number(value) || 0
}

function toDateString(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

export function toTime(value) {
  return value ? String(value).slice(0, 5) : ''
}

export function normalizeDateFields(row = {}) {
  return {
    ...row,
    gate_out_date: toDateString(row.gate_out_date),
    gate_in_date: toDateString(row.gate_in_date),
  }
}

export function getTimeMinutes(value) {
  if (!value) return null
  const [hour, minute] = String(value).slice(0, 5).split(':').map(Number)

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null

  return hour * 60 + minute
}

export function buildTimedReportSummary(rows = []) {
  const totalDischarge = rows.reduce((total, row) => total + safeNumber(row.totalDischarge), 0)
  const totalTruck = rows.reduce((total, row) => total + safeNumber(row.totalTruck), 0)

  return {
    totalDischarge,
    totalTruck,
    averageTonnage: totalTruck > 0 ? totalDischarge / totalTruck : 0,
  }
}

export function getTruckDurationMinutes(row) {
  if (!row.gate_in_at || !row.gate_out_at) return null

  const gateIn = new Date(row.gate_in_at)
  const gateOut = new Date(row.gate_out_at)

  if (Number.isNaN(gateIn.getTime()) || Number.isNaN(gateOut.getTime())) return null

  const diffMinutes = Math.round((gateOut.getTime() - gateIn.getTime()) / 60000)
  return diffMinutes >= 0 ? diffMinutes : null
}

export function buildTruckDurationSummary(rows = []) {
  const completeRows = rows.filter((row) => row.durationMinutes !== null)
  const totalMinutes = completeRows.reduce(
    (total, row) => total + safeNumber(row.durationMinutes),
    0,
  )
  const durationValues = completeRows.map((row) => safeNumber(row.durationMinutes))

  return {
    totalRows: rows.length,
    completedRows: completeRows.length,
    incompleteRows: rows.length - completeRows.length,
    averageMinutes: completeRows.length > 0 ? totalMinutes / completeRows.length : 0,
    minMinutes: durationValues.length > 0 ? Math.min(...durationValues) : 0,
    maxMinutes: durationValues.length > 0 ? Math.max(...durationValues) : 0,
  }
}

export function buildRepeatTruckSummary(rows = []) {
  const groupedRows = rows.reduce((result, row) => {
    const plateNumber = String(row.plateNumber || '').trim().toUpperCase()
    if (!plateNumber || plateNumber === '-') return result

    const current = result[plateNumber] || []
    current.push(row)
    result[plateNumber] = current

    return result
  }, {})

  return Object.entries(groupedRows)
    .map(([plateNumber, truckRows]) => {
      const sortedRows = [...truckRows].sort((first, second) => {
        const firstTime = new Date(first.gateInAt || first.gateOutAt || 0).getTime()
        const secondTime = new Date(second.gateInAt || second.gateOutAt || 0).getTime()

        return firstTime - secondTime
      })
      const completedRows = sortedRows.filter((row) => row.durationMinutes !== null)
      const totalDurationMinutes = completedRows.reduce(
        (total, row) => total + safeNumber(row.durationMinutes),
        0,
      )
      const turnaroundMinutes = []

      for (let index = 1; index < sortedRows.length; index += 1) {
        const previousGateOut = sortedRows[index - 1].gateOutAt
        const currentGateIn = sortedRows[index].gateInAt

        if (!previousGateOut || !currentGateIn) continue

        const previousTime = new Date(previousGateOut)
        const currentTime = new Date(currentGateIn)

        if (Number.isNaN(previousTime.getTime()) || Number.isNaN(currentTime.getTime())) continue

        const diffMinutes = Math.round((currentTime.getTime() - previousTime.getTime()) / 60000)
        if (diffMinutes >= 0) turnaroundMinutes.push(diffMinutes)
      }

      const firstTrip = sortedRows[0] || {}
      const lastTrip = sortedRows[sortedRows.length - 1] || {}
      const totalTurnaroundMinutes = turnaroundMinutes.reduce((total, value) => total + value, 0)

      return {
        plateNumber,
        tripCount: sortedRows.length,
        completedTripCount: completedRows.length,
        firstGateInDate: firstTrip.gateInDate,
        firstGateInTime: firstTrip.gateInTime,
        lastGateInDate: lastTrip.gateInDate,
        lastGateInTime: lastTrip.gateInTime,
        lastGateOutDate: lastTrip.gateOutDate,
        lastGateOutTime: lastTrip.gateOutTime,
        averageDurationMinutes: completedRows.length > 0
          ? totalDurationMinutes / completedRows.length
          : 0,
        averageTurnaroundMinutes: turnaroundMinutes.length > 0
          ? totalTurnaroundMinutes / turnaroundMinutes.length
          : null,
      }
    })
    .filter((row) => row.tripCount > 1)
    .sort((first, second) => {
      if (second.tripCount !== first.tripCount) return second.tripCount - first.tripCount

      return String(first.plateNumber).localeCompare(String(second.plateNumber))
    })
}

export function buildSingleTripTruckSummary(rows = []) {
  const groupedRows = rows.reduce((result, row) => {
    const plateNumber = String(row.plateNumber || '').trim().toUpperCase()
    if (!plateNumber || plateNumber === '-') return result

    const current = result[plateNumber] || []
    current.push(row)
    result[plateNumber] = current

    return result
  }, {})

  return Object.entries(groupedRows)
    .filter(([, truckRows]) => truckRows.length === 1)
    .map(([plateNumber, truckRows]) => {
      const trip = truckRows[0] || {}

      return {
        plateNumber,
        tripCount: 1,
        gateInDate: trip.gateInDate,
        gateInTime: trip.gateInTime,
        gateOutDate: trip.gateOutDate,
        gateOutTime: trip.gateOutTime,
        hatch: trip.hatch || '-',
        destination: trip.destination || '-',
        durationMinutes: trip.durationMinutes,
        isDurationComplete: trip.isDurationComplete,
      }
    })
    .sort((first, second) => {
      const firstTime = `${first.gateOutDate || ''} ${first.gateOutTime || ''}`
      const secondTime = `${second.gateOutDate || ''} ${second.gateOutTime || ''}`

      return secondTime.localeCompare(firstTime)
    })
}
