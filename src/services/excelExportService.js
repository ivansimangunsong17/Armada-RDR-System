import * as XLSX from 'xlsx'
import { formatNumber, formatPercentage, formatTruck } from '../utils/formatters.js'
import { formatWholeNumber } from '../utils/numberFormat.js'
import armadaLogoUrl from '../assets/BGLogoArmada.png'

const REPORT_COLORS = {
  navy: 'FF1F2937',
  navyDark: 'FF111827',
  red: 'FF7F1D1D',
  redSoft: 'FFFFE4E6',
 grayHeader: 'FFD32F2F',
  graySoft: 'FFF8FAFC',
  greenSoft: 'FFEAF7EF',
  green: 'FF047857',
  amberSoft: 'FFFFF7E6',
  white: 'FFFFFFFF',
  black: 'FF000000',
}

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

function getPrintedPreviewLabel(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} ${hour}:${minute}`
}

function getVesselDisplayName(vesselName) {
  const name = String(vesselName || '-').trim()

  return /^mv\.?\s+/i.test(name) ? name : `MV. ${name}`
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

function formatTruckCount(value) {
  return formatWholeNumber(Math.round(Number(value) || 0))
}

function formatTruckRequirementCount(value) {
  return value ? formatTruckCount(value) : '-'
}

function getExcelColumnLetter(columnNumber) {
  let dividend = columnNumber
  let columnName = ''

  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = Math.floor((dividend - modulo) / 26)
  }

  return columnName
}

async function getImageBase64(assetUrl) {
  const response = await fetch(assetUrl)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = String(reader.result || '')
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
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

function downloadWorkbookBuffer(buffer, fileName) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function applyBorder(cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: REPORT_COLORS.black } },
    left: { style: 'thin', color: { argb: REPORT_COLORS.black } },
    bottom: { style: 'thin', color: { argb: REPORT_COLORS.black } },
    right: { style: 'thin', color: { argb: REPORT_COLORS.black } },
  }
}

function applyBoxBorder(worksheet, startRow, endRow, startCol, endCol) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    for (let colNumber = startCol; colNumber <= endCol; colNumber += 1) {
      const cell = worksheet.getRow(rowNumber).getCell(colNumber)
      const current = cell.border || {}

      cell.border = {
        top:
          rowNumber === startRow
            ? { style: 'medium', color: { argb: REPORT_COLORS.black } }
            : current.top || { style: 'thin', color: { argb: REPORT_COLORS.black } },
        bottom:
          rowNumber === endRow
            ? { style: 'medium', color: { argb: REPORT_COLORS.black } }
            : current.bottom || { style: 'thin', color: { argb: REPORT_COLORS.black } },
        left:
          colNumber === startCol
            ? { style: 'medium', color: { argb: REPORT_COLORS.black } }
            : current.left || { style: 'thin', color: { argb: REPORT_COLORS.black } },
        right:
          colNumber === endCol
            ? { style: 'medium', color: { argb: REPORT_COLORS.black } }
            : current.right || { style: 'thin', color: { argb: REPORT_COLORS.black } },
      }
    }
  }
}

function applyRangeBorder(worksheet, startRow, endRow, startCol, endCol) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)

    for (let colNumber = startCol; colNumber <= endCol; colNumber += 1) {
      applyBorder(row.getCell(colNumber))
    }
  }
}

function setFill(cell, color) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color },
  }
}

function setRangeFill(worksheet, startRow, endRow, startCol, endCol, color) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)

    for (let colNumber = startCol; colNumber <= endCol; colNumber += 1) {
      setFill(row.getCell(colNumber), color)
    }
  }
}

function styleTableHeader(row, options = {}) {
  const fillColor = options.fillColor || REPORT_COLORS.grayHeader
  const fontColor = options.fontColor || REPORT_COLORS.navy

  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: fontColor } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    setFill(cell, fillColor)
    applyBorder(cell)
  })
}

function alignDataRow(row, firstCol = 1) {
  row.eachCell((cell, colNumber) => {
    cell.alignment = {
      horizontal: colNumber === firstCol ? 'left' : 'right',
      vertical: 'middle',
    }
    applyBorder(cell)
  })
}

function styleDataBand(row, fillColor) {
  row.eachCell((cell) => {
    setFill(cell, fillColor)
  })
}

function styleOverDischargeCell(cell) {
  setFill(cell, REPORT_COLORS.greenSoft)
  cell.font = { bold: true, color: { argb: REPORT_COLORS.green } }
}

function buildExcelDestinationSummaryTotal(rows) {
  const totalDischarge = rows.reduce((total, row) => total + (Number(row.totalDischarge) || 0), 0)
  const totalDt = rows.reduce((total, row) => total + (Number(row.totalDt) || 0), 0)

  return {
    destination: 'TOTAL',
    totalDischarge,
    totalDt,
    averageTonnage: totalDt > 0 ? totalDischarge / totalDt : 0,
  }
}

export async function exportRunningReportExcel({
  vessel,
  rows,
  summary,
  averageLoadOverall,
  destinationSummary = [],
}) {
  const ExcelJSModule = await import('exceljs')
  const ExcelJS = ExcelJSModule.default || ExcelJSModule
  const reportDate = getTodayLabel()
  const printedAt = getPrintedPreviewLabel()
  const averageLoad = Number(averageLoadOverall) || Number(summary.averageLoadPerTruck) || 0
  const sortedRows = [...rows].sort((a, b) => (Number(a.hatchNo) || 0) - (Number(b.hatchNo) || 0))
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Running Report')
  const reportStartColumn = 2
  const firstDataColumn = reportStartColumn + 1
  const lastColumn = reportStartColumn + sortedRows.length + 1
  const totalColumn = lastColumn
  const reportStartLetter = getExcelColumnLetter(reportStartColumn)
  const firstDataLetter = getExcelColumnLetter(firstDataColumn)
  const lastColumnLetter = getExcelColumnLetter(lastColumn)
  const headerStartColumn = reportStartColumn
  const headerStartLetter = getExcelColumnLetter(headerStartColumn)
  const titleRange = `${headerStartLetter}1:${lastColumnLetter}1`
  const vesselRange = `${headerStartLetter}2:${lastColumnLetter}2`
  const reportRange = `${headerStartLetter}3:${lastColumnLetter}3`
  const dateRange = `${headerStartLetter}4:${lastColumnLetter}4`

  workbook.creator = 'Running Discharge Report System'
  workbook.created = new Date()
  workbook.modified = new Date()

  setRangeFill(worksheet, 1, 4, reportStartColumn, lastColumn, REPORT_COLORS.white)

  try {
    const logoBase64 = await getImageBase64(armadaLogoUrl)
    const logoId = workbook.addImage({
      base64: logoBase64,
      extension: 'png',
    })

    worksheet.addImage(logoId, {
      tl: { col: 1.2, row: 0.55 },
      ext: { width: 58, height: 40 },
    })
  } catch (_error) {
    worksheet.getCell(`${reportStartLetter}1`).value = 'ARMADA'
    worksheet.getCell(`${reportStartLetter}1`).font = { bold: true, color: { argb: REPORT_COLORS.red } }
  }

  worksheet.mergeCells(titleRange)
  worksheet.mergeCells(vesselRange)
  worksheet.mergeCells(reportRange)
  worksheet.mergeCells(dateRange)

  worksheet.getCell(headerStartLetter + '1').value = 'PT GAPURA SEGARA NUSANTARA'
  worksheet.getCell(headerStartLetter + '2').value = getVesselDisplayName(vessel?.vesselName)
  worksheet.getCell(headerStartLetter + '3').value = 'RUNNING DISCHARGE RESULT'
  worksheet.getCell(headerStartLetter + '4').value = `Printed Preview : ${printedAt}`

  ;[
    { address: headerStartLetter + '1', size: 13, fill: REPORT_COLORS.white, color: REPORT_COLORS.navyDark },
    { address: headerStartLetter + '2', size: 12, fill: REPORT_COLORS.white, color: REPORT_COLORS.navyDark },
    { address: headerStartLetter + '3', size: 12, fill: REPORT_COLORS.white, color: REPORT_COLORS.navyDark },
    { address: headerStartLetter + '4', size: 10, fill: REPORT_COLORS.white, color: REPORT_COLORS.navy },
  ].forEach((item) => {
    const cell = worksheet.getCell(item.address)
    cell.font = { bold: true, size: item.size, color: { argb: item.color } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    setFill(cell, item.fill)
  })

  worksheet.addRow([])
  const headerRow = worksheet.addRow([
    '',
    'Description',
    ...sortedRows.map((row) => row.hatch),
    'Total',
  ])
  const tableStartRow = headerRow.number
  const dataRows = [
    [
      '',
      'Final stowage plan',
      ...sortedRows.map((row) => formatNumber(row.finalStowage)),
      formatNumber(summary.totalCargo),
    ],
    [
      '',
      'Discharge',
      ...sortedRows.map((row) => formatNumber(row.totalDischarge)),
      formatNumber(summary.totalDischarge),
    ],
    [
      '',
      'Remaining on board',
      ...sortedRows.map((row) => formatNumber(row.remainingOnBoard)),
      formatNumber(summary.totalRemaining),
    ],
    [
      '',
      'Discharge Percentage',
      ...sortedRows.map((row) => formatPercentage(row.progressPercentage)),
      formatPercentage(summary.overallProgress),
    ],
    [
      '',
      'Total Truck',
      ...sortedRows.map((row) => formatTruckCount(row.totalTruck)),
      formatTruckCount(summary.totalTruck),
    ],
  ]

  styleTableHeader(headerRow, {
    fillColor: REPORT_COLORS.white,
    fontColor: REPORT_COLORS.navyDark,
  })
  dataRows.forEach((rowValues, index) => {
    const row = worksheet.addRow(rowValues)
    alignDataRow(row, reportStartColumn)
    row.getCell(totalColumn).font = { bold: true }

    if (index === 1) {
      styleDataBand(row, REPORT_COLORS.greenSoft)
    } else if (index === 2) {
      styleDataBand(row, REPORT_COLORS.amberSoft)
    } else if (index % 2 === 0) {
      styleDataBand(row, REPORT_COLORS.graySoft)
    }

    if (index === 3) {
      sortedRows.forEach((hatchRow, hatchIndex) => {
        if (Number(hatchRow.totalDischarge) > Number(hatchRow.finalStowage)) {
          styleOverDischargeCell(row.getCell(hatchIndex + firstDataColumn))
        }
      })

      if (Number(summary.totalDischarge) > Number(summary.totalCargo)) {
        styleOverDischargeCell(row.getCell(totalColumn))
      }
    }
  })

  const tableEndRow = worksheet.lastRow.number
  applyRangeBorder(worksheet, tableStartRow, tableEndRow, reportStartColumn, lastColumn)
  applyBoxBorder(worksheet, tableStartRow, tableEndRow, reportStartColumn, lastColumn)

  const averageRow = worksheet.addRow([
    '',
    'Average Load / Truck',
    formatNumber(averageLoad),
  ])
  worksheet.mergeCells(`${firstDataLetter}${averageRow.number}:${lastColumnLetter}${averageRow.number}`)
  averageRow.getCell(reportStartColumn).font = { bold: true, color: { argb: REPORT_COLORS.navyDark } }
  averageRow.getCell(firstDataColumn).font = { bold: true, color: { argb: REPORT_COLORS.navyDark } }
  averageRow.getCell(firstDataColumn).alignment = { horizontal: 'right' }
  setFill(averageRow.getCell(reportStartColumn), REPORT_COLORS.graySoft)
  setFill(averageRow.getCell(firstDataColumn), REPORT_COLORS.graySoft)
  applyRangeBorder(worksheet, averageRow.number, averageRow.number, reportStartColumn, lastColumn)
  applyBoxBorder(worksheet, averageRow.number, averageRow.number, reportStartColumn, lastColumn)

  const truckRequirementRow = worksheet.addRow([
    '',
    'Est. Truck Requirement',
    formatTruckRequirementCount(getEstimatedTruckRequirement(summary.totalRemaining, averageLoad)),
  ])
  worksheet.mergeCells(`${firstDataLetter}${truckRequirementRow.number}:${lastColumnLetter}${truckRequirementRow.number}`)
  truckRequirementRow.getCell(reportStartColumn).font = { bold: true, color: { argb: REPORT_COLORS.navyDark } }
  truckRequirementRow.getCell(firstDataColumn).font = { bold: true, color: { argb: REPORT_COLORS.navyDark } }
  truckRequirementRow.getCell(firstDataColumn).alignment = { horizontal: 'right' }
  setFill(truckRequirementRow.getCell(reportStartColumn), REPORT_COLORS.graySoft)
  setFill(truckRequirementRow.getCell(firstDataColumn), REPORT_COLORS.graySoft)
  applyRangeBorder(worksheet, truckRequirementRow.number, truckRequirementRow.number, reportStartColumn, lastColumn)
  applyBoxBorder(worksheet, truckRequirementRow.number, truckRequirementRow.number, reportStartColumn, lastColumn)

  worksheet.addRow([])
  const destinationHeaderRow = worksheet.addRow(['', 'DESTINATION', 'NETTO', 'DT', 'Average'])
  styleTableHeader(destinationHeaderRow, {
    fillColor: REPORT_COLORS.white,
    fontColor: REPORT_COLORS.navyDark,
  })

  const destinationRows = destinationSummary.length > 0
    ? destinationSummary
    : [
        {
          destination: '-',
          totalDischarge: 0,
          totalDt: 0,
          averageTonnage: 0,
        },
      ]

  destinationRows.forEach((destinationRow, index) => {
    const row = worksheet.addRow([
      '',
      destinationRow.destination || '-',
      formatNumber(destinationRow.totalDischarge),
      formatTruckCount(destinationRow.totalDt),
      formatNumber(destinationRow.averageTonnage),
    ])
    alignDataRow(row, reportStartColumn)

    if (index % 2 === 0) {
      styleDataBand(row, REPORT_COLORS.graySoft)
    }
  })

  const destinationSummaryTotal = buildExcelDestinationSummaryTotal(destinationSummary)
  const destinationTotalRow = worksheet.addRow([
    '',
    destinationSummaryTotal.destination,
    formatNumber(destinationSummaryTotal.totalDischarge),
    formatTruckCount(destinationSummaryTotal.totalDt),
    formatNumber(destinationSummaryTotal.averageTonnage),
  ])
  alignDataRow(destinationTotalRow, reportStartColumn)
  destinationTotalRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: REPORT_COLORS.navyDark } }
  })
  applyRangeBorder(
    worksheet,
    destinationHeaderRow.number,
    destinationTotalRow.number,
    reportStartColumn,
    reportStartColumn + 3,
  )
  applyBoxBorder(
    worksheet,
    destinationHeaderRow.number,
    destinationTotalRow.number,
    reportStartColumn,
    reportStartColumn + 3,
  )

  worksheet.addRow([])
  const footerRow = worksheet.addRow(['', 'Generated by Running Discharge Report System'])
  worksheet.mergeCells(`${reportStartLetter}${footerRow.number}:${lastColumnLetter}${footerRow.number}`)
  footerRow.getCell(reportStartColumn).font = { italic: true, color: { argb: REPORT_COLORS.navy } }
  footerRow.getCell(reportStartColumn).alignment = { horizontal: 'center' }
  const printedRow = worksheet.addRow(['', `Printed at ${printedAt}`])
  worksheet.mergeCells(`${reportStartLetter}${printedRow.number}:${lastColumnLetter}${printedRow.number}`)
  printedRow.getCell(reportStartColumn).font = { italic: true, color: { argb: REPORT_COLORS.navy } }
  printedRow.getCell(reportStartColumn).alignment = { horizontal: 'center' }

  worksheet.columns = [
    { width: 3 },
    { width: 22 },
    ...sortedRows.map(() => ({ width: 12 })),
    { width: 13 },
  ]

  worksheet.eachRow((row) => {
    row.height = 22
  })

  worksheet.getRow(1).height = 26
  worksheet.getRow(2).height = 24
  worksheet.getRow(3).height = 28
  worksheet.getRow(4).height = 20
  worksheet.views = [{ state: 'frozen', ySplit: tableStartRow }]
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.35,
      bottom: 0.35,
      header: 0.15,
      footer: 0.15,
    },
  }
  worksheet.pageSetup.printArea = `${reportStartLetter}1:${lastColumnLetter}${printedRow.number}`

  for (let rowNumber = tableStartRow + 1; rowNumber <= tableEndRow; rowNumber += 1) {
    worksheet.getRow(rowNumber).getCell(reportStartColumn).font = {
      bold: true,
      color: { argb: REPORT_COLORS.navyDark },
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  downloadWorkbookBuffer(
    buffer,
    `running-report-${safeFilePart(vessel?.vesselName)}-${reportDate}.xlsx`,
  )
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

export function exportPeriodReportExcel({
  vessel,
  reportDate,
  periodLabel,
  rows,
  summary,
  runningPosition,
  destinationSummary = [],
}) {
  const metadataRows = buildMetadataRows({
    vessel,
    reportDate,
    reportType: 'Report Periode 2 Jam',
    reportPeriod: periodLabel,
  })
  const summaryRows = [
    ['Metric', 'Value'],
    ['Total Truck Periode', formatTruck(summary.totalTruck)],
    ['Total Discharge Periode', formatNumber(summary.totalDischarge)],
    ['Average Periode', formatNumber(summary.averageTonnage)],
  ]
  const detailRows = [
    ['Hatch', 'Truck', 'Tonnage', 'Average'],
    ...rows.map((row) => [
      row.hatch,
      formatTruck(row.totalTruck),
      formatNumber(row.totalDischarge),
      formatNumber(row.averageTonnage),
    ]),
    [],
    [
      'TOTAL',
      formatTruck(summary.totalTruck),
      formatNumber(summary.totalDischarge),
      formatNumber(summary.averageTonnage),
    ],
  ]
  const runningRows = [
    ['Metric', 'Value'],
    ['Total Cargo', formatNumber(runningPosition?.totalCargo)],
    ['Total Discharge', formatNumber(runningPosition?.totalDischarge)],
    ['Remaining Cargo', formatNumber(runningPosition?.remainingCargo)],
    ['Progress %', formatPercentage(runningPosition?.progressPercentage)],
    ['Total Truck', formatTruck(runningPosition?.totalTruck)],
    ['Average Load', formatNumber(runningPosition?.averageLoad)],
  ]
  const runningHatchRows = [
    ['Hatch', 'Total Cargo', 'Total Discharge', 'Remaining', 'Progress %', 'Total Truck', 'Average'],
    ...(runningPosition?.hatchRows || []).map((row) => [
      row.hatch,
      formatNumber(row.initialCargo),
      formatNumber(row.totalDischarge),
      formatNumber(row.remainingCargo),
      formatPercentage(row.progressPercentage),
      formatTruck(row.totalTruck),
      formatNumber(row.averageTonnage),
    ]),
  ]
  const destinationTotalDischarge = destinationSummary.reduce(
    (total, row) => total + (Number(row.totalDischarge) || 0),
    0,
  )
  const destinationTotalDt = destinationSummary.reduce(
    (total, row) => total + (Number(row.totalDt) || 0),
    0,
  )
  const destinationRows = [
    ['Destination', 'Netto', 'DT', 'Average'],
    ...destinationSummary.map((row) => [
      row.destination || '-',
      formatNumber(row.totalDischarge),
      formatTruck(row.totalDt),
      formatNumber(row.averageTonnage),
    ]),
    [],
    [
      'TOTAL',
      formatNumber(destinationTotalDischarge),
      formatTruck(destinationTotalDt),
      formatNumber(destinationTotalDt > 0 ? destinationTotalDischarge / destinationTotalDt : 0),
    ],
  ]

  writeWorkbook(`period-2-hour-report-${safeFilePart(vessel?.vesselName)}-${reportDate || getTodayLabel()}.xlsx`, [
    { name: 'Metadata', rows: metadataRows },
    { name: 'Running Position', rows: runningRows },
    { name: 'Hatch Running Position', rows: runningHatchRows },
    { name: 'Period Production', rows: summaryRows },
    { name: 'Production Per Hatch', rows: detailRows },
    { name: 'Destination Summary', rows: destinationRows },
  ])
}

export function exportInputEntriesExcel({ vessel, rows }) {
  const metadataRows = [
    ['Vessel', vessel?.vesselName || '-'],
    ['Cargo Owner', vessel?.company || '-'],
    ['Generated At', getPrintedPreviewLabel()],
    ['Total Data', rows.length],
  ]
  const detailRows = [
    [
      'Gate In Date',
      'Gate In Time',
      'Gate Out Date',
      'Gate Out Time',
      'Checker',
      'Plate No.',
      'Hatch',
      'Destination',
      'Tonnage',
      'No Surat Jalan',
      'No SJ Timbangan',
      'Barcode Receipt',
      'Notes',
    ],
    ...rows.map((row) => [
      row.gateInDate || '-',
      row.gateInTime || '-',
      row.gateOutDate || '-',
      row.gateOutTime || '-',
      row.checkerName || '-',
      row.plateNumber || '-',
      row.hatch || '-',
      row.destination || '-',
      formatNumber(row.tonnage),
      row.deliveryOrderNumber || '-',
      row.scaleTicketNumber || '-',
      row.barcodePhotoUrl || '-',
      row.notes || '-',
    ]),
  ]

  writeWorkbook(`input-monitoring-${safeFilePart(vessel?.vesselName)}-${getTodayLabel()}.xlsx`, [
    { name: 'Metadata', rows: metadataRows },
    { name: 'Input Monitoring', rows: detailRows },
  ])
}
