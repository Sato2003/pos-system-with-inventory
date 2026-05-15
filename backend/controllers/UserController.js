import User from '../models/UsersModel.js'
import bcrypt from 'bcryptjs'

// @desc Fetch all users
// @route GET /api/users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc Fetch user by ID
// @route GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (user) res.json(user)
    else res.status(404).json({ message: 'User not found' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc Create new user (admin only)
// @route POST /api/users
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password, isAdmin } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ firstName, lastName, userName, email, password: hashedPassword, isAdmin: isAdmin || false, isActive: true })
    res.status(201).json({ ...user.toObject(), password: undefined })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// @desc Update user status/role (admin only)
// @route PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { isActive, isAdmin, firstName, lastName, userName, email } = req.body
    const update = {}
    if (isActive !== undefined) update.isActive = isActive
    if (isAdmin !== undefined) update.isAdmin = isAdmin
    if (firstName !== undefined) update.firstName = firstName
    if (lastName !== undefined) update.lastName = lastName
    if (userName !== undefined) update.userName = userName
    if (email !== undefined) update.email = email

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password')
    if (user) res.json(user)
    else res.status(404).json({ message: 'User not found' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// @desc Reset user password (admin only)
// @route PUT /api/users/:id/reset-password
export const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const hashed = await bcrypt.hash(newPassword, 10)
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true }).select('-password')
    if (user) res.json({ message: 'Password reset successful' })
    else res.status(404).json({ message: 'User not found' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc Update own profile (any logged-in user)
// @route PUT /api/users/profile/me
export const updateMyProfile = async (req, res) => {
  try {
    const { firstName, lastName, userName, email, currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Update basic fields
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
    if (userName) user.userName = userName
    if (email) user.email = email

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required' })
      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })
      if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' })
      user.password = await bcrypt.hash(newPassword, 10)
    }

    await user.save()
    const { password: _, ...userOut } = user.toObject()
    res.json(userOut)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}