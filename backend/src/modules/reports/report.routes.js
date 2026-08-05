import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
import {
  getActiveVessels,
  getDashboardDataset,
  getPeriodTwoHourReport,
  getRunningDestinationSummary,
  getRunningReport,
  getShiftReport,
  getTruckDurationReport,
} from './report.controller.js'

export const reportRouter = Router()

reportRouter.get('/active-vessels', authenticate, getActiveVessels)
reportRouter.get('/dashboard', authenticate, getDashboardDataset)
reportRouter.get('/running', authenticate, getRunningReport)
reportRouter.get('/running-destination-summary', authenticate, getRunningDestinationSummary)
reportRouter.get('/shift', authenticate, getShiftReport)
reportRouter.get('/period-two-hour', authenticate, getPeriodTwoHourReport)
reportRouter.get('/truck-duration', authenticate, getTruckDurationReport)
