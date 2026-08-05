import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
import { uploadBarcodeReceipt } from './storage.controller.js'
import { uploadBarcodeReceiptMiddleware } from './storage.upload.js'

export const storageRouter = Router()

storageRouter.post(
  '/barcode-receipts',
  authenticate,
  uploadBarcodeReceiptMiddleware.single('file'),
  uploadBarcodeReceipt,
)
