import mongoose from 'mongoose'

const refundItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  barcode:     { type: String },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true, min: 0 },
  subtotal:    { type: Number, required: true, min: 0 },
})

const refundSchema = new mongoose.Schema(
  {
    refundNumber: { type: String, required: true, unique: true },

    sale:          { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    receiptNumber: { type: String, required: true },

    items: [refundItemSchema],

    refundAmount: { type: Number, required: true, min: 0 },

    reason: {
      type: String,
      enum: ['Damaged', 'Expired', 'Wrong Item', 'Customer Return', 'Other'],
      required: true,
    },
    notes: { type: String, default: '' },

    adminOverride: { type: Boolean, default: false },

    processedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    processedByName: { type: String, required: true },
  },
  { timestamps: true }
)

const Refund = mongoose.model('Refund', refundSchema)
export default Refund