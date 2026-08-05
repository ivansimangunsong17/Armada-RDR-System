import { apiClient } from './apiClient.js'

export const BARCODE_RECEIPT_BUCKET = 'truck-barcode-receipts'
export const BARCODE_UPLOAD_SETUP_ERROR =
  'Upload foto gagal. Pastikan backend storage sudah aktif dan file sesuai batas ukuran.'

export async function uploadBarcodeReceiptPhoto({
  checkerId,
  deliveryOrderNumber,
  file,
  vesselId,
}) {
  if (!file) {
    return {
      data: null,
      error: null,
    }
  }

  const formData = new FormData()
  formData.append('checkerId', checkerId)
  formData.append('deliveryOrderNumber', deliveryOrderNumber)
  formData.append('vesselId', vesselId)
  formData.append('file', file)

  const { data, error } = await apiClient.request('/storage/barcode-receipts', {
    body: formData,
    method: 'POST',
  })

  if (error) {
    return {
      data: null,
      error: new Error(error.message || BARCODE_UPLOAD_SETUP_ERROR),
    }
  }

  return {
    data: data?.data || null,
    error: null,
  }
}
