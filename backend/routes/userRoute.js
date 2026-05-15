import express from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  updateMyProfile,
} from '../controllers/UserController.js'
import { protect, adminOnly } from '../middleware/AuthMiddleware.js'

const router = express.Router()

router.use(protect)

// Self-profile update (any authenticated user)
router.put('/profile/me', updateMyProfile)

// Admin routes
router.route('/').get(getUsers).post(adminOnly, createUser)
router.route('/:id').get(getUserById).put(adminOnly, updateUser)
router.put('/:id/reset-password', adminOnly, resetUserPassword)

export default router