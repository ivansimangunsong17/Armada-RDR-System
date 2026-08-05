import { Router } from 'express'
import {
  validateCheckerAssignmentBody,
  validateHatchCargoBody,
  validateStatusBody,
  validateUuidParam,
  validateVesselBody,
} from '../../middleware/validation.js'
import { authenticate, requireRole } from '../auth/auth.middleware.js'
import { getDischargeEntriesForVessel } from '../discharge/discharge.controller.js'
import {
  addVesselDestination,
  archiveVesselRecord,
  changeVesselStatus,
  deactivateVesselDestination,
  getVesselDestinations,
  getVessels,
  getVesselById,
  getVesselCheckerAssignment,
  getVesselHatchCargo,
  saveVesselCheckerAssignment,
  saveVesselHatchCargo,
  updateVesselRecord,
  createVesselRecord,
  deleteExtraVesselHatchCargo,
} from './vessel.controller.js'

export const vesselRouter = Router()

vesselRouter.get('/', authenticate, getVessels)
vesselRouter.post('/', authenticate, requireRole('admin'), validateVesselBody, createVesselRecord)
vesselRouter.put('/:vesselId', authenticate, requireRole('admin'), validateUuidParam('vesselId'), validateVesselBody, updateVesselRecord)
vesselRouter.patch('/:vesselId/status', authenticate, requireRole('admin'), validateUuidParam('vesselId'), validateStatusBody(['pending', 'active', 'completed']), changeVesselStatus)
vesselRouter.delete('/:vesselId', authenticate, requireRole('admin'), validateUuidParam('vesselId'), archiveVesselRecord)
vesselRouter.get('/:vesselId', authenticate, validateUuidParam('vesselId'), getVesselById)
vesselRouter.get('/:vesselId/destinations', authenticate, validateUuidParam('vesselId'), getVesselDestinations)
vesselRouter.post('/:vesselId/destinations', authenticate, requireRole('admin'), validateUuidParam('vesselId'), addVesselDestination)
vesselRouter.delete('/:vesselId/destinations/:destinationId', authenticate, requireRole('admin'), validateUuidParam('vesselId'), validateUuidParam('destinationId'), deactivateVesselDestination)
vesselRouter.get('/:vesselId/hatch-cargo', authenticate, validateUuidParam('vesselId'), getVesselHatchCargo)
vesselRouter.put('/:vesselId/hatch-cargo', authenticate, requireRole('admin'), validateUuidParam('vesselId'), validateHatchCargoBody, saveVesselHatchCargo)
vesselRouter.delete('/:vesselId/hatch-cargo/extra', authenticate, requireRole('admin'), validateUuidParam('vesselId'), deleteExtraVesselHatchCargo)
vesselRouter.get('/:vesselId/checker-assignment', authenticate, validateUuidParam('vesselId'), getVesselCheckerAssignment)
vesselRouter.put('/:vesselId/checker-assignment', authenticate, requireRole('admin'), validateUuidParam('vesselId'), validateCheckerAssignmentBody, saveVesselCheckerAssignment)
vesselRouter.get('/:vesselId/discharge-entries', authenticate, validateUuidParam('vesselId'), getDischargeEntriesForVessel)
