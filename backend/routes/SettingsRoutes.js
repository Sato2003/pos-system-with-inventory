import express from 'express'
import { getSettings, updateSettings, resetSettings } from '../controllers/SettingsController.js'
import { protect, adminOnly } from '../middleware/AuthMiddleware.js'

const router = express.Router()

// All settings routes require authentication
router.use(protect)

// Get settings (any authenticated user can view)
router.get('/', getSettings)

// Update settings (admin only)
router.put('/', adminOnly, updateSettings)

// Reset settings to default (admin only)
router.post('/reset', adminOnly, resetSettings)

export default router