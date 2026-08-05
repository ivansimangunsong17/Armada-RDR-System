import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { getStorageRoot, publicUploadBasePath } from './config/storage.js'
import { env } from './config/env.js'
import { auditLog } from './middleware/auditLog.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { securityHeaders } from './middleware/securityHeaders.js'
import { apiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1)
  }

  app.use(securityHeaders)
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin tidak diizinkan oleh CORS.'))
    },
    credentials: true,
  }))
  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
  app.use(publicUploadBasePath, express.static(getStorageRoot()))
  app.use(auditLog)

  app.use('/api', apiRouter)
  app.use(notFound)
  app.use(errorHandler)

  return app
}
