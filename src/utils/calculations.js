// Mengambil nilai angka yang aman agar perhitungan tidak menghasilkan NaN.
function safeNumber(value) {
  return Number(value) || 0
}

function getTruckUnit(entry) {
  return entry.truckCount === undefined ? 1 : safeNumber(entry.truckCount)
}

// Membatasi progress agar tidak kurang dari 0 dan tidak lebih dari 100.
function limitProgress(value) {
  return Math.min(Math.max(value, 0), 100)
}

export function getTotalFinalStowage(hatchCargo) {
  return hatchCargo.reduce((total, cargo) => total + safeNumber(cargo.tonnage), 0)
}

export function getDischargeByHatch(dischargeEntries) {
  return dischargeEntries.reduce((result, entry) => {
    const hatch = entry.hatch
    result[hatch] = (result[hatch] || 0) + safeNumber(entry.tonnage)
    return result
  }, {})
}

export function getTruckByHatch(dischargeEntries) {
  return dischargeEntries.reduce((result, entry) => {
    const hatch = entry.hatch
    result[hatch] = (result[hatch] || 0) + getTruckUnit(entry)
    return result
  }, {})
}

export function getRunningReport(hatchCargo, dischargeEntries) {
  const dischargeByHatch = getDischargeByHatch(dischargeEntries)
  const truckByHatch = getTruckByHatch(dischargeEntries)

  return hatchCargo.map((cargo) => {
    const finalStowage = safeNumber(cargo.tonnage)
    const totalDischarge = safeNumber(dischargeByHatch[cargo.hatch])
    const totalTruck = safeNumber(truckByHatch[cargo.hatch])
    const remainingOnBoard = Math.max(finalStowage - totalDischarge, 0)
    const progressPercentage =
      finalStowage > 0 ? limitProgress((totalDischarge / finalStowage) * 100) : 0
    const averageLoad = totalTruck > 0 ? totalDischarge / totalTruck : 0

    return {
      hatch: cargo.hatch,
      finalStowage,
      totalDischarge,
      remainingOnBoard,
      progressPercentage,
      totalTruck,
      averageLoad,
    }
  })
}

export function getSummaryReport(hatchCargo, dischargeEntries) {
  const totalCargo = getTotalFinalStowage(hatchCargo)
  const totalDischarge = dischargeEntries.reduce(
    (total, entry) => total + safeNumber(entry.tonnage),
    0,
  )
  const totalTruck = dischargeEntries.reduce(
    (total, entry) => total + getTruckUnit(entry),
    0,
  )

  const totalRemaining = Math.max(totalCargo - totalDischarge, 0)
  const overallProgress = totalCargo > 0 ? limitProgress((totalDischarge / totalCargo) * 100) : 0
  const averageLoadPerTruck = totalTruck > 0 ? totalDischarge / totalTruck : 0
  const estimatedTruckRequirement =
    averageLoadPerTruck > 0 ? Math.ceil(totalRemaining / averageLoadPerTruck) : 0

  return {
    totalCargo,
    totalDischarge,
    totalRemaining,
    overallProgress,
    totalTruck,
    averageLoadPerTruck,
    estimatedTruckRequirement,
  }
}

export function getPeriodReport(dischargeEntries, periodStart, periodEnd, reportDate) {
  const entries = dischargeEntries.filter(
    (entry) =>
      entry.reportDate === reportDate &&
      entry.periodStart === periodStart &&
      entry.periodEnd === periodEnd,
  )

  const totalDischarge = entries.reduce((total, entry) => total + safeNumber(entry.tonnage), 0)
  const totalTruck = entries.reduce((total, entry) => total + safeNumber(entry.truckCount), 0)
  const totalTruckUnits = entries.reduce((total, entry) => total + getTruckUnit(entry), 0)
  const averageLoad = totalTruckUnits > 0 ? totalDischarge / totalTruckUnits : 0

  return {
    reportDate,
    periodStart,
    periodEnd,
    entries,
    totalDischarge,
    totalTruck: totalTruckUnits,
    averageLoad,
  }
}
