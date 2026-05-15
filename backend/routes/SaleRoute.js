import express from 'express'
import {
  createSale,
  getSales,
  getSaleById,
  getSalesAnalytics,
  getStaffStats,  // ← ADD THIS
} from '../controllers/SaleController.js'
import { protect } from '../middleware/AuthMiddleware.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getSales).post(createSale)
router.get('/analytics', getSalesAnalytics)
router.get('/staff-stats/:userId', getStaffStats)  // ← ADD THIS LINE
router.get('/:id', getSaleById)

export default router