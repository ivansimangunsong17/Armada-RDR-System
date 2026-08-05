import { Router } from 'express'
import {
  validateBooleanBody,
  validateDestinationBody,
  validateUuidParam,
} from '../../middleware/validation.js'
import { authenticate, requireRole } from '../auth/auth.middleware.js'
import {
  changeDestinationStatus,
  createDestinationRecord,
  getDestinationById,
  getDestinationByName,
  getDestinations,
  resolveDestination,
  updateDestinationRecord,
} from './destination.controller.js'

export const destinationRouter = Router()

destinationRouter.get('/', authenticate, getDestinations)
destinationRouter.get('/by-name/:name', authenticate, getDestinationByName)
destinationRouter.post('/resolve', authenticate, requireRole('admin'), validateDestinationBody, resolveDestination)
destinationRouter.post('/', authenticate, requireRole('admin'), validateDestinationBody, createDestinationRecord)
destinationRouter.get('/:destinationId', authenticate, validateUuidParam('destinationId'), getDestinationById)
destinationRouter.put('/:destinationId', authenticate, requireRole('admin'), validateUuidParam('destinationId'), validateDestinationBody, updateDestinationRecord)
destinationRouter.patch('/:destinationId/status', authenticate, requireRole('admin'), validateUuidParam('destinationId'), validateBooleanBody(['isActive', 'is_active'], 'Status active'), changeDestinationStatus)
