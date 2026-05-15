import dotenv from 'dotenv'
import connectDB from './config/db.js'
import User from './models/UsersModel.js'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns'  // ← Use import, not require

// DNS servers (optional - only if needed)
dns.setServers(['1.1.1.1', '8.8.8.8'])

// Load env AFTER imports
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const seed = async () => {
  await connectDB()
  await User.deleteMany({})
  
  const usersPath = path.join(__dirname, '../dummy-users.json')
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'))
  
  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10)
    await User.create({
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      password: hashed,
      isAdmin: user.isAdmin || false,
      isActive: true,
    })
  }
  console.log('Users seeded!')
  process.exit()
}

seed()