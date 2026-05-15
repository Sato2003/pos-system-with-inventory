import { useEffect, useRef } from 'react'
import { Printer, X, CheckCircle, ShoppingCart } from 'lucide-react'
import { printReceipt } from '../utils/ReceiptPrinter'

/**
 * PrintReceipt.jsx
 * Receipt preview modal shown after successful payment.
 * Auto-prints if settings.autoPrintReceipt is true.
 * Also allows manual print via button.
 */
export default function PrintReceipt({ sale, settings, currentUser, onClose }) {
  const hasPrinted = useRef(false)

  // Auto-print on mount if enabled
  useEffect(() => {
    if (!sale || hasPrinted.current) return
    if (settings?.autoPrintReceipt) {
      hasPrinted.current = true
      // Small delay so the modal renders first
      setTimeout(() => {
        printReceipt(sale, settings, currentUser)
      }, 400)
    }
  }, [sale, settings, currentUser])

  const handlePrint = () => {
    printReceipt(sale, settings, currentUser)
  }

  if (!sale) return null

  const peso = (n) => `₱${Number(n || 0).toFixed(2)}`

  // Store information - FALLBACK VALUES (will be overridden by settings)
  const storeName  = settings?.companyName    || settings?.storeName    || 'YOUR STORE NAME'
  const storeAddr  = settings?.companyAddress || settings?.storeAddress || 'YOUR ADDRESS'
  const storePhone = settings?.companyPhone   || settings?.storePhone   || '09123456789'
  const footerMsg  = settings?.receiptFooter  || 'Thank you for shopping!'

  // Cashier name from user object
  const cashierName = currentUser
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
      || currentUser.userName
      || currentUser.email?.split('@')[0]
      || 'Cashier'
    : (sale.cashierName || 'Cashier')

  const receiptNo  = sale.receiptNumber || (sale._id?.slice(-8).toUpperCase()) || 'N/A'
  const now        = new Date(sale.createdAt || Date.now())
  const date       = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' })
  const time       = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const items      = sale.items || []
  const discount   = sale.discount || 0
  const tax        = sale.tax || 0
  const subtotal   = sale.subtotal || items.reduce((sum, item) => sum + (item.subtotal || (item.quantity || 0) * (item.price || 0)), 0)
  const total      = sale.total || subtotal + tax - discount

  const divStyle = {
    borderTop: '1px dashed #999',
    margin: '8px 0',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0',
        borderRadius: 16, width: '100%', maxWidth: 420,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #e0e0e0',
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#e8f5e9', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={20} color="#4caf50" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#000' }}>Payment Successful</div>
              <div style={{ fontSize: 11, color: '#666' }}>
                {settings?.autoPrintReceipt ? 'Auto-printing receipt…' : 'Receipt ready to print'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Receipt Preview */}
        <div style={{ padding: '16px 20px', background: '#fff' }}>
          <div style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 11,
            background: '#fff',
            color: '#000',
            borderRadius: 8,
            padding: '16px 14px',
            border: '1px solid #ddd',
            lineHeight: 1.5,
          }}>
            {/* Store Header */}
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', marginBottom: 4, color: '#000' }}>
              {storeName}
            </div>
            {storeAddr  && <div style={{ textAlign: 'center', fontSize: 10, color: '#000', marginBottom: 2 }}>{storeAddr}</div>}
            {storePhone && <div style={{ textAlign: 'center', fontSize: 10, color: '#000', marginBottom: 6 }}>Tel: {storePhone}</div>}

            <div style={{ ...divStyle, borderTopStyle: 'solid', borderColor: '#000' }} />
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#000' }}>OFFICIAL RECEIPT</div>
            <div style={{ ...divStyle, borderTopStyle: 'solid', borderColor: '#000' }} />

            {/* Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#000' }}>
              <span>Receipt #:</span><span style={{ fontWeight: 600 }}>{receiptNo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#000' }}>
              <span>Date:</span><span>{date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#000' }}>
              <span>Time:</span><span>{time}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', fontSize: 11,
              fontWeight: 700, background: '#f0f0f0', padding: '4px 2px', marginBottom: 4, color: '#000',
            }}>
              <span>Cashier:</span><span>{cashierName}</span>
            </div>

            <div style={divStyle} />

            {/* Items Header */}
            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 4, color: '#000' }}>ITEMS</div>
            <div style={{ fontWeight: 600, fontSize: 10, marginBottom: 2, color: '#000', borderBottom: '1px dotted #000', paddingBottom: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ width: '60%' }}>Description</span>
                <span style={{ width: '15%', textAlign: 'center' }}>Qty</span>
                <span style={{ width: '25%', textAlign: 'right' }}>Amount</span>
              </div>
            </div>

            {/* Items List */}
            {items.map((item, i) => {
              const name         = item.productName || item.name || 'Item'
              const qty          = item.quantity || item.qty || 1
              const price        = item.price || 0
              const subtotalItem = item.subtotal ?? qty * price
              return (
                <div key={i} style={{ marginBottom: 6, color: '#000' }}>
                  <div style={{ fontSize: 10, fontWeight: 500, wordBreak: 'break-word' }}>{name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, paddingLeft: 4 }}>
                    <span>{qty} x {peso(price)}</span>
                    <span style={{ fontWeight: 600 }}>{peso(subtotalItem)}</span>
                  </div>
                </div>
              )
            })}

            <div style={divStyle} />

            {/* Totals */}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, color: '#000' }}>
                <span>Subtotal:</span><span>{peso(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, color: '#000' }}>
                  <span>Discount:</span><span style={{ color: '#d32f2f' }}>-{peso(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, color: '#000' }}>
                <span>VAT (12%):</span><span>{peso(tax)}</span>
              </div>
            </div>

            <div style={{ ...divStyle, borderTopStyle: 'solid', borderColor: '#000' }} />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#000' }}>
              <span>TOTAL:</span><span>{peso(total)}</span>
            </div>

            <div style={divStyle} />

            {/* Payment */}
            {sale.paymentMethod && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3, color: '#000' }}>
                <span>Payment:</span><span>{String(sale.paymentMethod || 'CASH').toUpperCase()}</span>
              </div>
            )}
            {sale.paymentMethod === 'cash' && (
              <>
                {sale.amountPaid != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, color: '#000' }}>
                    <span>Amount Paid:</span><span>{peso(sale.amountPaid)}</span>
                  </div>
                )}
                {sale.change != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2, color: '#000' }}>
                    <span>Change:</span><span>{peso(sale.change)}</span>
                  </div>
                )}
              </>
            )}

            <div style={{ ...divStyle, borderTopStyle: 'solid', borderColor: '#000', marginTop: 8 }} />

            {/* Footer */}
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 11, marginTop: 6, color: '#000' }}>{footerMsg}</div>
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 4, color: '#000' }}>Thank you for your purchase!</div>

            <div style={{ ...divStyle, borderTopStyle: 'solid', borderColor: '#000', marginTop: 6 }} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          padding: '0 20px 20px', background: '#fff',
        }}>
          <button
            onClick={handlePrint}
            style={{
              justifyContent: 'center',
              background: '#f0f0f0',
              border: '1px solid #ccc',
              color: '#000',
              padding: '10px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Printer size={14} /> Print Receipt
          </button>
          <button
            onClick={onClose}
            style={{
              justifyContent: 'center',
              background: '#4caf50',
              border: 'none',
              color: '#fff',
              padding: '10px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ShoppingCart size={14} /> New Sale
          </button>
        </div>
      </div>
    </div>
  )
}