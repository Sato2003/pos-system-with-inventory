import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://alicawaymaryfaith_db_user:KkTy7DvJrX7s61yL@pos-system.tqzv2ae.mongodb.net/pos_inventory?retryWrites=true&w=majority'
    
    const conn = await mongoose.connect(mongoURI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
