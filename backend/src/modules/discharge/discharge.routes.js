import { Router } from 'express'
import { validateDischargeEntryBody, validateUuidParam } from '../../middleware/validation.js'
import { authenticate, requireRole } from '../auth/auth.middleware.js'
import {
  createDischargeEntryRecord,
  getAssignedVesselsForChecker,
  getDischargeEntriesForChecker,
  updateDischargeEntryRecord,
} from './discharge.controller.js'

export const dischargeRouter = Router()

dischargeRouter.get('/checker/:checkerId/assigned-vessels', authenticate, validateUuidParam('checkerId'), getAssignedVesselsForChecker)
dischargeRouter.get('/checker/:checkerId/entries', authenticate, validateUuidParam('checkerId'), getDischargeEntriesForChecker)
dischargeRouter.post('/entries', authenticate, requireRole('admin', 'checker'), validateDischargeEntryBody, createDischargeEntryRecord)
dischargeRouter.put('/entries/:entryId', authenticate, requireRole('admin', 'checker'), validateUuidParam('entryId'), validateDischargeEntryBody, updateDischargeEntryRecord)
