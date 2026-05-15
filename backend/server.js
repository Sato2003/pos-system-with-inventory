import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns'
import connectDB from './config/db.js'
import userRoutes from './routes/userRoute.js'
import productRoutes from './routes/ProductRoute.js'
import saleRoutes from './routes/SaleRoute.js'
import authRoutes from './routes/AuthRoutes.js'
import uploadRoutes from './routes/UploadRoutes.js'
import shiftRoutes from './routes/ShiftRoutes.js'
import refundRoutes from './routes/RefundRoutes.js'
import settingsRoutes from './routes/SettingsRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dns.setServers(['1.1.1.1', '8.8.8.8'])

dotenv.config()
connectDB()

// ✅ CREATE app FIRST
const app = express()

// ✅ THEN use middleware
app.use(cors())
app.use(express.json())

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads/products')))

// Mount upload route
app.use('/api/upload', uploadRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sales', saleRoutes)
app.use('/api/shifts', shiftRoutes)  // ← MOVE THIS HERE (after app is created)
app.use('/api/settings', settingsRoutes)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/refunds',  refundRoutes)
// Serve external product pictures

let productPicturesPath = path.join(__dirname, '../../product pictures')
if (!require('fs').existsSync(productPicturesPath)) {
  // Fallback for Render (create empty directory if needed)
  productPicturesPath = path.join(__dirname, 'uploads/products')
  console.log('📁 Using fallback product pictures path:', productPicturesPath)
}
console.log('📁 Serving product pictures from:', productPicturesPath)
app.use('/product-pictures', express.static(productPicturesPath))

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend/dist')
if (require('fs').existsSync(frontendPath)) {
  console.log('📁 Serving frontend from:', frontendPath)
  app.use(express.static(frontendPath))
} else {
  console.log('⚠️ Frontend dist folder not found, skipping static serving')
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📁 Frontend path: ${frontendPath}`)
})