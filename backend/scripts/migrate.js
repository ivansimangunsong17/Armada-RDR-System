import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { closePool, getPool } from '../src/config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.resolve(__dirname, '../db/migrations')

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `)
}

async function getAppliedMigrationIds(client) {
  const result = await client.query('select id from public.schema_migrations')
  return new Set(result.rows.map((row) => row.id))
}

async function main() {
  const client = await getPool().connect()

  try {
    await ensureMigrationTable(client)
    const applied = await getAppliedMigrationIds(client)
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort()

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Lewati migration yang sudah pernah jalan: ${file}`)
        continue
      }

      const migrationPath = path.join(migrationsDir, file)
      const sql = await readFile(migrationPath, 'utf8')

      await client.query('begin')
      try {
        await client.query(sql)
        await client.query(
          'insert into public.schema_migrations (id) values ($1)',
          [file],
        )
        await client.query('commit')
        console.log(`Migration berhasil: ${file}`)
      } catch (error) {
        await client.query('rollback')
        throw error
      }
    }
  } finally {
    client.release()
  }
}

main()
  .catch((error) => {
    console.error(error.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
