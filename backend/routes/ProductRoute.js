import express from 'express'
import {
  getProducts,
  getProductByBarcode,
  getProductById,
  createProduct,
  updateProduct,
  restockProduct,
  deleteProduct,
  getInventorySummary,
} from '../controllers/ProductController.js'

const router = express.Router()

router.get('/summary', getInventorySummary)
router.get('/barcode/:barcode', getProductByBarcode)
router.route('/').get(getProducts).post(createProduct)
router.route('/:id').get(getProductById).put(updateProduct).delete(deleteProduct)
router.patch('/:id/restock', restockProduct)

export default router