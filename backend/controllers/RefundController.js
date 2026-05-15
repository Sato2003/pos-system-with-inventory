import Refund from '../models/RefundModel.js'
import Sale from '../models/SaleModel.js'
import Product from '../models/ProductModel.js'

// ─── POST /api/refunds ────────────────────────────────────────────────────────
export const createRefund = async (req, res) => {
  try {
    const { saleId, items, reason, notes, adminOverride } = req.body

    if (!saleId || !items?.length || !reason) {
      return res.status(400).json({ message: 'saleId, items, and reason are required' })
    }

    // ── Load original sale ───────────────────────────────────────────────────
    const sale = await Sale.findById(saleId)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })

    // ── 30-day window check ──────────────────────────────────────────────────
    const daysSinceSale = (Date.now() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const isAdmin = req.user?.isAdmin === true

    if (daysSinceSale > 30 && !isAdmin) {
      return res.status(403).json({ message: 'Refund window (30 days) has expired. Contact an admin.' })
    }
    if (daysSinceSale > 30 && isAdmin && !adminOverride) {
      return res.status(403).json({ message: 'This sale is outside the 30-day window. Set adminOverride=true to proceed.' })
    }

    // ── Validate each refund item against the original sale ──────────────────
    const originalTotal = sale.total || 0
    let refundAmount = 0
    const validatedItems = []

    for (const ri of items) {
      const saleItem = sale.items.find(si => si.product.toString() === ri.productId)
      if (!saleItem) {
        return res.status(400).json({ message: `Product ${ri.productId} not found in original sale` })
      }

      const alreadyRefunded = saleItem.refundedQty || 0
      const available = saleItem.quantity - alreadyRefunded

      if (ri.quantity > available) {
        return res.status(400).json({
          message: `Cannot refund ${ri.quantity} of "${saleItem.productName}". Only ${available} unit(s) available for refund.`,
        })
      }

      const itemSubtotal = saleItem.unitPrice * ri.quantity
      refundAmount += itemSubtotal

      validatedItems.push({
        product: saleItem.product,
        productName: saleItem.productName,
        barcode: saleItem.barcode,
        quantity: ri.quantity,
        unitPrice: saleItem.unitPrice,
        subtotal: itemSubtotal,
      })
    }

    // ── Staff display name from firstName + lastName ─────────────────────────
    const staffName = `${req.user.firstName} ${req.user.lastName}`.trim()

    // ✅ GENERATE REFUND NUMBER
    const refundCount = await Refund.countDocuments()
    const refundNumber = `REF-${String(refundCount + 1).padStart(6, '0')}`

    // ── Create the refund document ───────────────────────────────────────────
    const refund = await Refund.create({
      refundNumber,
      sale: sale._id,
      receiptNumber: sale.receiptNumber,
      items: validatedItems,
      refundAmount,
      reason,
      notes: notes || '',
      adminOverride: isAdmin ? !!adminOverride : false,
      processedBy: req.user._id,
      processedByName: staffName,
    })

    // ── Update saleItem.refundedQty ──────────────────────────────────────────
    for (const ri of items) {
      const saleItem = sale.items.find(si => si.product.toString() === ri.productId)
      saleItem.refundedQty = (saleItem.refundedQty || 0) + ri.quantity
    }

    sale.refundAmount = (sale.refundAmount || 0) + refundAmount
    sale.netTotal = Math.max(0, originalTotal - sale.refundAmount)

    // Determine overall refund status
    const allFullyRefunded = sale.items.every(si => (si.refundedQty || 0) >= si.quantity)
    sale.refundStatus = allFullyRefunded ? 'full' : 'partial'

    await sale.save()

    // ── Restore stock ────────────────────────────────────────────────────────
    for (const ri of validatedItems) {
      await Product.findByIdAndUpdate(ri.product, { $inc: { stock: ri.quantity } })
    }

    res.status(201).json(refund)
  } catch (err) {
    console.error('createRefund error:', err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

// ─── GET /api/refunds ─────────────────────────────────────────────────────────
export const getRefunds = async (req, res) => {
  try {
    const isAdmin = req.user?.isAdmin === true
    const query = isAdmin ? {} : { processedBy: req.user._id }

    const { startDate, endDate, reason, page = 1, limit = 20 } = req.query

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
    }
    if (reason) query.reason = reason

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const total = await Refund.countDocuments(query)
    const pages = Math.ceil(total / parseInt(limit))

    const refunds = await Refund.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sale', 'receiptNumber total')

    res.json({ refunds, total, pages, page: parseInt(page) })
  } catch (err) {
    console.error('getRefunds error:', err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

// ─── GET /api/refunds/:id ─────────────────────────────────────────────────────
export const getRefundById = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('sale', 'receiptNumber total cashierName')
    if (!refund) return res.status(404).json({ message: 'Refund not found' })

    const isAdmin = req.user?.isAdmin === true
    if (!isAdmin && refund.processedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(refund)
  } catch (err) {
    console.error('getRefundById error:', err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
}

// ─── GET /api/refunds/analytics ───────────────────────────────────────────────
export const getRefundAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query
    const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [totals, byReason] = await Promise.all([
      Refund.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: null, totalAmount: { $sum: '$refundAmount' }, count: { $sum: 1 } } },
      ]),
      Refund.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$reason', amount: { $sum: '$refundAmount' }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
      ]),
    ])

    res.json({
      totalRefundAmount: totals[0]?.totalAmount || 0,
      totalRefundCount: totals[0]?.count || 0,
      byReason,
    })
  } catch (err) {
    console.error('getRefundAnalytics error:', err)
    res.status(500).json({ message: err.message || 'Server error' })
  }
}