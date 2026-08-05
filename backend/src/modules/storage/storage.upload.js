import fs from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { getStorageRoot } from '../../config/storage.js'
import { createHttpError } from '../../utils/httpError.js'

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])

function sanitizeFilePart(value) {
  return String(value || 'file')
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'file'
}

function getUploadDirectory(req) {
  return path.join(
    getStorageRoot(),
    'barcode-receipts',
    sanitizeFilePart(req.body?.vesselId),
    sanitizeFilePart(req.body?.checkerId),
    sanitizeFilePart(req.body?.deliveryOrderNumber),
  )
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const uploadDirectory = getUploadDirectory(req)

    fs.mkdir(uploadDirectory, { recursive: true }, (error) => {
      callback(error, uploadDirectory)
    })
  },
  filename(req, file, callback) {
    const extension = sanitizeFilePart(path.extname(file.originalname || '').replace(/^\./, '') || 'jpg')
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`

    callback(null, fileName)
  },
})

function fileFilter(req, file, callback) {
  if (allowedMimeTypes.has(file.mimetype)) {
    callback(null, true)
    return
  }

  callback(createHttpError(400, 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, HEIC, atau HEIF.'))
}

export const uploadBarcodeReceiptMiddleware = multer({
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  storage,
})
