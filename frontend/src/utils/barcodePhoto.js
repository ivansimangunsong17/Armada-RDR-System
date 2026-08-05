export const acceptedBarcodePhotoTypes = ['image/jpeg', 'image/png', 'image/webp']
export const maxBarcodePhotoSourceSize = 10 * 1024 * 1024
export const maxBarcodePhotoWidth = 1280
export const targetBarcodePhotoSize = 500 * 1024

const outputType = 'image/jpeg'
const outputExtension = 'jpg'
const qualitySteps = [0.82, 0.74, 0.66, 0.58, 0.5]

export function formatFileSize(size) {
  const numericSize = Number(size) || 0

  if (numericSize < 1024) return `${numericSize} B`
  if (numericSize < 1024 * 1024) return `${(numericSize / 1024).toFixed(0)} KB`

  return `${(numericSize / (1024 * 1024)).toFixed(2)} MB`
}

export function validateBarcodePhotoFile(file) {
  if (!file) return ''

  if (!acceptedBarcodePhotoTypes.includes(file.type)) {
    return 'Foto barcode harus berformat JPG, JPEG, PNG, atau WebP.'
  }

  if (file.size > maxBarcodePhotoSourceSize) {
    return `Ukuran foto barcode maksimal ${formatFileSize(maxBarcodePhotoSourceSize)} sebelum compress.`
  }

  return ''
}

function getCompressedFileName(file) {
  const baseName = String(file.name || 'barcode-receipt')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'barcode-receipt'

  return `${baseName}-compressed.${outputExtension}`
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Foto barcode tidak dapat dibaca.'))
    }
    image.src = objectUrl
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Foto barcode gagal dikompres.'))
      },
      type,
      quality,
    )
  })
}

export async function compressBarcodePhotoFile(file) {
  const validationError = validateBarcodePhotoFile(file)

  if (validationError) {
    return {
      data: null,
      error: new Error(validationError),
    }
  }

  try {
    const image = await loadImage(file)
    const scale = Math.min(1, maxBarcodePhotoWidth / image.naturalWidth)
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = width
    canvas.height = height
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    let selectedBlob = null

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, outputType, quality)
      selectedBlob = blob

      if (blob.size <= targetBarcodePhotoSize) break
    }

    const compressedFile = new File([selectedBlob], getCompressedFileName(file), {
      type: outputType,
      lastModified: Date.now(),
    })

    return {
      data: {
        file: compressedFile,
        originalName: file.name,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        width,
        height,
        targetSize: targetBarcodePhotoSize,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error,
    }
  }
}