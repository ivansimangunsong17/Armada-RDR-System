import { Router } from 'express'
import {
  validatePasswordChangeBody,
  validateUserBody,
  validateUuidParam,
} from '../../middleware/validation.js'
import { authenticate, requireRole } from '../auth/auth.middleware.js'
import {
  changeUserPassword,
  createUserProfile,
  getProfileByUserId,
  getUsers,
  updateUserProfile,
} from './user.controller.js'

export const userRouter = Router()

userRouter.get('/:userId/profile', authenticate, validateUuidParam('userId'), getProfileByUserId)
userRouter.get('/', authenticate, getUsers)
userRouter.post('/', authenticate, requireRole('admin'), validateUserBody({ requirePassword: true }), createUserProfile)
userRouter.put('/:userId', authenticate, requireRole('admin'), validateUuidParam('userId'), validateUserBody(), updateUserProfile)
userRouter.patch('/:userId/password', authenticate, requireRole('admin'), validateUuidParam('userId'), validatePasswordChangeBody, changeUserPassword)
