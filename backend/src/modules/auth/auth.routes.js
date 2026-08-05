import { Router } from 'express'
import { env } from '../../config/env.js'
import { createRateLimiter } from '../../middleware/rateLimit.js'
import { validateLoginBody } from '../../middleware/validation.js'
import { getCurrentUser, login, logout } from './auth.controller.js'
import { authenticate } from './auth.middleware.js'

export const authRouter = Router()

const loginRateLimiter = createRateLimiter({
  maxRequests: env.loginRateLimitMax,
  windowMs: env.loginRateLimitWindowMs,
  message: 'Terlalu banyak percobaan login. Coba lagi nanti.',
})

authRouter.post('/login', loginRateLimiter, validateLoginBody, login)
authRouter.get('/me', authenticate, getCurrentUser)
authRouter.post('/logout', authenticate, logout)
