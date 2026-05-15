import mongoose from 'mongoose'

const saleItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  barcode:     { type: String },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true, min: 0 },
  costPrice:   { type: Number, required: true, min: 0 },
  subtotal:    { type: Number, required: true, min: 0 },

  // ── Refund tracking per line-item ──────────────────────────────────────────
  refundedQty: { type: Number, default: 0, min: 0 },  // how many units refunded
})

const saleSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true },
    items:         [saleItemSchema],
    subtotal:      { type: Number, required: true, min: 0 },
    discount:      { type: Number, default: 0, min: 0 },
    tax:           { type: Number, default: 0, min: 0 },
    total:         { type: Number, required: true, min: 0 },
    netTotal:      { type: Number, default: 0, min: 0 },
    amountPaid:    { type: Number, required: true, min: 0 },
    change:        { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, enum: ['cash', 'card', 'gcash', 'maya'], required: true },
    cashier:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cashierName:   { type: String, required: true },
    notes:         { type: String, default: '' },

    // ── Refund tracking at order level ─────────────────────────────────────
    refundStatus: {
      type:    String,
      enum:    ['none', 'partial', 'full'],
      default: 'none',
    },
    refundAmount: { type: Number, default: 0, min: 0 },  // cumulative amount refunded
  },
  { timestamps: true }
)

const Sale = mongoose.model('Sale', saleSchema)
export default Sale