export const acceptedBarcodePhotoTypes = ['image/jpeg', 'image/png', 'image/webp']
export const maxBarcodePhotoSize = 5 * 1024 * 1024

export function validateBarcodePhotoFile(file) {
  if (!file) return ''

  if (!acceptedBarcodePhotoTypes.includes(file.type)) {
    return 'Foto barcode harus berformat JPG, JPEG, PNG, atau WebP.'
  }

  if (file.size > maxBarcodePhotoSize) {
    return 'Ukuran foto barcode maksimal 5 MB.'
  }

  return ''
}
