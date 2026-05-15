import Settings from '../models/SettingsModel.js'

// ─── Get Settings ────────────────────────────────────────────────────────────
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings()
    res.status(200).json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ message: 'Failed to get settings', error: error.message })
  }
}

// ─── Update Settings ─────────────────────────────────────────────────────────
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body

    // Validate tax rate
    if (updates.taxRate !== undefined && (updates.taxRate < 0 || updates.taxRate > 100)) {
      return res.status(400).json({ message: 'Tax rate must be between 0 and 100' })
    }

    // Validate discount
    if (updates.defaultDiscount !== undefined && (updates.defaultDiscount < 0 || updates.defaultDiscount > 100)) {
      return res.status(400).json({ message: 'Default discount must be between 0 and 100' })
    }

    // Validate copies
    if (updates.copiesToPrint !== undefined && (updates.copiesToPrint < 1 || updates.copiesToPrint > 5)) {
      return res.status(400).json({ message: 'Copies to print must be between 1 and 5' })
    }

    // Validate low stock threshold
    if (updates.lowStockThreshold !== undefined && updates.lowStockThreshold < 1) {
      return res.status(400).json({ message: 'Low stock threshold must be at least 1' })
    }

    // Validate session timeout
    if (updates.sessionTimeout !== undefined && (updates.sessionTimeout < 5 || updates.sessionTimeout > 120)) {
      return res.status(400).json({ message: 'Session timeout must be between 5 and 120 minutes' })
    }

    const settings = await Settings.updateSettings(updates)
    res.status(200).json(settings)
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ message: 'Failed to update settings', error: error.message })
  }
}

// ─── Reset Settings to Default ───────────────────────────────────────────────
export const resetSettings = async (req, res) => {
  try {
    const defaultSettings = {
      companyName: 'Inventory & POS System',
      companyEmail: 'admin@possystem.com',
      companyPhone: '+63 912 345 6789',
      companyAddress: '123 Main Street, Manila, Philippines',
      taxRate: 12,
      defaultDiscount: 0,
      enableAutoDiscount: false,
      receiptHeader: 'THANK YOU FOR SHOPPING!',
      receiptFooter: 'Please come again!',
      showReceiptLogo: true,
      lowStockAlert: true,
      lowStockThreshold: 10,
      dailySalesReport: true,
      emailReports: false,
      printerType: 'thermal',
      printerConnection: 'browser',
      paperWidth: '58mm',
      autoPrintReceipt: true,
      copiesToPrint: 1,
      sessionTimeout: 30,
      requirePasswordForRefund: true,
      twoFactorAuth: false,
      theme: 'dark',
      compactView: false,
      cashDrawerPort: 'COM1',
      openDrawerOnPayment: true
    }

    const settings = await Settings.updateSettings(defaultSettings)
    res.status(200).json(settings)
  } catch (error) {
    console.error('Reset settings error:', error)
    res.status(500).json({ message: 'Failed to reset settings', error: error.message })
  }
}