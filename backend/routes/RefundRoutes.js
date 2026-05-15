import express from 'express'
import {
  createRefund,
  getRefunds,
  getRefundById,
  getRefundAnalytics,
} from '../controllers/RefundController.js'
import { protect } from '../middleware/AuthMiddleware.js' // reuse your existing auth middleware

const router = express.Router()

// All refund routes require authentication
router.use(protect)

router.post('/',            createRefund)        // POST   /api/refunds
router.get('/',             getRefunds)          // GET    /api/refunds
router.get('/analytics',    getRefundAnalytics)  // GET    /api/refunds/analytics
router.get('/:id',          getRefundById)       // GET    /api/refunds/:id

export default router