import Sale from '../models/SaleModel.js'
import Product from '../models/ProductModel.js'
import mongoose from 'mongoose' 


// Generate unique receipt number
const generateReceiptNumber = () => {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `RCT-${datePart}-${rand}`
}

// @desc  Create a sale (POS checkout)
// @route POST /api/sales
export const createSale = async (req, res) => {
  const session = await Sale.startSession()
  session.startTransaction()
  try {
    console.log('Request body:', req.body) // Debug log
    
    const { items, discount = 0, tax = 0, amountPaid, paymentMethod, notes } = req.body
    
    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error('No items in cart')
    }
    if (!amountPaid || amountPaid <= 0) {
      throw new Error('Invalid payment amount')
    }
    if (!paymentMethod) {
      throw new Error('Payment method required')
    }
    
    // Get cashier from authenticated user (works for both Admin and Staff)
    const cashierId = req.user._id
    const cashierName = `${req.user.firstName} ${req.user.lastName}`

    console.log('Cashier:', cashierName, 'ID:', cashierId)

    // Validate stock and enrich items
    const enrichedItems = []
    for (const item of items) {
      const product = await Product.findById(item.product).session(session)
      if (!product) throw new Error(`Product ${item.product} not found`)
      if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`)

      enrichedItems.push({
        product: product._id,
        productName: product.name,
        barcode: product.barcode,
        quantity: item.quantity,
        unitPrice: product.price,
        costPrice: product.costPrice,
        subtotal: product.price * item.quantity,
      })

      // Deduct stock
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -item.quantity } },
        { session }
      )
    }

    const subtotal = enrichedItems.reduce((sum, i) => sum + i.subtotal, 0)
    const total = subtotal - (discount || 0) + (tax || 0)
    const change = amountPaid - total

    if (change < 0) throw new Error('Insufficient payment amount')

    const sale = new Sale({
      receiptNumber: generateReceiptNumber(),
      items: enrichedItems,
      subtotal,
      discount: discount || 0,
      tax: tax || 0,
      total,
      netTotal: total,
      amountPaid,
      change,
      paymentMethod,
      cashier: cashierId,
      cashierName: cashierName,
      notes: notes || '',
    })

    await sale.save({ session })
    await session.commitTransaction()
    session.endSession()

    console.log('Sale created successfully:', sale.receiptNumber)
    res.status(201).json(sale)
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    console.error('Sale error:', error.message)
    res.status(400).json({ message: error.message })
  }
}

// @desc  Get all sales (with date filter)
// @route GET /api/sales
export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, limit = 50, page = 1 } = req.query
    let query = {}

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
    }
    if (paymentMethod) query.paymentMethod = paymentMethod

    const total = await Sale.countDocuments(query)
    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('cashier', 'firstName lastName')

    res.json({ sales, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Get sale by ID
// @route GET /api/sales/:id
export const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('cashier', 'firstName lastName')
    if (sale) {
      res.json(sale)
    } else {
      res.status(404).json({ message: 'Sale not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Sales analytics dashboard data
// @route GET /api/sales/analytics
export const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query
    const now = new Date()
    let startDate = new Date()

    if (period === '7d') startDate.setDate(now.getDate() - 7)
    else if (period === '30d') startDate.setDate(now.getDate() - 30)
    else if (period === '90d') startDate.setDate(now.getDate() - 90)
    else if (period === '1y') startDate.setFullYear(now.getFullYear() - 1)

    const matchStage = { $match: { createdAt: { $gte: startDate } } }

    // Overall totals
    const [totals] = await Sale.aggregate([
      matchStage,
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $gt: ['$netTotal', null] },
                '$netTotal',
                { $subtract: ['$total', '$refundAmount'] }
              ]
            }
          },
          totalOrders: { $sum: 1 },
          avgOrderValue: {
            $avg: {
              $cond: [
                { $gt: ['$netTotal', null] },
                '$netTotal',
                { $subtract: ['$total', '$refundAmount'] }
              ]
            }
          },
        },
      },
    ])

    // Daily revenue
    const dailyRevenue = await Sale.aggregate([
      matchStage,
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: {
            $sum: {
              $cond: [
                { $gt: ['$netTotal', null] },
                '$netTotal',
                { $subtract: ['$total', '$refundAmount'] }
              ]
            }
          },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Top products by revenue
    const topProducts = await Sale.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          revenue: { $sum: '$items.subtotal' },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ])

    // Revenue by payment method
    const byPaymentMethod = await Sale.aggregate([
      matchStage,
      {
        $group: {
          _id: '$paymentMethod',
          revenue: {
            $sum: {
              $cond: [
                { $gt: ['$netTotal', null] },
                '$netTotal',
                { $subtract: ['$total', '$refundAmount'] }
              ]
            }
          },
          count: { $sum: 1 },
        },
      },
    ])

    // Category breakdown
    const byCategory = await Sale.aggregate([
      matchStage,
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
    ])

    res.json({
      totals: totals || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
      dailyRevenue,
      topProducts,
      byPaymentMethod,
      byCategory,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Get staff-specific stats (total sales, orders, products sold)
// @route GET /api/sales/staff-stats/:userId
export const getStaffStats = async (req, res) => {
  try {
    const { userId } = req.params
    
    console.log('📊 Fetching staff stats for userId:', userId)
    console.log('👤 Request user:', req.user._id, 'isAdmin:', req.user.isAdmin)
    
    // Security: Ensure staff can only see their own stats
    if (!req.user.isAdmin && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own stats.' })
    }
    
    // Convert userId to ObjectId for MongoDB
    
    const objectId = new mongoose.Types.ObjectId(userId)
    
    // Aggregation pipeline to calculate stats
    const stats = await Sale.aggregate([
      {
        $match: { 
          cashier: objectId
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          totalProducts: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ])
    
    const result = {
      totalSales: stats[0]?.totalSales || 0,
      totalOrders: stats[0]?.totalOrders || 0,
      totalProducts: stats[0]?.totalProducts || 0,
      userId: userId,
      timestamp: new Date().toISOString()
    }
    
    console.log('✅ Staff stats result:', result)
    res.json(result)
    
  } catch (error) {
    console.error('❌ Error in getStaffStats:', error)
    
    // Fallback: Manual calculation if aggregation fails
    try {
      const sales = await Sale.find({ cashier: userId })
      let totalSales = 0
      let totalOrders = sales.length
      let totalProducts = 0
      
      sales.forEach(sale => {
        totalSales += sale.total || 0
        if (sale.items) {
          sale.items.forEach(item => {
            totalProducts += item.quantity || 0
          })
        }
      })
      
      res.json({
        totalSales,
        totalOrders,
        totalProducts,
        userId: userId,
        timestamp: new Date().toISOString()
      })
    } catch (fallbackError) {
      res.status(500).json({ 
        message: error.message,
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0
      })
    }
  }
}

