import express from 'express'
import { getActiveShift, startShift, endShift, getShifts, getShiftById } from '../controllers/ShiftController.js'
import { protect } from '../middleware/AuthMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/active', getActiveShift)
router.post('/start', startShift)
router.get('/', getShifts)
router.get('/:id', getShiftById)
router.put('/:id/end', endShift)

export default router