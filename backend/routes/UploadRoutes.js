import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { protect } from '../middleware/AuthMiddleware.js'

const router = express.Router()

// Ensure uploads directory exists
const uploadDir = 'uploads/products'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `product-${unique}${path.extname(file.originalname)}`)
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/
  const valid = allowed.test(file.mimetype) && allowed.test(path.extname(file.originalname).toLowerCase())
  valid ? cb(null, true) : cb(new Error('Only images allowed (jpg, png, webp)'))
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }) // 5MB

router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  const url = `/uploads/products/${req.file.filename}`
  res.json({ url })
})

export default router