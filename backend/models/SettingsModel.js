import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    // Company Information
    companyName: {
      type: String,
      default: 'Inventory & POS System',
      trim: true
    },
    companyEmail: {
      type: String,
      default: 'admin@possystem.com',
      trim: true,
      lowercase: true
    },
    companyPhone: {
      type: String,
      default: '+63 912 345 6789',
      trim: true
    },
    companyAddress: {
      type: String,
      default: '123 Main Street, Manila, Philippines',
      trim: true
    },

    // Tax & Pricing
    taxRate: {
      type: Number,
      default: 12,
      min: 0,
      max: 100
    },
    defaultDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    enableAutoDiscount: {
      type: Boolean,
      default: false
    },

    // Receipt Settings
    receiptHeader: {
      type: String,
      default: 'THANK YOU FOR SHOPPING!',
      trim: true
    },
    receiptFooter: {
      type: String,
      default: 'Please come again!',
      trim: true
    },
    showReceiptLogo: {
      type: Boolean,
      default: true
    },

    // Printer Settings
    printerType: {
      type: String,
      enum: ['thermal', 'dotmatrix', 'inkjet'],
      default: 'thermal'
    },
    printerConnection: {
      type: String,
      enum: ['browser', 'usb'],
      default: 'browser'
    },
    paperWidth: {
      type: String,
      enum: ['58mm', '80mm'],
      default: '58mm'
    },
    autoPrintReceipt: {
      type: Boolean,
      default: true
    },
    copiesToPrint: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },

    // System Settings
    lowStockAlert: {
      type: Boolean,
      default: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 1
    },
    dailySalesReport: {
      type: Boolean,
      default: true
    },
    emailReports: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 30,
      min: 5,
      max: 120
    },
    requirePasswordForRefund: {
      type: Boolean,
      default: true
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    compactView: {
      type: Boolean,
      default: false
    },
    cashDrawerPort: {
      type: String,
      default: 'COM1',
      trim: true
    },
    openDrawerOnPayment: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    // Ensure only one settings document exists
    collection: 'settings'
  }
)

// Static method to get the single settings document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  return settings
}

// Static method to update settings
settingsSchema.statics.updateSettings = async function(updates) {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  Object.assign(settings, updates)
  await settings.save()
  return settings
}

const Settings = mongoose.model('Settings', settingsSchema)

export default Settings