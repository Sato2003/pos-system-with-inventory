import Product from '../models/ProductModel.js'

// @desc  Get all products
// @route GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { category, lowStock, search } = req.query
    let query = { isActive: true }
    if (category) query.category = category
    if (search) query.name = { $regex: search, $options: 'i' }
    const products = await Product.find(query).sort({ name: 1 })

    if (lowStock === 'true') {
      const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold)
      return res.json(lowStockItems)
    }
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Get product by barcode
// @route GET /api/products/barcode/:barcode
export const getProductByBarcode = async (req, res) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode, isActive: true })
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: 'Product not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Get product by ID
// @route GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: 'Product not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Create a product
// @route POST /api/products
export const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body)
    const created = await product.save()
    res.status(201).json(created)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// @desc  Update product
// @route PUT /api/products/:id
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: 'Product not found' })
    }
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// @desc  Restock product
// @route PATCH /api/products/:id/restock
export const restockProduct = async (req, res) => {
  try {
    const { quantity } = req.body
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: quantity } },
      { new: true }
    )
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: 'Product not found' })
    }
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// @desc  Delete (deactivate) product
// @route DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (product) {
      res.json({ message: 'Product removed' })
    } else {
      res.status(404).json({ message: 'Product not found' })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Get inventory summary
// @route GET /api/products/summary
export const getInventorySummary = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
    const totalProducts = products.length
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold)
    const outOfStock = products.filter(p => p.stock === 0)
    const categories = [...new Set(products.map(p => p.category))]
    res.json({ totalProducts, totalValue, lowStockCount: lowStockItems.length, outOfStockCount: outOfStock.length, categoryCount: categories.length })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}