// utils/ReceiptPrinter.js

// ─── Cashier name helper ──────────────────────────────────────────────────────
const getCashierName = (user) => {
  if (!user) return 'STAFF'
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  if (user.userName) return user.userName
  if (user.email) return user.email.split('@')[0]
  if (user.cashierName) return user.cashierName
  return 'STAFF'
}

// ─── Internal: build receipt HTML ────────────────────────────────────────────
const buildReceiptHTML = (receipt, settings = {}, currentUser = null) => {
  const formatCurrency = (amount) => `P${(amount || 0).toFixed(2)}`

  const formatDate = () =>
    new Date().toLocaleString('en-PH', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

  const cashierName    = getCashierName(currentUser) || receipt.cashierName || 'STAFF'
  const companyName    = settings.companyName    || 'YOUR STORE NAME'
  const companyAddress = settings.companyAddress || 'YOUR ADDRESS'
  const companyPhone   = settings.companyPhone   || '09123456789'
  const receiptFooter  = settings.receiptFooter  || 'Thank you for shopping!'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <meta charset="UTF-8">
      <style>
        @page {
          size: 58mm auto;
          margin: 0;
        }

        @media print {
          html, body {
            margin: 0;
            padding: 0;
          }
        }

        * {
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 58mm;
        }

        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }

        .receipt {
          width: 58mm;
          padding: 3mm 2mm 6mm 2mm;
        }

        /* ── Typography helpers ── */
        .center  { text-align: center; }
        .right   { text-align: right; }
        .bold    { font-weight: bold; }

        /* ── Header ── */
        .store-name {
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 3px;
        }

        .store-info {
          font-size: 11px;
          text-align: center;
          line-height: 1.4;
        }

        /* ── Section titles ── */
        .receipt-title {
          font-size: 13px;
          font-weight: bold;
          text-align: center;
          margin: 5px 0 2px;
        }

        .receipt-no {
          font-size: 11px;
          text-align: center;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        /* ── Key-value rows ── */
        .row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 2px;
          width: 100%;
        }

        .row span:first-child { flex-shrink: 0; }
        .row span:last-child  { text-align: right; word-break: break-all; }

        /* ── Dividers ── */
        .divider-dash {
          border: none;
          border-top: 1px dashed #000;
          margin: 4px 0;
          width: 100%;
        }

        .divider-solid {
          border: none;
          border-top: 1px solid #000;
          margin: 4px 0;
          width: 100%;
        }

        /* ── Items table ── */
        .items-header {
          display: flex;
          font-size: 11px;
          font-weight: bold;
          border-bottom: 1px dotted #000;
          padding-bottom: 2px;
          margin-bottom: 3px;
          width: 100%;
        }

        .item-row {
          display: flex;
          font-size: 12px;
          margin-bottom: 3px;
          width: 100%;
          align-items: flex-start;
        }

        .col-name  { flex: 1; word-break: break-word; padding-right: 2px; }
        .col-qty   { width: 24px; text-align: center; flex-shrink: 0; }
        .col-price { width: 46px; text-align: right; flex-shrink: 0; }
        .col-total { width: 46px; text-align: right; flex-shrink: 0; }

        /* ── Grand total row ── */
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 15px;
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px solid #000;
          width: 100%;
        }

        /* ── Footer ── */
        .thankyou {
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          margin: 8px 0 4px;
        }

        .footer {
          text-align: center;
          font-size: 11px;
          border-top: 1px dashed #000;
          padding-top: 4px;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">

        <div class="store-name">${companyName}</div>
        <div class="store-info">${companyAddress}</div>
        <div class="store-info">Tel: ${companyPhone}</div>

        <hr class="divider-dash">

        <div class="receipt-title">SALES RECEIPT</div>
        <div class="receipt-no">${receipt.receiptNumber}</div>

        <hr class="divider-dash">

        <div class="row"><span>Date:</span><span>${formatDate()}</span></div>
        <div class="row"><span>Cashier:</span><span>${cashierName}</span></div>

        <hr class="divider-dash">

        <div class="items-header">
          <span class="col-name">ITEM</span>
          <span class="col-qty">QTY</span>
          <span class="col-price">PRICE</span>
          <span class="col-total">TOTAL</span>
        </div>

        ${receipt.items.map(item => `
          <div class="item-row">
            <span class="col-name">${item.productName}</span>
            <span class="col-qty">${item.quantity}</span>
            <span class="col-price">${formatCurrency(item.unitPrice)}</span>
            <span class="col-total">${formatCurrency(item.subtotal)}</span>
          </div>
        `).join('')}

        <hr class="divider-dash">

        <div class="row"><span>SUBTOTAL:</span><span>${formatCurrency(receipt.subtotal)}</span></div>
        ${receipt.discount > 0 ? `
          <div class="row"><span>DISCOUNT:</span><span>-${formatCurrency(receipt.discount)}</span></div>
        ` : ''}
        <div class="row"><span>VAT (12%):</span><span>${formatCurrency(receipt.tax || receipt.subtotal * 0.12)}</span></div>

        <div class="total-row">
          <span>TOTAL</span>
          <span>${formatCurrency(receipt.total)}</span>
        </div>

        <hr class="divider-solid">

        <div class="row"><span>Payment:</span><span>${receipt.paymentMethod?.toUpperCase() || 'CASH'}</span></div>
        ${receipt.paymentMethod === 'cash' && receipt.amountPaid ? `
          <div class="row"><span>Amount Paid:</span><span>${formatCurrency(receipt.amountPaid)}</span></div>
          <div class="row"><span>Change:</span><span>${formatCurrency(receipt.change)}</span></div>
        ` : ''}

        <div class="thankyou">THANK YOU!</div>
        <div class="footer">${receiptFooter}</div>

      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 1000);
          }, 100);
        }
      <\/script>
    </body>
    </html>
  `
}

// ─── Main print function (Pos.jsx + PrintReceipt.jsx) ────────────────────────
export const printReceipt = (receipt, settings = {}, currentUser = null) => {
  const html = buildReceiptHTML(receipt, settings, currentUser)
  const printWindow = window.open('', '_blank', 'width=400,height=600,toolbar=no,menubar=no')
  if (!printWindow) {
    alert('Please allow popups to print receipts. Check your browser settings.')
    return false
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  return true
}

// ─── Test print (Settings.jsx) ───────────────────────────────────────────────
export const testPrint = (settings = {}) => {
  try {
    const mockReceipt = {
      receiptNumber: 'TEST-0001',
      cashierName: 'Test Cashier',
      items: [
        { productName: 'Sample Item A', quantity: 2, unitPrice: 99.00,  subtotal: 198.00 },
        { productName: 'Sample Item B', quantity: 1, unitPrice: 49.50,  subtotal: 49.50  },
      ],
      subtotal: 247.50,
      discount: 0,
      tax: 29.70,
      total: 277.20,
      paymentMethod: 'cash',
      amountPaid: 300.00,
      change: 22.80,
    }
    const result = printReceipt(mockReceipt, settings, null)
    return {
      success: result,
      message: result
        ? 'Test receipt sent to printer.'
        : 'Popup was blocked. Please allow popups.',
    }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

// ─── Check printer status (Settings.jsx) ─────────────────────────────────────
export const checkPrinterStatus = async () => {
  if (navigator.usb) {
    try {
      const devices = await navigator.usb.getDevices()
      const printer = devices.find(
        d => d.deviceClass === 0 ||
             d.deviceSubclass === 1 ||
             d.productName?.toLowerCase().includes('printer')
      )
      if (printer) {
        return { success: true, connected: true, available: true, message: `Connected: ${printer.productName || 'USB Printer'}` }
      }
      return { success: true, connected: false, available: true, message: 'No USB printer paired. Use "Setup USB Printer".' }
    } catch (err) {
      return { success: false, connected: false, available: false, message: 'USB access denied: ' + err.message }
    }
  }
  return { success: true, connected: false, available: true, message: 'Browser print available (no USB API).' }
}

// ─── Setup USB printer via device picker (Settings.jsx) ──────────────────────
export const setupPrinter = async () => {
  if (!navigator.usb) {
    return { success: false, message: 'WebUSB not supported. Use Chrome or Edge.' }
  }
  try {
    const device = await navigator.usb.requestDevice({ filters: [] })
    return { success: true, message: `Printer paired: ${device.productName || 'USB Device'}` }
  } catch (err) {
    if (err.name === 'NotFoundError') {
      return { success: false, message: 'No device selected.' }
    }
    return { success: false, message: 'USB setup failed: ' + err.message }
  }
}

// ─── Connect USB printer (Settings.jsx) ──────────────────────────────────────
export const connectUsbPrinter = async () => {
  if (!navigator.usb) {
    return { success: false, message: 'WebUSB not supported in this browser.' }
  }
  try {
    const devices = await navigator.usb.getDevices()
    if (devices.length === 0) {
      return { success: false, message: 'No paired USB printer found. Run Setup first.' }
    }
    const device = devices[0]
    await device.open()
    if (device.configuration === null) await device.selectConfiguration(1)
    await device.claimInterface(0)
    return { success: true, message: `Connected to ${device.productName || 'USB Printer'}` }
  } catch (err) {
    return { success: false, message: 'Connection failed: ' + err.message }
  }
}

// ─── Disconnect USB printer (Settings.jsx) ───────────────────────────────────
export const disconnectUsbPrinter = async () => {
  if (!navigator.usb) {
    return { success: false, message: 'WebUSB not supported.' }
  }
  try {
    const devices = await navigator.usb.getDevices()
    if (devices.length === 0) return { success: true, message: 'No printer to disconnect.' }
    const device = devices[0]
    await device.close()
    return { success: true, message: 'Printer disconnected.' }
  } catch (err) {
    return { success: false, message: 'Disconnect failed: ' + err.message }
  }
}

// ─── Is printer currently connected (Settings.jsx) ───────────────────────────
export const isPrinterConnected = async () => {
  if (!navigator.usb) return false
  try {
    const devices = await navigator.usb.getDevices()
    return devices.length > 0
  } catch {
    return false
  }
}