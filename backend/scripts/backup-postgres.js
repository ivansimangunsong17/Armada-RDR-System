import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { env } from '../src/config/env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backupDir = path.resolve(__dirname, '..', env.backupDir)

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function main() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL wajib diisi sebelum menjalankan backup.')
  }

  await mkdir(backupDir, { recursive: true })
  const outputPath = path.join(backupDir, `running-discharge-${getTimestamp()}.dump`)

  await new Promise((resolve, reject) => {
    const child = spawn('pg_dump', [
      '--format=custom',
      '--no-owner',
      '--no-acl',
      '--file',
      outputPath,
      env.databaseUrl,
    ], {
      stdio: 'inherit',
      windowsHide: true,
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`pg_dump gagal dengan exit code ${code}.`))
    })
  })

  console.log(`Backup PostgreSQL berhasil dibuat: ${outputPath}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
