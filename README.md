# Inventory & POS System

A complete Point of Sale system with inventory management, built with MERN stack.

## Installation

### Quick Setup
```bash
# Install all dependencies
npm run install-all

# Start the application
npm run dev
```

### Manual Setup
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Start the application
cd .. && npm run dev
```

## Receipt Printer Setup

The system supports automatic receipt printing after successful payments.

### Quick Setup
```bash
# Run printer setup wizard
npm run setup-printer
```

### Manual Configuration

1. **Connect Printer**: Connect your thermal receipt printer via USB
2. **Browser Requirements**: Use Chrome 61+ or Edge 79+ (WebUSB support)
3. **Configure Settings**:
   - Open the app and go to Settings > Receipt tab
   - Set "Printer Connection" to "USB Printer"
   - Click "Setup USB Printer" button
   - Allow browser USB access when prompted
   - Test with "Test Print" button
   - Enable "Auto-print receipt after payment"

### Supported Printers
- Epson (Vendor ID: 0x04b8)
- Star Micronics (Vendor ID: 0x0519)
- Bixolon (Vendor ID: 0x1504)
- Generic ESC/POS compatible printers

### Troubleshooting
- **Printer not detected**: Check USB connection and power
- **WebUSB not working**: Try different USB port/cable
- **Permission denied**: Refresh page and try again
- **Alternative**: Use "Browser Print" for standard printing

## API Endpoints

### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID

### Products
- GET /api/products - Get all products
- POST /api/products - Create product
- PUT /api/products/:id - Update product
- DELETE /api/products/:id - Delete product

### Sales
- GET /api/sales - Get all sales
- POST /api/sales - Create sale
- GET /api/sales/:id - Get sale by ID

## Database

MongoDB is required. Default connection:
```
mongodb://127.0.0.1:27017/myDatabase
```

## Development

```bash
# Run both frontend and backend
npm run dev

# Run only backend
npm run dev --prefix backend

# Run only frontend
npm run dev --prefix frontend
```

## Features

- ✅ User authentication and authorization
- ✅ Product inventory management
- ✅ Point of sale interface
- ✅ Sales tracking and reporting
- ✅ Automatic receipt printing
- ✅ Cash drawer integration
- ✅ Stock management
- ✅ Refund processing
- ✅ Settings configuration

