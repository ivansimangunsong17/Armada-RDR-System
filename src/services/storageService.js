import { supabase } from '../lib/supabaseClient.js'

export const BARCODE_RECEIPT_BUCKET = 'truck-barcode-receipts'
export const BARCODE_UPLOAD_SETUP_ERROR =
  'Upload foto gagal. Pastikan bucket truck-barcode-receipts sudah dibuat dan policy upload sudah aktif.'

function getSupabaseRequiredError() {
  return new Error(
    'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.',
  )
}

function sanitizeFilePart(value) {
  return String(value || 'file')
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export async function uploadBarcodeReceiptPhoto({
  checkerId,
  deliveryOrderNumber,
  file,
  vesselId,
}) {
  if (!supabase) {
    return {
      data: null,
      error: getSupabaseRequiredError(),
    }
  }

  if (!file) {
    return {
      data: null,
      error: null,
    }
  }

  const extension = sanitizeFilePart(file.name.split('.').pop() || 'jpg')
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`
  const filePath = [
    sanitizeFilePart(vesselId),
    sanitizeFilePart(checkerId),
    sanitizeFilePart(deliveryOrderNumber),
    fileName,
  ].join('/')

  const { error } = await supabase.storage
    .from(BARCODE_RECEIPT_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('Barcode receipt upload failed:', error)

    return {
      data: null,
      error: new Error(BARCODE_UPLOAD_SETUP_ERROR),
    }
  }

  const { data } = supabase.storage
    .from(BARCODE_RECEIPT_BUCKET)
    .getPublicUrl(filePath)

  return {
    data: {
      path: filePath,
      publicUrl: data.publicUrl,
    },
    error: null,
  }
}
