import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { getDischargeEntriesForVessel } from './dischargeService.js'
import {
  getRunningDestinationSummary,
  getRunningReportRows,
} from './reportService.js'
import { buildRunningReportPDFBlob } from './pdfExportService.js'
import {
  buildDestinationSummaryTotal,
  buildSummary,
  buildTimedReportSummary,
} from '../utils/calculations.js'
import { formatDate, formatMT, formatPercentage, formatTruck } from '../utils/formatters.js'

function getTodayLabel() {
  return new Date().toISOString().slice(0, 10)
}

function getArchiveTimestamp() {
  return new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function safeFolderName(value) {
  return String(value || 'VESSEL')
    .trim()
    .replace(/^mv\.?\s+/i, 'MV ')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()
}

function safeFilePart(value, fallback = 'file') {
  const clean = String(value || fallback)
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return clean || fallback.toUpperCase()
}

function getPhotoExtension(url = '', contentType = '') {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'

  const match = String(url).split('?')[0].match(/\.([a-z0-9]{2,5})$/i)
  return match?.[1]?.toLowerCase() || 'jpg'
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function buildCsv(headers, rows) {
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\r\n')
}

function workbookBuffer(sheets) {
  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name)
  })

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}

function getTimeMinutes(timeValue) {
  const [hour = '0', minute = '0'] = String(timeValue || '').split(':')
  return Number(hour) * 60 + Number(minute)
}

function getShiftLabel(timeValue) {
  const minutes = getTimeMinutes(timeValue)

  if (minutes >= 8 * 60 && minutes < 16 * 60) return 'Shift 1 (08.00-16.00)'
  if (minutes >= 16 * 60) return 'Shift 2 (16.00-00.00)'
  return 'Shift 3 (00.00-08.00)'
}

function getPeriodLabel(timeValue) {
  const hour = Math.floor(getTimeMinutes(timeValue) / 60)
  const startHour = Math.floor(hour / 2) * 2
  const endHour = startHour + 2

  return `${String(startHour).padStart(2, '0')}.00-${String(endHour).padStart(2, '0')}.00`
}

function groupEntries(entries, getGroupKey) {
  const groups = new Map()

  entries.forEach((entry) => {
    const key = getGroupKey(entry)
    const current = groups.get(key) || {
      key,
      hatch: entry.hatch || '-',
      destination: entry.destination || '-',
      totalDischarge: 0,
      totalTruck: 0,
    }

    current.totalDischarge += Number(entry.tonnage) || 0
    current.totalTruck += 1
    current.averageTonnage = current.totalTruck > 0 ? current.totalDischarge / current.totalTruck : 0
    groups.set(key, current)
  })

  return Array.from(groups.values())
}

function buildShiftWorkbook(entries, vessel) {
  const groupedRows = groupEntries(entries, (entry) => [
    entry.gateOutDate || '-',
    getShiftLabel(entry.gateOutTime),
    entry.hatch || '-',
    entry.destination || '-',
  ].join('|'))
  const rows = [
    ['Vessel', vessel.vesselName || '-'],
    ['Generated At', getArchiveTimestamp()],
    [],
    ['Gate Out Date', 'Shift', 'Hatch', 'Destination', 'Total Discharge', 'Total DT', 'Average Tonnage'],
    ...groupedRows.map((row) => {
      const [gateOutDate, shiftLabel] = row.key.split('|')
      return [
        gateOutDate,
        shiftLabel,
        row.hatch,
        row.destination,
        row.totalDischarge,
        row.totalTruck,
        row.averageTonnage,
      ]
    }),
  ]
  const summary = buildTimedReportSummary(groupedRows)
  rows.push([], ['TOTAL', '', '', '', summary.totalDischarge, summary.totalTruck, summary.averageTonnage])

  return workbookBuffer([{ name: 'Shift Report', rows }])
}

function buildPeriodWorkbook(entries, vessel) {
  const groupedRows = groupEntries(entries, (entry) => [
    entry.gateOutDate || '-',
    getPeriodLabel(entry.gateOutTime),
    entry.hatch || '-',
    entry.destination || '-',
  ].join('|'))
  const rows = [
    ['Vessel', vessel.vesselName || '-'],
    ['Generated At', getArchiveTimestamp()],
    [],
    ['Gate Out Date', 'Period', 'Hatch', 'Destination', 'Total Discharge', 'Total DT', 'Average Tonnage'],
    ...groupedRows.map((row) => {
      const [gateOutDate, periodLabel] = row.key.split('|')
      return [
        gateOutDate,
        periodLabel,
        row.hatch,
        row.destination,
        row.totalDischarge,
        row.totalTruck,
        row.averageTonnage,
      ]
    }),
  ]
  const summary = buildTimedReportSummary(groupedRows)
  rows.push([], ['TOTAL', '', '', '', summary.totalDischarge, summary.totalTruck, summary.averageTonnage])

  return workbookBuffer([{ name: 'Period Report', rows }])
}

