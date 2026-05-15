import { useState, useEffect } from 'react'
import { productAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import {
  TrendingUp, Search, Package, Plus, Loader2,
  CheckCircle, AlertTriangle, X, DollarSign,
  Hash, Calendar, ClipboardList
} from 'lucide-react'

const EMPTY_FORM = { productId: '', quantity: '', reason: '', notes: '' }

export default function StockIn({ currentUser }) {
  const { notify } = useApp()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productSearch, setProductSearch] = useState('')

  // Log of operations done this session
  const [log, setLog] = useState([])

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

  useEffect(() => { fetchProducts() }, [])

  const filtered = products.filter(p =>
    `${p.name} ${p.description} ${p.barcode} ${p.category}`
      .toLowerCase().includes(search.toLowerCase())
  )

  const modalFiltered = products.filter(p =>
    `${p.name} ${p.barcode} ${p.category}`
      .toLowerCase().includes(productSearch.toLowerCase())
  )

  const validate = () => {
    const e = {}
    if (!form.productId) e.productId = 'Please select a product'
    const qty = parseInt(form.quantity)
    if (!form.quantity || isNaN(qty) || qty <= 0) e.quantity = 'Must be a positive number'
    if (!form.reason) e.reason = 'Please select a reason'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const qty = parseInt(form.quantity)
      await productAPI.restock(form.productId, qty)

      // Add to session log
      setLog(prev => [{
        id: Date.now(),
        productName: selectedProduct.name,
        quantity: qty,
        reason: form.reason,
        notes: form.notes,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        prevStock: selectedProduct.stock,
        newStock: selectedProduct.stock + qty,
      }, ...prev])

      notify(`✅ Added ${qty} units to "${selectedProduct.name}"`)
      setShowModal(false)
      setForm(EMPTY_FORM)
      setSelectedProduct(null)
      setProductSearch('')
      fetchProducts()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to add stock', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setForm(f => ({ ...f, productId: product._id }))
    setErrors(v => ({ ...v, productId: '' }))
    setProductSearch('')
  }

  const openModal = (product = null) => {
    setForm(EMPTY_FORM)
    setSelectedProduct(product)
    if (product) setForm(f => ({ ...f, productId: product._id }))
    setErrors({})
    setProductSearch('')
    setShowModal(true)
  }

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 5))
  const outOfStockProducts = products.filter(p => p.stock === 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)

  const REASONS = [
    { value: 'purchase', label: 'New Purchase' },
    { value: 'return', label: 'Customer Return' },
    { value: 'adjustment', label: 'Stock Adjustment' },
    { value: 'transfer', label: 'Transfer In' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Stock In</div>
          <div className="page-subtitle">Add stock to your inventory</div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={15} /> Add Stock
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: '#3b82f6' },
          { label: 'Low Stock Items', value: lowStockProducts.length, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Out of Stock', value: outOfStockProducts.length, icon: X, color: '#ef4444' },
          { label: 'Total Inventory Value', value: `₱${totalValue.toLocaleString()}`, icon: DollarSign, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              <s.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Product grid */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Select Product to Restock</div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Package size={32} /><p>No products found</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {filtered.map(p => (
                <div
                  key={p._id}
                  style={{
                    background: 'var(--bg-card2)', border: '2px solid var(--border)',
                    borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onClick={() => openModal(p)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.background = 'rgba(34,197,94,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={18} color="var(--text-muted)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Hash size={11} color="var(--text-muted)" />
                      <span style={{ fontSize: 12 }}>Stock: <strong>{p.stock}</strong></span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₱{p.price.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${p.stock === 0 ? 'badge-red' : p.stock <= (p.lowStockThreshold || 5) ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: 10 }}>
                      {p.stock === 0 ? 'Out of Stock' : p.stock <= (p.lowStockThreshold || 5) ? 'Low Stock' : 'In Stock'}
                    </span>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--accent-green)', border: 'none', fontSize: 11 }}
                      onClick={e => { e.stopPropagation(); openModal(p) }}
                    >
                      <TrendingUp size={11} /> Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session log */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClipboardList size={16} color="var(--accent)" />
            <div style={{ fontWeight: 600 }}>Today's Stock-In Log</div>
            {log.length > 0 && (
              <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>{log.length}</span>
            )}
          </div>

          {log.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              <TrendingUp size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
              No stock added yet today
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {log.map(entry => (
                <div key={entry.id} style={{
                  background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px',
                  borderLeft: '3px solid var(--accent-green)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, flex: 1, marginRight: 8 }}>{entry.productName}</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{entry.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {entry.prevStock} → <strong style={{ color: 'var(--accent-green)' }}>{entry.newStock}</strong>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.12)', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
                      +{entry.quantity}
                    </span>
                  </div>
                  {entry.notes && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{entry.notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stock In Modal ─────────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.2s ease',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Add Stock</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Increase inventory for a product</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Selected product display */}
            {selectedProduct ? (
              <div style={{
                background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10,
                padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={20} color="var(--accent-green)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {selectedProduct.category} · Current stock: <strong>{selectedProduct.stock}</strong>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedProduct(null); setForm(f => ({ ...f, productId: '' })) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              /* Product search/select */
              <div className="form-group">
                <label className="form-label">Select Product *</label>
                <div style={{ position: 'relative', marginBottom: 6 }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    style={{ paddingLeft: 32 }}
                    placeholder="Search by name or barcode..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                  {modalFiltered.slice(0, 15).map(p => (
                    <div
                      key={p._id}
                      onClick={() => handleProductSelect(p)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.1s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category} · {p.barcode}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: p.stock === 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {p.stock} in stock
                      </span>
                    </div>
                  ))}
                  {modalFiltered.length === 0 && (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No products found</div>
                  )}
                </div>
                {errors.productId && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>{errors.productId}</div>}
              </div>
            )}

            {/* Quantity & Reason */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Quantity to Add *</label>
                <input
                  className={`input${errors.quantity ? ' input-error' : ''}`}
                  type="number"
                  placeholder="e.g. 50"
                  value={form.quantity}
                  min="1"
                  autoFocus={!!selectedProduct}
                  onChange={e => { field('quantity', e.target.value); setErrors(v => ({ ...v, quantity: '' })) }}
                />
                {errors.quantity
                  ? <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.quantity}</div>
                  : selectedProduct && form.quantity > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 3 }}>
                      New total: {selectedProduct.stock + parseInt(form.quantity || 0)} units
                    </div>
                  )
                }
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select
                  className={`input${errors.reason ? ' input-error' : ''}`}
                  value={form.reason}
                  onChange={e => { field('reason', e.target.value); setErrors(v => ({ ...v, reason: '' })) }}
                >
                  <option value="">Select reason</option>
                  {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {errors.reason && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.reason}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Supplier name, batch number, PO number..."
                value={form.notes}
                onChange={e => field('notes', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', background: 'var(--accent-green)' }}
                onClick={handleRestockSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Adding...</>
                  : <><TrendingUp size={14} /> Add Stock</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  async function handleRestockSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const qty = parseInt(form.quantity)
      await productAPI.restock(form.productId, qty)

      setLog(prev => [{
        id: Date.now(),
        productName: selectedProduct.name,
        quantity: qty,
        reason: form.reason,
        notes: form.notes,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        prevStock: selectedProduct.stock,
        newStock: selectedProduct.stock + qty,
      }, ...prev])

      notify(`✅ Added ${qty} units to "${selectedProduct.name}"`)
      setShowModal(false)
      setForm(EMPTY_FORM)
      setSelectedProduct(null)
      setProductSearch('')
      fetchProducts()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to add stock', 'error')
    } finally {
      setSubmitting(false)
    }
  }
}