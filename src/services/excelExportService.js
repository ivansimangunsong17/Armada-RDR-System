import * as XLSX from 'xlsx'
import { formatNumber, formatPercentage, formatTruck } from '../utils/formatters.js'

function safeFilePart(value) {
  return String(value || 'report')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function writeWorkbook(fileName, sheets) {
  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(sheet.rows),
      sheet.name,
    )
  })

  XLSX.writeFile(workbook, fileName)
}

function getTodayLabel() {
  return new Date().toISOString().slice(0, 10)
}

function getEstimatedTruckRequirement(remainingCargo, averageLoadOverall) {
  const remaining = Number(remainingCargo) || 0
  const averageLoad = Number(averageLoadOverall) || 0

  if (remaining <= 0 || averageLoad <= 0) {
    return null
  }

  return Math.ceil(remaining / averageLoad)
}

function formatTruckRequirement(value) {
  return value ? formatTruck(value) : '-'
}

function buildMetadataRows({ vessel, reportDate, reportType, reportPeriod }) {
  return [
    ['Nama Kapal', vessel?.vesselName || '-'],
    ['Destination', vessel?.destination || '-'],
    ['Tanggal Report', reportDate || getTodayLabel()],
    ['Jenis Report', reportType],
    ['Shift/Periode', reportPeriod || '-'],
  ]
}

export function exportRunningReportExcel({ vessel, rows, summary, averageLoadOverall }) {
  const reportDate = getTodayLabel()
  const averageLoad = Number(averageLoadOverall) || Number(summary.averageLoadPerTruck) || 0
  const estimatedTruckRequirementTotal = getEstimatedTruckRequirement(
    summary.totalRemaining,
    averageLoad,
  )
  const metadataRows = buildMetadataRows({
    vessel,
    reportDate,
    reportType: 'Running Report',
  })
  const detailRows = [
    [
      'Hatch',
      'Initial Cargo',
      'Total Discharge',
      'Remaining Cargo',
      'Progress %',
      'Total DT',
      'Average Tonnage',
      'Est. Truck Requirement',
    ],
    ...rows.map((row) => {
      const estimatedTruckRequirement = getEstimatedTruckRequirement(
        row.remainingOnBoard,
        averageLoad,
      )

      return [
        row.hatch,
        formatNumber(row.finalStowage),
        formatNumber(row.totalDischarge),
        formatNumber(row.remainingOnBoard),
        formatPercentage(row.progressPercentage),
        formatTruck(row.totalTruck),
        formatNumber(row.averageLoad),
        formatTruckRequirement(estimatedTruckRequirement),
      ]
    }),
    [],
    [
      'TOTAL',
      formatNumber(summary.totalCargo),
      formatNumber(summary.totalDischarge),
      formatNumber(summary.totalRemaining),
      formatPercentage(summary.overallProgress),
      formatTruck(summary.totalTruck),
      formatNumber(summary.averageLoadPerTruck),
      formatTruckRequirement(estimatedTruckRequirementTotal),
    ],
  ]

  writeWorkbook(`running-report-${safeFilePart(vessel?.vesselName)}-${reportDate}.xlsx`, [
    { name: 'Metadata', rows: metadataRows },
    { name: 'Running Report', rows: detailRows },
  ])
}

export function exportShiftReportExcel({ vessel, reportDate, shiftLabel, rows, summary }) {
  const metadataRows = buildMetadataRows({
    vessel,
    reportDate,
    reportType: 'Report per Shift',
    reportPeriod: shiftLabel,
  })
  const detailRows = [
    ['Hatch', 'Total Discharge', 'Total DT', 'Average Tonnage'],
    ...rows.map((row) => [
      row.hatch,
      formatNumber(row.totalDischarge),
      formatTruck(row.totalTruck),
      formatNumber(row.averageTonnage),
    ]),
    [],
    [
      'TOTAL',
      formatNumber(summary.totalDischarge),
      formatTruck(summary.totalTruck),
      formatNumber(summary.averageTonnage),
    ],
  ]

  writeWorkbook(`shift-report-${safeFilePart(vessel?.vesselName)}-${reportDate || getTodayLabel()}.xlsx`, [
    { name: 'Metadata', rows: metadataRows },
    { name: 'Shift Report', rows: detailRows },
  ])
}

export function exportPeriodReportExcel({ vessel, reportDate, periodLabel, rows, summary }) {
  const metadataRows = buildMetadataRows({
    vessel,
    reportDate,
    reportType: 'Report Periode 2 Jam',
    reportPeriod: periodLabel,
  })
  const detailRows = [
    ['Hatch', 'Total Discharge', 'Total DT', 'Average Tonnage'],
    ...rows.map((row) => [
      row.hatch,
      formatNumber(row.totalDischarge),
      formatTruck(row.totalTruck),
      formatNumber(row.averageTonnage),
    ]),
    [],
    [
      'TOTAL',
      formatNumber(summary.totalDischarge),
      formatTruck(summary.totalTruck),
      formatNumber(summary.averageTonnage),
    ],
  ]

  writeWorkbook(`period-2-hour-report-${safeFilePart(vessel?.vesselName)}-${reportDate || getTodayLabel()}.xlsx`, [
    { name: 'Metadata', rows: metadataRows },
    { name: '2 Hour Report', rows: detailRows },
  ])
}
