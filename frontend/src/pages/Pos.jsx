import { useState, useEffect, useRef, useCallback } from 'react'
import { productAPI, saleAPI, settingsAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import { printReceipt } from '../utils/ReceiptPrinter'
import PrintReceipt from '../components/PrintReceipt'
import {
  ShoppingCart, Search, Plus, Minus, X, Trash2,
  CreditCard, Banknote, Smartphone, Wallet,
  CheckCircle, Printer, RotateCcw, PauseCircle,
  PlayCircle, Barcode, ChevronLeft, ChevronRight,
  Package, AlertTriangle, Loader2
} from 'lucide-react'
import { testCashDrawer, openCashDrawer } from '../utils/CashDrawer'

const ITEMS_PER_PAGE = 10
const TAX_RATE = 0.12

const getProductImageUrl = (product) => {
  if (product?.imageUrl) return product.imageUrl
  return '/product-placeholder.svg'
}

const handleImageError = (event) => {
  event.currentTarget.onerror = null
  event.currentTarget.src = '/product-placeholder.svg'
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ total, onConfirm, onClose }) {
  const [method, setMethod] = useState('cash')
  const [cashInput, setCashInput] = useState('')
  const cashNum = parseFloat(cashInput) || 0
  const change = Math.max(0, cashNum - total)
  const canPay = method !== 'cash' || cashNum >= total
  const inputRef = useRef(null)

  useEffect(() => {
    if (method === 'cash') setTimeout(() => inputRef.current?.focus(), 50)
  }, [method])

  const methods = [
    { id: 'cash', label: 'Cash', icon: Banknote, color: '#22c55e' },
    { id: 'card', label: 'Card', icon: CreditCard, color: '#3b82f6' },
    { id: 'gcash', label: 'GCash', icon: Smartphone, color: '#3b82f6' },
    { id: 'maya', label: 'Maya', icon: Wallet, color: '#22c55e' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease',
      }}>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Process Payment</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Total due: <strong style={{ color: 'var(--accent-green)' }}>₱{total.toFixed(2)}</strong>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0' }}>
          {methods.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{
              padding: '14px 10px', borderRadius: 10,
              border: `2px solid ${method === m.id ? m.color : 'var(--border)'}`,
              background: method === m.id ? m.color + '18' : 'var(--bg-card2)',
              color: method === m.id ? m.color : 'var(--text-secondary)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13,
              transition: 'all 0.15s',
            }}>
              <m.icon size={22} />
              {m.label}
            </button>
          ))}
        </div>

        {method === 'cash' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Amount Tendered
              </label>
              <input
                ref={inputRef}
                className="input"
                type="number"
                placeholder="0.00"
                value={cashInput}
                onChange={e => setCashInput(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            {cashNum >= total && (
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                fontSize: 13, fontWeight: 600,
              }}>
                <span>Change</span>
                <span style={{ color: 'var(--accent-green)' }}>₱{change.toFixed(2)}</span>
              </div>
            )}
          </>
        )}

        {method !== 'cash' && (
          <div style={{
            textAlign: 'center', padding: '16px 0 20px',
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {method === 'card' ? '💳' : method === 'gcash' ? '📱' : '🟢'}
            </div>
            Present {method === 'card' ? 'card' : method.charAt(0).toUpperCase() + method.slice(1)} to reader
          </div>
        )}

        <button
          className="btn btn-primary"
          disabled={!canPay}
          onClick={() => onConfirm(method, cashNum, change)}
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginBottom: 8 }}
        >
          <CheckCircle size={16} /> Confirm Payment
        </button>
        <button
          className="btn btn-ghost"
          onClick={onClose}
          style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Hold Sales Modal ─────────────────────────────────────────────────────────
