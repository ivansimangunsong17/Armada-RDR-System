import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from './env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.resolve(__dirname, '../..')

export const publicUploadBasePath = '/uploads'

export function getStorageRoot() {
  return path.resolve(serverRoot, env.fileStorageDir)
}

export function toPublicUploadPath(filePath) {
  const relativePath = path.relative(getStorageRoot(), filePath).split(path.sep).join('/')
  return `${publicUploadBasePath}/${relativePath}`
}

export function buildPublicUrl(req, publicPath) {
  const baseUrl = env.publicBaseUrl || `${req.protocol}://${req.get('host')}`
  return `${baseUrl}${publicPath}`
}
