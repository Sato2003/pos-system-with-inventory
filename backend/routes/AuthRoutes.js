import express from 'express'
import { login, register, getMe } from '../controllers/AuthController.js'
import { protect, adminOnly } from '../middleware/AuthMiddleware.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)  // Allow self-registration for staff accounts
router.get('/me', protect, getMe)

export default router