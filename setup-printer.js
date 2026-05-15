#!/usr/bin/env node

/**
 * Receipt Printer Setup Script
 * Helps configure thermal receipt printers for the POS system
 */

console.log('🖨️  Receipt Printer Setup for Inventory & POS System')
console.log('================================================\n')

console.log('📋 Prerequisites:')
console.log('1. Connect your thermal receipt printer to your computer via USB')
console.log('2. Use Chrome or Edge browser (WebUSB support required)')
console.log('3. Ensure printer is powered on and ready\n')

console.log('🔧 Supported Printer Brands:')
console.log('• Epson (Vendor ID: 0x04b8)')
console.log('• Star Micronics (Vendor ID: 0x0519)')
console.log('• Bixolon (Vendor ID: 0x1504)')
console.log('• Generic ESC/POS printers\n')

console.log('⚙️  Setup Steps:')
console.log('1. Start the POS application: npm run dev')
console.log('2. Open the app in Chrome/Edge browser')
console.log('3. Go to Settings > Receipt tab')
console.log('4. Set Printer Connection to "USB Printer"')
console.log('5. Click "Setup USB Printer" button')
console.log('6. Allow browser to access the USB device when prompted')
console.log('7. Click "Test Print" to verify the connection')
console.log('8. Enable "Auto-print receipt after payment"\n')

console.log('🧪 Testing Commands:')
console.log('• npm run printer:test  - Show printer test information')
console.log('• npm run printer:setup - Show setup instructions\n')

console.log('📖 Browser Requirements:')
console.log('• Chrome 61+ or Edge 79+ (WebUSB support)')
console.log('• HTTPS connection (localhost is allowed)')
console.log('• USB permission granted to the website\n')

console.log('🔍 Troubleshooting:')
console.log('• If printer not detected: Check USB connection and power')
console.log('• If WebUSB not working: Try different USB port or cable')
console.log('• If permission denied: Refresh page and try again')
console.log('• For browser print: Set connection to "Browser Print"\n')

console.log('✅ Setup complete! Your receipt printer should now work automatically after payments.')