function HoldModal({ holds, onResume, onDelete, onClose, onHoldCurrent, hasCart }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, width: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Hold Sales</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {holds.length} sale{holds.length !== 1 ? 's' : ''} on hold
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {hasCart && (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 14 }} onClick={onHoldCurrent}>
            <PauseCircle size={14} /> Hold Current Sale
          </button>
        )}

        {holds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            No sales on hold
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {holds.map((h, i) => (
              <div key={h.id} style={{
                background: 'var(--bg-card2)', borderRadius: 10,
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Hold #{i + 1}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {h.items.length} item{h.items.length !== 1 ? 's' : ''} · ₱{h.items.reduce((s, it) => s + it.price * it.qty, 0).toFixed(2)}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => onResume(h.id)}>
                  <PlayCircle size={13} /> Resume
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onDelete(h.id)} style={{ color: 'var(--accent-red)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main POS Component ───────────────────────────────────────────────────────
export { POS }
  const { notify } = useApp()

  // User and Settings
  const [currentUser, setCurrentUser] = useState(null)
  const [settings, setSettings] = useState({})

  // Products
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)

  // Cart
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState('%')

  // Holds
  const [holds, setHolds] = useState([])
  const [showHold, setShowHold] = useState(false)

  // Modals
  const [showPay, setShowPay] = useState(false)
  const [cashOnly, setCashOnly] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const searchRef = useRef(null)

  // Load products
  useEffect(() => {
    productAPI.getAll()
      .then(r => {
        console.log('Products response:', r.data)
        const prods = Array.isArray(r.data) ? r.data : []
        setProducts(prods)
        const cats = ['All', ...new Set(prods.map(p => p.category).filter(Boolean))]
        setCategories(cats)
      })
      .catch(err => {
        console.error('Failed to load products:', err)
        notify('Failed to load products', 'error')
        setProducts([])
      })
      .finally(() => setLoadingProducts(false))
    searchRef.current?.focus()
  }, [])

  // Load user and settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsAPI.getSettings()
        const serverSettings = response.data
        const defaultSettings = {
          companyName: 'Inventory & POS System',
          companyAddress: '123 Main Street, Manila, Philippines',
          companyPhone: '+63 912 345 6789',
          receiptFooter: 'Please come again!',
          autoPrintReceipt: true,
          copiesToPrint: 1,
          paperWidth: '80mm',
          printerConnection: 'browser'
        }
        setSettings({ ...defaultSettings, ...serverSettings })
      } catch (error) {
        console.warn('Failed to load settings from server, using defaults:', error.message)
        setSettings({
          companyName: 'Inventory & POS System',
          companyAddress: '123 Main Street, Manila, Philippines',
          companyPhone: '+63 912 345 6789',
          receiptFooter: 'Please come again!',
          autoPrintReceipt: true,
          copiesToPrint: 1,
          paperWidth: '80mm',
          printerConnection: 'browser'
        })
      }
    }

    try {
      const userData = localStorage.getItem('pos_user') || sessionStorage.getItem('pos_user')
      if (userData) setCurrentUser(JSON.parse(userData))
    } catch (err) {
      console.error('Failed to load user data:', err)
    }

    loadSettings()
    searchRef.current?.focus()
  }, [])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, category])

  // Filtered + paginated products
  const filtered = products.filter(p => {
    if (!p.isActive) return false
    const matchCat = category === 'All' || p.category === category
    const q = search.toLowerCase()
    const matchSearch = p.name?.toLowerCase().includes(q) || p.barcode?.includes(q)
    return matchCat && matchSearch
  })
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Cart helpers
  const addToCart = (product) => {
    if (product.stock <= 0) { notify('Out of stock!', 'warning'); return }
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id)
      if (existing) {
        if (existing.qty >= product.stock) { notify('Max stock reached!', 'warning'); return prev }
        return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i._id !== id))

  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return }
    const prod = products.find(p => p._id === id)
    if (prod && qty > prod.stock) { notify('Exceeds available stock!', 'warning'); return }
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty } : i))
  }

  const clearCart = () => { setCart([]); setDiscount('') }

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discVal = (() => {
    const d = parseFloat(discount) || 0
    return discountType === '%' ? subtotal * (d / 100) : Math.min(d, subtotal)
  })()
  const taxable = subtotal - discVal
  const tax = taxable * TAX_RATE
  const total = taxable + tax

  const totalItems = cart.length
  const totalQty = cart.reduce((s, i) => s + i.qty, 0)

  // New Sale
  const handleNewSale = () => {
    clearCart()
    setSearch('')
    setCategory('All')
    searchRef.current?.focus()
  }

  // Hold Sale
  const handleHoldCurrent = () => {
    if (cart.length === 0) return
    const holdId = Date.now().toString()
    setHolds(prev => [...prev, { id: holdId, items: cart, discount, discountType }])
    clearCart()
    setShowHold(false)
    notify('Sale placed on hold')
  }

  const handleResume = (holdId) => {
    const hold = holds.find(h => h.id === holdId)
    if (!hold) return
    if (cart.length > 0) {
      const confirmed = window.confirm('Replace current cart with this hold?')
      if (!confirmed) return
    }
    setCart(hold.items)
    setDiscount(hold.discount)
    setDiscountType(hold.discountType)
    setHolds(prev => prev.filter(h => h.id !== holdId))
    setShowHold(false)
    notify('Sale resumed')
  }

  const handleDeleteHold = (holdId) => {
    setHolds(prev => prev.filter(h => h.id !== holdId))
    notify('Hold deleted')
  }

  // Payment confirm
  const handleConfirmPayment = async (method, amountPaid, change) => {
    setSubmitting(true)
    try {
      const payload = {
        items: cart.map(i => ({ product: i._id, quantity: i.qty })),
        discount: discVal,
        tax: tax,
        amountPaid: amountPaid,
        paymentMethod: method,
        notes: '',
      }

      console.log('Sending payload:', payload)
      const res = await saleAPI.create(payload)
      console.log('Sale response:', res.data)

      // ✅ Open cash drawer after successful payment
      openCashDrawer()

      setReceipt(res.data)
      setShowPay(false)
      clearCart()
      productAPI.getAll().then(r => setProducts(r.data || []))
      notify('Payment successful!', 'success')
    } catch (err) {
      console.error('Sale error details:', err.response?.data)
      notify(err.response?.data?.message || 'Payment failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearchKey = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const match = products.find(p => p.barcode === search.trim() && p.isActive)

      if (match) {
        addToCart(match)
        setSearch('')
        notify(`Added: ${match.name}`, 'success')
      } else {
        const barcode = search.trim()

        if (barcode === 'CASH' || barcode === 'DRAWER' || barcode === '1234567890' || barcode.length >= 8) {
          testCashDrawer()
          setSearch('')
        } else {
          notify('Product not found. Scan again.', 'warning')
        }
      }
    }
  }

  // Pagination
  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
    if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  const stats = [
    { label: 'Total Items', value: totalItems, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Total Qty', value: totalQty, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Subtotal', value: `₱${subtotal.toFixed(2)}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Total', value: `₱${total.toFixed(2)}`, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Modals */}
      {showPay && (
        <PaymentModal
          total={total}
          initialMethod={cashOnly ? 'cash' : 'cash'}
          onConfirm={handleConfirmPayment}
          onClose={() => { setShowPay(false); setCashOnly(false) }}
        />
      )}

      {/* ✅ Replaced old ReceiptModal with PrintReceipt, passing settings and currentUser */}
      {receipt && (
        <PrintReceipt
          sale={receipt}
          settings={settings}
          currentUser={currentUser}
          onClose={() => {
            setReceipt(null)
            handleNewSale()
          }}
        />
      )}

      {showHold && (
        <HoldModal
          holds={holds}
          hasCart={cart.length > 0}
          onResume={handleResume}
          onDelete={handleDeleteHold}
          onHoldCurrent={handleHoldCurrent}
          onClose={() => setShowHold(false)}
        />
      )}

      {/* ── Left Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 0 16px 16px', gap: 12 }}>

        {/* Top action bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>POS Terminal</div>
          {holds.length > 0 && (
            <span style={{
              background: 'var(--accent)', color: '#fff', fontSize: 11,
              fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            }}>{holds.length} held</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleNewSale}>
              <Plus size={13} /> New Sale
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHold(true)}
              style={{ position: 'relative' }}
            >
              <PauseCircle size={13} /> Hold Sale
              {holds.length > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: 'var(--accent-yellow)', color: '#000',
                  fontSize: 9, fontWeight: 700, width: 14, height: 14,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{holds.length}</span>
              )}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ color: 'var(--accent-red)' }}>
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              ref={searchRef}
              className="input"
              style={{ flex: 1, border: 'none', padding: 0, background: 'transparent', fontSize: 14 }}
              placeholder="Scan barcode or search product…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
            />
            <Barcode size={20} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Press Enter to scan barcode · Type to search by name or SKU
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: `1.5px solid ${category === c ? 'var(--accent)' : 'var(--border)'}`,
                background: category === c ? 'var(--accent)' : 'var(--bg-card)',
                color: category === c ? '#fff' : 'var(--text-secondary)',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {loadingProducts ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10, overflowY: 'auto', flex: 1, alignContent: 'start',
          }}>
            {paginated.map(p => (
              <div
                key={p._id}
                onClick={() => addToCart(p)}
                style={{
                  background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                  borderRadius: 10, padding: 12, cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', opacity: p.stock === 0 ? 0.4 : 1,
                  userSelect: 'none',
                }}
                onMouseEnter={e => { if (p.stock > 0) e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 8,
                  background: 'var(--bg-card2)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 8, overflow: 'hidden',
                }}>
                  <img
                    src={getProductImageUrl(p)}
                    alt={p.name}
                    onError={handleImageError}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>₱{p.price.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: p.stock <= p.lowStockThreshold ? 'var(--accent-yellow)' : 'var(--text-muted)', marginTop: 2 }}>
                  {p.stock === 0 ? '❌ Out of stock' : `Stock: ${p.stock}`}
                </div>
              </div>
            ))}
            {paginated.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <Package size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                No products found
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', flexShrink: 0 }}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
            </button>
            {pageNums().map((n, i) => (
              n === '...' ? (
                <span key={`ellipsis-${i}`} style={{ color: 'var(--text-muted)', fontSize: 13, padding: '0 4px' }}>…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${page === n ? 'var(--accent)' : 'var(--border)'}`,
                    background: page === n ? 'var(--accent)' : 'var(--bg-card)',
                    color: page === n ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
              )
            ))}
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, flexShrink: 0 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
              }}>
                <ShoppingCart size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel – Cart ── */}
      <div style={{
        width: 340, minWidth: 340, background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Cart header */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <ShoppingCart size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Current Sale</span>
          {cart.length > 0 && (
            <span style={{
              marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            }}>{totalQty}</span>
          )}
        </div>

        {/* Cart items */}
        {cart.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            <ShoppingCart size={40} style={{ opacity: 0.3 }} />
            <span>No items added yet</span>
            <span style={{ fontSize: 11 }}>Click a product to add it</span>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 60px 64px 20px',
              gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border)',
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            }}>
              <span>Item</span>
              <span style={{ textAlign: 'center' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Price</span>
              <span style={{ textAlign: 'right' }}>Total</span>
              <span />
            </div>
            {cart.map(item => (
              <div key={item._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: 'var(--bg-card2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                  }}>
                    <img
                      src={getProductImageUrl(item)}
                      alt={item.name}
                      onError={handleImageError}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>{item.name}</div>
                    {item.barcode && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.barcode}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => updateQty(item._id, item.qty - 1)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--bg-card2)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item._id, item.qty + 1)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--bg-card2)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>₱{(item.price * item.qty).toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>₱{item.price.toFixed(2)} each</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart footer */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', flexShrink: 0 }}>
          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>

          {/* Discount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>Discount</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                min="0"
                style={{ width: 80, textAlign: 'right', padding: '4px 8px', fontSize: 13 }}
              />
              <select
                className="input"
                value={discountType}
                onChange={e => setDiscountType(e.target.value)}
                style={{ width: 52, padding: '4px 6px', fontSize: 12 }}
              >
                <option value="%">%</option>
                <option value="₱">₱</option>
              </select>
            </div>
          </div>
          {discVal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, color: 'var(--accent-red)' }}>
              <span>Discount applied</span>
              <span>-₱{discVal.toFixed(2)}</span>
            </div>
          )}

          {/* Tax */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>Tax (12%)</span>
            <span>₱{tax.toFixed(2)}</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>₱{total.toFixed(2)}</span>
          </div>

          {/* Pay button */}
          <button
            className="btn btn-primary"
            disabled={cart.length === 0 || submitting}
            onClick={() => { setCashOnly(false); setShowPay(true) }}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, marginBottom: 8 }}
          >
            {submitting ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <CreditCard size={15} />}
            Pay
          </button>

          {/* Pay Cash button */}
          <button
            className="btn btn-ghost"
            disabled={cart.length === 0 || submitting}
            onClick={() => { setCashOnly(true); setShowPay(true) }}
            style={{
              width: '100%', justifyContent: 'center', padding: '10px', fontSize: 14,
              color: 'var(--accent)', borderColor: 'var(--accent)',
            }}
          >
            <Banknote size={15} /> Pay (Cash)
          </button>
        </div>
      </div>
    </div>
  )
}