function buildRunningWorkbook({ vessel, runningRows, summary, destinationSummary }) {
  const destinationTotal = buildDestinationSummaryTotal(destinationSummary)
  return workbookBuffer([
    {
      name: 'Running Report',
      rows: [
        ['Vessel', vessel.vesselName || '-'],
        ['Destination', vessel.destination || '-'],
        ['Generated At', getArchiveTimestamp()],
        [],
        ['Metric', 'Value'],
        ['Total Cargo', summary.totalCargo],
        ['Total Discharge', summary.totalDischarge],
        ['Remaining Cargo', summary.totalRemaining],
        ['Progress %', summary.overallProgress],
        ['Total Truck', summary.totalTruck],
        ['Average Load', summary.averageLoadPerTruck],
        [],
        ['Hatch', 'Initial Cargo', 'Total Discharge', 'Remaining', 'Progress %', 'Total DT', 'Average Load'],
        ...runningRows.map((row) => [
          row.hatch,
          row.finalStowage,
          row.totalDischarge,
          row.remainingOnBoard,
          row.progressPercentage,
          row.totalTruck,
          row.averageLoad,
        ]),
      ],
    },
    {
      name: 'Destination Summary',
      rows: [
        ['Destination', 'Netto', 'DT', 'Average'],
        ...destinationSummary.map((row) => [row.destination, row.totalDischarge, row.totalDt, row.averageTonnage]),
        [],
        [destinationTotal.destination, destinationTotal.totalDischarge, destinationTotal.totalDt, destinationTotal.averageTonnage],
      ],
    },
  ])
}

async function fetchAllDischargeEntries(vesselId) {
  const pageSize = 1000
  let page = 1
  const rows = []

  while (true) {
    const result = await getDischargeEntriesForVessel(vesselId, { page, pageSize })
    if (result.error) return { data: rows, error: result.error }

    rows.push(...(result.data || []))

    if (!result.data || result.data.length < pageSize) return { data: rows, error: null }
    page += 1
  }
}

