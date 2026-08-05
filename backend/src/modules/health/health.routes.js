import { Router } from 'express'
import { checkDatabaseConnection } from '../../config/database.js'

export const healthRouter = Router()

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'running-discharge-system-api',
  })
})

healthRouter.get('/db', async (req, res, next) => {
  try {
    const database = await checkDatabaseConnection()

    res.json({
      status: 'ok',
      database,
    })
  } catch (error) {
    next(error)
  }
})

healthRouter.get('/ready', async (req, res, next) => {
  try {
    const database = await checkDatabaseConnection()

    res.json({
      status: 'ready',
      database,
      uptime: process.uptime(),
    })
  } catch (error) {
    next(error)
  }
})
