import { buildPublicUrl, toPublicUploadPath } from '../../config/storage.js'
import { createHttpError } from '../../utils/httpError.js'

export function uploadBarcodeReceipt(req, res, next) {
  try {
    if (!req.file) {
      throw createHttpError(400, 'File foto barcode wajib diupload.')
    }

    const publicPath = toPublicUploadPath(req.file.path)

    res.status(201).json({
      data: {
        path: publicPath.replace(/^\/uploads\//, ''),
        publicUrl: buildPublicUrl(req, publicPath),
      },
    })
  } catch (error) {
    next(error)
  }
}
