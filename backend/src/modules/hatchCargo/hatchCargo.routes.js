import { Router } from 'express'
import { authenticate } from '../auth/auth.middleware.js'
import { getHatchCargo } from '../vessels/vessel.controller.js'

export const hatchCargoRouter = Router()

hatchCargoRouter.get('/', authenticate, getHatchCargo)
