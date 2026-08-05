import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
import { getCheckerAssignments } from '../vessels/vessel.controller.js'

export const checkerAssignmentRouter = Router()

checkerAssignmentRouter.get('/', authenticate, getCheckerAssignments)
