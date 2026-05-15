import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    barcode: { type: String, required: true, unique: true },
    category: { type: String, default: 'Uncategorized' },
    price: { type: Number, required: true, default: 0 },
    costPrice: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    unit: { type: String, default: 'pc' },
    imageUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
)

const Product = mongoose.model('Product', productSchema)
export default Product