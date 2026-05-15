import User from '../models/UsersModel.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// @desc  Login
// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('🔐 Login attempt:', email)

    const user = await User.findOne({ email })
    console.log('📦 User found:', user ? 'Yes' : 'No')

    if (!user) return res.status(401).json({ message: 'Invalid email or password.' })
    if (!user.isActive) return res.status(403).json({ message: 'Account pending admin approval.' })

    const match = await bcrypt.compare(password, user.password)
    console.log('🔑 Password match:', match)

    if (!match) return res.status(401).json({ message: 'Invalid email or password.' })

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.isAdmin ? 'admin' : 'staff',
        isAdmin: user.isAdmin,
        canAddProducts: user.isAdmin || false, // Only admins can add products
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc  Register new staff (admin only)
// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password, isAdmin = false, isActive } = req.body

    const exists = await User.findOne({ $or: [{ email }, { userName }] })
    if (exists) return res.status(400).json({ message: 'Email or username already exists.' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ 
      firstName, 
      lastName, 
      userName, 
      email, 
      password: hashed, 
      isAdmin,
      role: isAdmin ? 'admin' : 'staff',
      isActive: typeof isActive === 'boolean' ? isActive : false, // default inactive for self-register
    })

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userName: user.userName,
      isAdmin: user.isAdmin,
      role: user.role || 'staff',
      isActive: user.isActive,
      createdAt: user.createdAt,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// @desc  Get current user profile
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  const user = req.user
  res.json({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    userName: user.userName,
    role: user.isAdmin ? 'admin' : 'staff',
    isAdmin: user.isAdmin,
    canAddProducts: user.isAdmin || false,
  })
}