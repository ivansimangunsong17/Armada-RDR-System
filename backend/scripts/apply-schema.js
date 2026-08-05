import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { closePool, query } from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const schemaPath = path.resolve(__dirname, '../db/schema.postgres.sql')

async function main() {
  const sql = await readFile(schemaPath, 'utf8')
  await query(sql)
  console.log(`Schema PostgreSQL berhasil dijalankan: ${schemaPath}`)
}

main()
  .catch((error) => {
    console.error(error.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
