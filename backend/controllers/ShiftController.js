import Shift from '../models/ShiftModel.js'
import Sale from '../models/SaleModel.js'

const DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5, 0.25]

const calcDenomTotal = (denoms = {}) =>
  Math.round(
    DENOMS.reduce((sum, d) => sum + (Number(denoms[d] ?? denoms[String(d)]) || 0) * d, 0)
    * 100
  ) / 100

// Convert plain object to Map for storage
const toMap = (obj) => {
  const map = new Map()
  DENOMS.forEach(d => {
    map.set(String(d), Number(obj[d] ?? obj[String(d)]) || 0)
  })
  return map
}

/**
 * Convert Map OR plain object (from toObject()) to a plain object with NUMBER keys.
 * After Mongoose .toObject(), a Map field becomes a plain object with string keys like { "1000": 2 }.
 * This normalizes everything so the frontend always gets { 1000: 2, 500: 0, ... }
 */
const fromMap = (mapOrObj) => {
  if (!mapOrObj) return {}
  const obj = {}
  if (mapOrObj instanceof Map) {
    // Real JS Map
    DENOMS.forEach(d => {
      obj[d] = Number(mapOrObj.get(String(d))) || 0
    })
  } else {
    // Plain object from toObject() — keys may be strings
    DENOMS.forEach(d => {
      obj[d] = Number(mapOrObj[d] ?? mapOrObj[String(d)]) || 0
    })
  }
  return obj
}

// @desc  Get active shift for current cashier
// @route GET /api/shifts/active
export const getActiveShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ cashier: req.user._id, status: 'open' })
      .populate('cashier', 'firstName lastName')

    if (shift) {
      const shiftObj = shift.toObject()
      shiftObj.openingDenoms = fromMap(shiftObj.openingDenoms)
      shiftObj.closingDenoms = fromMap(shiftObj.closingDenoms)
      return res.json(shiftObj)
    }
    res.json(null)
  } catch (err) {
    console.error('Error in getActiveShift:', err)
    res.status(500).json({ message: err.message })
  }
}

// @desc  Start shift
// @route POST /api/shifts/start
export const startShift = async (req, res) => {
  try {
    const existing = await Shift.findOne({ cashier: req.user._id, status: 'open' })
    if (existing) return res.status(400).json({ message: 'You already have an open shift' })

    const { openingDenoms = {}, notes = '' } = req.body
    const openingFloat = calcDenomTotal(openingDenoms)
    const openingDenomsMap = toMap(openingDenoms)

    const shift = await Shift.create({
      cashier: req.user._id,
      openingFloat,
      openingDenoms: openingDenomsMap,
      notes,
      status: 'open',
      openedAt: new Date(),
    })

    const shiftObj = shift.toObject()
    shiftObj.openingDenoms = fromMap(shiftObj.openingDenoms)
    shiftObj.closingDenoms = fromMap(shiftObj.closingDenoms)

    res.status(201).json(shiftObj)
  } catch (err) {
    console.error('Error in startShift:', err)
    res.status(400).json({ message: err.message })
  }
}

// @desc  End shift
// @route PUT /api/shifts/:id/end
export const endShift = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
    if (!shift) return res.status(404).json({ message: 'Shift not found' })
    if (shift.status === 'closed') return res.status(400).json({ message: 'Shift already closed' })
    if (shift.cashier.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ message: 'Not authorized' })

    const { closingDenoms = {}, notes = '' } = req.body

    // Calculate cash sales during this shift
    const cashSales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: shift.openedAt },
          paymentMethod: 'cash',
          cashier: shift.cashier,
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ])

    const cashSalesTotal = cashSales[0]?.total || 0
    const closingCash = calcDenomTotal(closingDenoms)
    const expectedCash = shift.openingFloat + cashSalesTotal
    const shortage = closingCash - expectedCash
    const closingDenomsMap = toMap(closingDenoms)

    shift.status = 'closed'
    shift.closedAt = new Date()
    shift.closingDenoms = closingDenomsMap
    shift.closingCash = closingCash
    shift.cashSales = cashSalesTotal
    shift.expectedCash = expectedCash
    shift.shortage = shortage
    if (notes) shift.notes = notes

    await shift.save()

    const shiftObj = shift.toObject()
    shiftObj.openingDenoms = fromMap(shiftObj.openingDenoms)
    shiftObj.closingDenoms = fromMap(shiftObj.closingDenoms)

    res.json(shiftObj)
  } catch (err) {
    console.error('Error in endShift:', err)
    res.status(400).json({ message: err.message })
  }
}

// @desc  Get all shifts (admin) or own shifts (cashier)
// @route GET /api/shifts
export const getShifts = async (req, res) => {
  try {
    const filter = req.user.isAdmin ? {} : { cashier: req.user._id }
    const shifts = await Shift.find(filter)
      .populate('cashier', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(100)

    const formattedShifts = shifts.map(shift => {
      const shiftObj = shift.toObject()
      shiftObj.openingDenoms = fromMap(shiftObj.openingDenoms)
      shiftObj.closingDenoms = fromMap(shiftObj.closingDenoms)
      return shiftObj
    })

    res.json(formattedShifts)
  } catch (err) {
    console.error('Error in getShifts:', err)
    res.status(500).json({ message: err.message })
  }
}

// @desc  Get single shift
// @route GET /api/shifts/:id
export const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id).populate('cashier', 'firstName lastName')
    if (!shift) return res.status(404).json({ message: 'Shift not found' })

    const shiftObj = shift.toObject()
    shiftObj.openingDenoms = fromMap(shiftObj.openingDenoms)
    shiftObj.closingDenoms = fromMap(shiftObj.closingDenoms)

    res.json(shiftObj)
  } catch (err) {
    console.error('Error in getShiftById:', err)
    res.status(500).json({ message: err.message })
  }
}