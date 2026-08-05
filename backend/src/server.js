import { createApp } from './app.js'
import { closePool } from './config/database.js'
import { assertProductionEnv, env } from './config/env.js'

assertProductionEnv()
const app = createApp()

const server = app.listen(env.port, () => {
  console.log(`API server berjalan di http://localhost:${env.port}`)
})

async function shutdown(signal) {
  console.log(`${signal} diterima. Menutup API server...`)

  server.close(async () => {
    await closePool()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
