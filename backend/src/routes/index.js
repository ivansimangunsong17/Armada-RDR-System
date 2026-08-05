import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes.js'
import { checkerAssignmentRouter } from '../modules/checkerAssignments/checkerAssignment.routes.js'
import { destinationRouter } from '../modules/destinations/destination.routes.js'
import { dischargeRouter } from '../modules/discharge/discharge.routes.js'
import { hatchCargoRouter } from '../modules/hatchCargo/hatchCargo.routes.js'
import { healthRouter } from '../modules/health/health.routes.js'
import { reportRouter } from '../modules/reports/report.routes.js'
import { storageRouter } from '../modules/storage/storage.routes.js'
import { userRouter } from '../modules/users/user.routes.js'
import { vesselRouter } from '../modules/vessels/vessel.routes.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/checker-assignments', checkerAssignmentRouter)
apiRouter.use('/destinations', destinationRouter)
apiRouter.use('/discharge', dischargeRouter)
apiRouter.use('/hatch-cargo', hatchCargoRouter)
apiRouter.use('/reports', reportRouter)
apiRouter.use('/storage', storageRouter)
apiRouter.use('/users', userRouter)
apiRouter.use('/vessels', vesselRouter)
