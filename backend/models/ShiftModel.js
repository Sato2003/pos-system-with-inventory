import mongoose from 'mongoose'

const denominationSchema = {
  1000: { type: Number, default: 0 },
  500:  { type: Number, default: 0 },
  200:  { type: Number, default: 0 },
  100:  { type: Number, default: 0 },
  50:   { type: Number, default: 0 },
  20:   { type: Number, default: 0 },
  10:   { type: Number, default: 0 },
  5:    { type: Number, default: 0 },
  1:    { type: Number, default: 0 },
}

const shiftSchema = mongoose.Schema(
  {
    cashier:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:           { type: String, enum: ['open', 'closed'], default: 'open' },
    openedAt:         { type: Date, default: Date.now },
    closedAt:         { type: Date },
    openingFloat:     { type: Number, required: true },
    openingDenoms:    { type: Map, of: Number, default: {} },
    closingCash:      { type: Number },
    closingDenoms:    { type: Map, of: Number, default: {} },
    cashSales:        { type: Number, default: 0 },
    expectedCash:     { type: Number },
    shortage:         { type: Number },   // negative = shortage, positive = overage
    notes:            { type: String, default: '' },
  },
  { timestamps: true }
)

const Shift = mongoose.model('Shift', shiftSchema)
export default Shift