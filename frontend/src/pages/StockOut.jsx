import { useState, useEffect } from 'react'
import { productAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import {
  TrendingDown,
  Search,
  Package,
  Minus,
  Loader2,
  AlertTriangle,
  X,
  DollarSign,
  Hash,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const EMPTY_FORM = {
  productId: '',
  quantity: '',
  reason: '',
  notes: ''
}

export default function StockOut({ currentUser }) {
  const { notify } = useApp()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [stockOutHistory, setStockOutHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const fetchProducts = () => {
    setLoading(true)
    productAPI.getAll()
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : r.data?.products || []
        setProducts(data)
      })
      .catch(() => notify('Failed to load products', 'error'))
      .finally(() => setLoading(false))
  }

  const fetchStockOutHistory = async () => {
    try {
      // Fetch stock out transactions from your API
      const response = await productAPI.getStockOutHistory?.() || { data: [] }
      setStockOutHistory(response.data)
    } catch (error) {
      console.error('Failed to fetch history', error)
    }
  }

  useEffect(() => { 
    fetchProducts()
    // fetchStockOutHistory() // Uncomment when backend is ready
  }, [])

  const filtered = products.filter(p =>
    `${p.name} ${p.description} ${p.barcode} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )

  const validate = () => {
    const e = {}
    if (!form.productId) e.productId = 'Please select a product'
    if (!form.quantity || form.quantity <= 0) e.quantity = 'Quantity must be greater than 0'
    if (selectedProduct && parseInt(form.quantity) > selectedProduct.stock) {
      e.quantity = `Cannot exceed current stock (${selectedProduct.stock} units available)`
    }
    if (!form.reason.trim()) e.reason = 'Please select a reason'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ✅ FIXED: Use restock with negative quantity
  const handleSubmit = async () => {
    if (!validate()) return
    
    setSubmitting(true)
    try {
      const quantityToRemove = parseInt(form.quantity)
      await productAPI.restock(form.productId, -quantityToRemove)
      
      notify(`✅ Successfully removed ${quantityToRemove} units from ${selectedProduct?.name || 'product'}!`, 'success')
      
      setShowModal(false)
      setForm(EMPTY_FORM)
      setSelectedProduct(null)
      setErrors({})
      fetchProducts()
    } catch (err) {
      console.error('Stock out error:', err.response?.data || err)
      notify(err.response?.data?.message || 'Failed to remove stock', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setForm(f => ({ ...f, productId: product._id, quantity: '' }))
    setErrors({})
  }

  const field = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(v => ({ ...v, [key]: '' }))
  }

  const inStockProducts = products.filter(p => p.stock > 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10))

  const getReasonBadge = (reason) => {
    const reasons = {
      damaged: { label: 'Damaged', color: '#ef4444' },
      expired: { label: 'Expired', color: '#f59e0b' },
      lost: { label: 'Lost/Stolen', color: '#8b5cf6' },
      return: { label: 'Supplier Return', color: '#3b82f6' },
      adjustment: { label: 'Adjustment', color: '#06b6d4' },
      transfer: { label: 'Transfer Out', color: '#10b981' },
      other: { label: 'Other', color: '#6b7280' }
    }
    return reasons[reason] || reasons.other
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Stock Out Management</div>
          <div className="page-subtitle">Remove stock from inventory and track adjustments</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setShowHistory(!showHistory)}>
            <TrendingDown size={15} />
            {showHistory ? 'Hide History' : 'View History'}
          </button>
          <button className="btn btn-primary" onClick={() => { 
            setShowModal(true)
            setForm(EMPTY_FORM)
            setSelectedProduct(null)
            setErrors({})
          }}>
            <Minus size={15} />
            Remove Stock
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: '#3b82f6' },
          { label: 'In Stock Items', value: inStockProducts.length, icon: CheckCircle, color: '#22c55e' },
          { label: 'Low Stock Items', value: lowStockProducts.length, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Total Inventory Value', value: `₱${totalValue.toLocaleString()}`, icon: DollarSign, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 10, 
              background: s.color + '20', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: s.color, flexShrink: 0 
            }}>
              <s.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Out History */}
      {showHistory && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingDown size={16} />
            Recent Stock Out Transactions
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Product</th>
                  <th style={{ padding: '10px 8px' }}>Quantity</th>
                  <th style={{ padding: '10px 8px' }}>Reason</th>
                  <th style={{ padding: '10px 8px' }}>Notes</th>
                  <th style={{ padding: '10px 8px' }}>Staff</th>
                </tr>
              </thead>
              <tbody>
                {stockOutHistory.slice(0, 10).map((record, idx) => {
                  const reasonBadge = getReasonBadge(record.reason)
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '10px 8px' }}>{new Date(record.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 500 }}>{record.productName}</td>
                      <td style={{ padding: '10px 8px', color: '#ef4444', fontWeight: 600 }}>-{record.quantity}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          background: reasonBadge.color + '20',
                          color: reasonBadge.color,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500
                        }}>
                          {reasonBadge.label}
                        </span>
                       </td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{record.notes || '-'}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{record.staffName || 'System'}</td>
                    </tr>
                  )
                })}
                {stockOutHistory.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No stock out transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 600 }}>Inventory Items</div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              style={{ paddingLeft: 32, width: 220 }} 
              placeholder="Search products..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(p => (
              <div key={p._id} className="card" style={{
                cursor: 'pointer',
                border: `2px solid ${selectedProduct?._id === p._id ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.15s',
                opacity: p.stock === 0 ? 0.6 : 1
              }}
              onClick={() => p.stock > 0 && handleProductSelect(p)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => {
                if (selectedProduct?._id !== p._id) 
                  e.currentTarget.style.borderColor = 'var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8,
                    background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', flexShrink: 0,
                  }}>
                    <Package size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.category}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Hash size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Stock: {p.stock}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <DollarSign size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>₱{p.price.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${
                    p.stock === 0 ? 'badge-red' : 
                    p.stock <= (p.minStock || 10) ? 'badge-orange' : 
                    'badge-green'
                  }`}>
                    {p.stock === 0 ? 'Out of Stock' : 
                     p.stock <= (p.minStock || 10) ? `Low Stock (${p.stock})` : 
                     'In Stock'}
                  </span>
                  {p.stock > 0 && (
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={(e) => { 
                        e.stopPropagation()
                        handleProductSelect(p)
                        setShowModal(true)
                      }}
                    >
                      <TrendingDown size={12} />
                      Remove Stock
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
                <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <div>No products found</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Out Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Remove Stock</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Decrease inventory for a product
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setSelectedProduct(null)
                  setForm(EMPTY_FORM)
                  setErrors({})
                }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Selected Product Display */}
            {selectedProduct && (
              <div style={{
                background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8,
                padding: 16, marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 6,
                    background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}>
                    <Package size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{selectedProduct.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Current stock: <strong style={{ color: selectedProduct.stock < 10 ? '#ef4444' : 'inherit' }}>{selectedProduct.stock}</strong> units
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Price: ₱{selectedProduct.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Selection Dropdown */}
            {!selectedProduct && (
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Select Product *</label>
                <select
                  className={`input${errors.productId ? ' input-error' : ''}`}
                  value={form.productId}
                  onChange={e => {
                    const product = products.find(p => p._id === e.target.value)
                    if (product) handleProductSelect(product)
                  }}
                >
                  <option value="">Choose a product...</option>
                  {products.filter(p => p.stock > 0).map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} - Stock: {p.stock} - ₱{p.price.toFixed(2)}
                    </option>
                  ))}
                </select>
                {errors.productId && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.productId}</div>}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Quantity to Remove *</label>
                <input
                  className={`input${errors.quantity ? ' input-error' : ''}`}
                  type="number"
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={e => field('quantity', e.target.value)}
                  min="1"
                  max={selectedProduct?.stock || 999}
                  step="1"
                />
                {errors.quantity && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.quantity}</div>}
                {selectedProduct && form.quantity && parseInt(form.quantity) > selectedProduct.stock && (
                  <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>
                    ⚠️ Exceeds available stock
                  </div>
                )}
                {selectedProduct && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Available: {selectedProduct.stock} units
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select
                  className={`input${errors.reason ? ' input-error' : ''}`}
                  value={form.reason}
                  onChange={e => field('reason', e.target.value)}
                >
                  <option value="">Select reason</option>
                  <option value="damaged">🚫 Damaged Goods</option>
                  <option value="expired">⏰ Expired</option>
                  <option value="lost">🔍 Lost/Stolen</option>
                  <option value="return">🔄 Supplier Return</option>
                  <option value="adjustment">⚙️ Stock Adjustment</option>
                  <option value="transfer">📦 Transfer Out</option>
                  <option value="other">📝 Other</option>
                </select>
                {errors.reason && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.reason}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Add any additional information about this stock removal..."
                value={form.notes}
                onChange={e => field('notes', e.target.value)}
              />
            </div>

            {/* Summary Preview */}
            {selectedProduct && form.quantity && parseInt(form.quantity) > 0 && parseInt(form.quantity) <= selectedProduct.stock && (
              <div style={{
                background: 'var(--bg-card2)',
                padding: 12,
                borderRadius: 8,
                marginTop: 16,
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Value removed:</span>
                  <strong style={{ color: '#ef4444' }}>
                    ₱{(selectedProduct.price * parseInt(form.quantity)).toFixed(2)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>New stock level:</span>
                  <strong>{selectedProduct.stock - parseInt(form.quantity)} units</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
              <button 
                className="btn btn-ghost" 
                style={{ justifyContent: 'center' }} 
                onClick={() => {
                  setShowModal(false)
                  setSelectedProduct(null)
                  setForm(EMPTY_FORM)
                  setErrors({})
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ justifyContent: 'center', background: '#ef4444', borderColor: '#ef4444' }} 
                onClick={handleSubmit} 
                disabled={submitting || !selectedProduct || !form.quantity || parseInt(form.quantity) > selectedProduct?.stock}
              >
                {submitting ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Removing...</> : 'Confirm Remove Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}