async function downloadPhotos({ entries, zip, folderName, onProgress }) {
  const entriesWithPhoto = entries.filter((entry) => entry.barcodePhotoUrl)
  const failedFiles = []
  let downloaded = 0

  onProgress?.({ stage: 'Downloading Photos...', totalPhoto: entriesWithPhoto.length, downloaded, failed: 0 })

  for (const [index, entry] of entriesWithPhoto.entries()) {
    const baseName = [
      safeFilePart(entry.plateNumber, `truck_${index + 1}`),
      safeFilePart(entry.hatch, 'hatch'),
      safeFilePart(entry.destination, 'destination'),
    ].join('_')

    try {
      const response = await fetch(entry.barcodePhotoUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const extension = getPhotoExtension(entry.barcodePhotoUrl, blob.type)
      zip.file(`${folderName}/Photos/${baseName}.${extension}`, blob)
      downloaded += 1
    } catch (error) {
      failedFiles.push(`${baseName}: ${entry.barcodePhotoUrl} (${error.message || 'download failed'})`)
    }

    onProgress?.({
      stage: 'Downloading Photos...',
      totalPhoto: entriesWithPhoto.length,
      downloaded,
      failed: failedFiles.length,
    })
  }

  return { totalPhoto: entriesWithPhoto.length, downloaded, failedFiles }
}

function buildReadme({ vessel, summary, archiveBy, archiveDate }) {
  return [
    'Archive Vessel Package',
    '',
    `Vessel Name: ${vessel.vesselName || '-'}`,
    `Cargo Owner: ${vessel.company || '-'}`,
    `Cargo Type: ${vessel.cargo || '-'}`,
    `Destination: ${vessel.destination || '-'}`,
    `Total Hatch: ${vessel.totalHatch || '-'}`,
    `Total Cargo: ${formatMT(summary.totalCargo)}`,
    `Total Discharge: ${formatMT(summary.totalDischarge)}`,
    `Total Truck: ${formatTruck(summary.totalTruck)}`,
    `Progress: ${formatPercentage(summary.overallProgress)}`,
    `Archive Date: ${archiveDate}`,
    `Archive By: ${archiveBy || '-'}`,
    '',
    'Generated by Running Discharge Report System',
  ].join('\r\n')
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function createVesselArchivePackage({ vessel, currentUser, onProgress }) {
  if (!vessel?.id) {
    return { error: new Error('Vessel tidak valid.'), stats: null }
  }

  const archiveDate = getTodayLabel()
  const archiveDateTime = getArchiveTimestamp()
  const folderName = safeFolderName(vessel.vesselName)
  const fileName = `${folderName}_${archiveDate}_Archive.zip`
  const zip = new JSZip()

  onProgress?.({ stage: 'Preparing Data...', totalPhoto: 0, downloaded: 0, failed: 0 })

  const [entriesResult, runningResult, destinationResult] = await Promise.all([
    fetchAllDischargeEntries(vessel.id),
    getRunningReportRows([vessel.id]),
    getRunningDestinationSummary(vessel.id),
  ])

  if (entriesResult.error || runningResult.error || destinationResult.error) {
    return {
      error: entriesResult.error || runningResult.error || destinationResult.error,
      stats: null,
    }
  }

  const entries = entriesResult.data || []
  const runningRows = (runningResult.data || []).filter((row) => row.vesselId === vessel.id)
  const destinationSummary = destinationResult.data || []
  const summary = buildSummary(runningRows)
  const archiveBy = currentUser?.name || currentUser?.fullName || currentUser?.email || currentUser?.username || '-'

  zip.folder(`${folderName}/Photos`)
  zip.folder(`${folderName}/Reports`)
  zip.folder(`${folderName}/Data`)

  const dischargeHeaders = [
    'gateInDate',
    'gateInTime',
    'gateOutDate',
    'gateOutTime',
    'checkerName',
    'plateNumber',
    'hatch',
    'destination',
    'tonnage',
    'deliveryOrderNumber',
    'scaleTicketNumber',
    'barcodePhotoUrl',
    'notes',
  ]
  zip.file(`${folderName}/Data/discharge_entries.csv`, buildCsv(dischargeHeaders, entries))
  zip.file(`${folderName}/Data/hatch_summary.csv`, buildCsv(
    ['hatch', 'finalStowage', 'totalDischarge', 'remainingOnBoard', 'progressPercentage', 'totalTruck', 'averageLoad'],
    runningRows,
  ))
  zip.file(`${folderName}/Data/destination_summary.csv`, buildCsv(
    ['destination', 'totalDischarge', 'totalDt', 'averageTonnage'],
    destinationSummary,
  ))
  zip.file(`${folderName}/Data/vessel_information.json`, JSON.stringify({
    vessel,
    summary,
    archive: {
      archiveDate,
      archiveDateTime,
      archiveBy,
      futureReadyFields: {
        archive_status: null,
        archived_at: null,
        archived_by: null,
      },
    },
  }, null, 2))

  const photoResult = await downloadPhotos({ entries, zip, folderName, onProgress })

  onProgress?.({
    stage: 'Generating Reports...',
    totalPhoto: photoResult.totalPhoto,
    downloaded: photoResult.downloaded,
    failed: photoResult.failedFiles.length,
  })

  const runningPdfBlob = await buildRunningReportPDFBlob({
    vessel,
    summary,
    hatchRows: runningRows,
    destinationSummary,
  })
  zip.file(`${folderName}/Reports/Running_Report.pdf`, runningPdfBlob)
  zip.file(`${folderName}/Reports/Running_Report.xlsx`, buildRunningWorkbook({
    vessel,
    runningRows,
    summary,
    destinationSummary,
  }))
  zip.file(`${folderName}/Reports/Shift_Report.xlsx`, buildShiftWorkbook(entries, vessel))
  zip.file(`${folderName}/Reports/Period_Report.xlsx`, buildPeriodWorkbook(entries, vessel))
  zip.file(`${folderName}/README.txt`, buildReadme({ vessel, summary, archiveBy, archiveDate: archiveDateTime }))

  if (photoResult.failedFiles.length > 0) {
    zip.file(`${folderName}/failed-files.txt`, photoResult.failedFiles.join('\r\n'))
  }

  onProgress?.({
    stage: 'Creating ZIP...',
    totalPhoto: photoResult.totalPhoto,
    downloaded: photoResult.downloaded,
    failed: photoResult.failedFiles.length,
  })

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipBlob, fileName)

  return {
    error: null,
    stats: {
      fileName,
      totalPhoto: photoResult.totalPhoto,
      downloaded: photoResult.downloaded,
      failed: photoResult.failedFiles.length,
    },
  }
}
