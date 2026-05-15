import dotenv from 'dotenv'
import dns from 'dns'
import connectDB from './config/db.js'
import User from './models/UsersModel.js'
import bcrypt from 'bcryptjs'

// DNS fix - add this at the top
dns.setServers(['1.1.1.1', '8.8.8.8'])

dotenv.config()

const check = async () => {
  await connectDB()
  
  console.log('\n--- Checking Database ---\n')
  
  // Find the admin user
  const user = await User.findOne({ email: 'admin@gmail.com' })
  
  if (user) {
    console.log('✅ User found in database!')
    console.log('📧 Email:', user.email)
    console.log('👤 Name:', user.firstName, user.lastName)
    console.log('🔘 isActive:', user.isActive)
    console.log('👑 isAdmin:', user.isAdmin)
    console.log('🔑 Password hash:', user.password.substring(0, 30) + '...')
    
    // Test the password
    const isValid = await bcrypt.compare('admin123', user.password)
    console.log('\n🔐 Password "admin123" is:', isValid ? '✅ CORRECT' : '❌ INCORRECT')
    
  } else {
    console.log('❌ User NOT found with email: admin@gmail.com')
    
    console.log('\n--- All users in database ---')
    const allUsers = await User.find({})
    
    if (allUsers.length === 0) {
      console.log('No users found at all! You need to run: node seed.js')
    } else {
      console.log(`Found ${allUsers.length} user(s):`)
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.firstName} ${u.lastName})`)
      })
    }
  }
  
  process.exit()
}

check()