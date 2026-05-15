import { useState, useEffect } from 'react'
import { productAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import {
  Package, Plus, Search, Edit, Trash2, Loader2,
  AlertTriangle, CheckCircle, X, DollarSign, Hash,
  Barcode, TrendingUp, TrendingDown
} from 'lucide-react'
import ImageUpload from '../components/ImageUpload'

const EMPTY_FORM = {
  name: '', description: '', price: '', costPrice: '',
  stock: '', barcode: '', category: '', minStock: '5', imageUrl: ''  // ← Added imageUrl
}

const EMPTY_RESTOCK = { quantity: '', reason: '', notes: '' }

export default function Products({ currentUser }) {
  const { notify } = useApp()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Product modal
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // ── Restock modal ──────────────────────────────────────────────────────────
  const [showRestock, setShowRestock] = useState(false)
  const [restockProduct, setRestockProduct] = useState(null)
  const [restockForm, setRestockForm] = useState(EMPTY_RESTOCK)
  const [restockErrors, setRestockErrors] = useState({})
  const [restockSubmitting, setRestockSubmitting] = useState(false)

  const isAdmin = currentUser?.isAdmin

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
    `${p.name} ${p.description} ${p.barcode} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )

  // ── Product form ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.price || form.price <= 0) e.price = 'Must be > 0'
    if (form.stock === '' || form.stock < 0) e.stock = 'Must be >= 0'
    if (!form.barcode.trim()) e.barcode = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        costPrice: parseFloat(form.costPrice) || 0,
        stock: parseInt(form.stock),
        lowStockThreshold: parseInt(form.minStock) || 5,
        imageUrl: form.imageUrl || '',  // ← Include imageUrl
      }
      if (editingProduct) {
        await productAPI.update(editingProduct._id, data)
        notify('Product updated successfully!')
      } else {
        await productAPI.create(data)
        notify('Product created successfully!')
      }
      setShowModal(false)
      setEditingProduct(null)
      setForm(EMPTY_FORM)
      fetchProducts()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      costPrice: (product.costPrice || 0).toString(),
      stock: product.stock.toString(),
      barcode: product.barcode,
      category: product.category || '',
      minStock: (product.lowStockThreshold || 5).toString(),
      imageUrl: product.imageUrl || '',  // ← Add imageUrl
    })
    setShowModal(true)
    setErrors({})
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return
    try {
      await productAPI.delete(product._id)
      notify('Product deleted successfully!')
      fetchProducts()
    } catch {
      notify('Failed to delete product', 'error')
    }
  }

  // ── Restock handlers ───────────────────────────────────────────────────────
  const openRestock = (product) => {
    setRestockProduct(product)
    setRestockForm(EMPTY_RESTOCK)
    setRestockErrors({})
    setShowRestock(true)
  }

  const validateRestock = () => {
    const e = {}
    const qty = parseInt(restockForm.quantity)
    if (!restockForm.quantity || isNaN(qty) || qty <= 0) e.quantity = 'Must be a positive number'
    if (!restockForm.reason) e.reason = 'Required'
    setRestockErrors(e)
    return Object.keys(e).length === 0
  }

  const handleRestockSubmit = async () => {
    if (!validateRestock()) return
    setRestockSubmitting(true)
    try {
      const qty = parseInt(restockForm.quantity)
      await productAPI.restock(restockProduct._id, qty)
      notify(`✅ Added ${qty} units to "${restockProduct.name}"`)
      setShowRestock(false)
      setRestockProduct(null)
      setRestockForm(EMPTY_RESTOCK)
      fetchProducts()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to restock product', 'error')
    } finally {
      setRestockSubmitting(false)
    }
  }

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const restockField = (key, value) => setRestockForm(f => ({ ...f, [key]: value }))

  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockThreshold || 5))
  const outOfStockProducts = products.filter(p => p.stock === 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Product Management</div>
          <div className="page-subtitle">Manage your inventory and product catalog</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditingProduct(null); setForm(EMPTY_FORM); setErrors({}) }}>
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: '#3b82f6' },
          { label: 'Low Stock', value: lowStockProducts.length, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Out of Stock', value: outOfStockProducts.length, icon: X, color: '#ef4444' },
          { label: 'In Stock', value: products.filter(p => p.stock > (p.lowStockThreshold || 5)).length, icon: CheckCircle, color: '#22c55e' },
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

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 600 }}>All Products</div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Barcode</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Category</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No products found</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id}>
                  <td style={{ width: 50 }}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Package size={18} />
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.description}</div>}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                    <Barcode size={12} style={{ marginRight: 4 }} />{p.barcode}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 500 }}>₱{p.price.toFixed(2)}</span>
                    </div>
                    {p.costPrice > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cost: ₱{p.costPrice.toFixed(2)}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Hash size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 500 }}>{p.stock}</span>
                      {p.stock <= (p.lowStockThreshold || 5) && p.stock > 0 && (
                        <span className="badge badge-orange" style={{ fontSize: 10 }}>Low</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {p.stock === 0
                      ? <span className="badge badge-red">Out of Stock</span>
                      : p.stock <= (p.lowStockThreshold || 5)
                        ? <span className="badge badge-orange">Low Stock</span>
                        : <span className="badge badge-green">In Stock</span>
                    }
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{p.category || 'Uncategorized'}</td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => handleEdit(p)}>
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Restock"
                          onClick={() => openRestock(p)}
                          style={{ color: 'var(--accent-green)' }}
                        >
                          <TrendingUp size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Delete"
                          onClick={() => handleDelete(p)}
                          style={{ color: 'var(--accent-red)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Restock Modal ──────────────────────────────────────────────────────── */}
      {showRestock && restockProduct && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Restock Product</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Add units to inventory</div>
              </div>
              <button onClick={() => setShowRestock(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              background: 'var(--bg-card2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 14, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, background: 'rgba(34,197,94,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Package size={20} color="var(--accent-green)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{restockProduct.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {restockProduct.category} · Barcode: {restockProduct.barcode}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: restockProduct.stock <= (restockProduct.lowStockThreshold || 5) ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                  {restockProduct.stock}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>current stock</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Quantity to Add *</label>
                <input
                  className={`input${restockErrors.quantity ? ' input-error' : ''}`}
                  type="number"
                  placeholder="e.g. 50"
                  value={restockForm.quantity}
                  min="1"
                  autoFocus
                  onChange={e => { restockField('quantity', e.target.value); setRestockErrors(v => ({ ...v, quantity: '' })) }}
                />
                {restockErrors.quantity && (
                  <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{restockErrors.quantity}</div>
                )}
                {restockForm.quantity > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent-green)', marginTop: 3 }}>
                    New total: {restockProduct.stock + parseInt(restockForm.quantity || 0)} units
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select
                  className={`input${restockErrors.reason ? ' input-error' : ''}`}
                  value={restockForm.reason}
                  onChange={e => { restockField('reason', e.target.value); setRestockErrors(v => ({ ...v, reason: '' })) }}
                >
                  <option value="">Select reason</option>
                  <option value="purchase">New Purchase</option>
                  <option value="return">Customer Return</option>
                  <option value="adjustment">Stock Adjustment</option>
                  <option value="transfer">Transfer In</option>
                  <option value="other">Other</option>
                </select>
                {restockErrors.reason && (
                  <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{restockErrors.reason}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Optional notes (supplier, batch no., etc.)"
                value={restockForm.notes}
                onChange={e => restockField('notes', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setShowRestock(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'center', background: 'var(--accent-green)' }}
                onClick={handleRestockSubmit}
                disabled={restockSubmitting}
              >
                {restockSubmitting
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Adding...</>
                  : <><TrendingUp size={14} /> Add Stock</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Create/Edit Modal ────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.2s ease', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {editingProduct ? 'Update product information' : 'Create a new product in your inventory'}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Image Upload Field */}
            <div className="form-group">
              <label className="form-label">Product Image</label>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => field('imageUrl', url)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className={`input${errors.name ? ' input-error' : ''}`} placeholder="Coca Cola 500ml" value={form.name} onChange={e => { field('name', e.target.value); setErrors(v => ({ ...v, name: '' })) }} />
                {errors.name && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Barcode *</label>
                <input className={`input${errors.barcode ? ' input-error' : ''}`} placeholder="123456789012" value={form.barcode} onChange={e => { field('barcode', e.target.value); setErrors(v => ({ ...v, barcode: '' })) }} />
                {errors.barcode && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.barcode}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" rows={2} placeholder="Product description..." value={form.description} onChange={e => field('description', e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Selling Price *</label>
                <input className={`input${errors.price ? ' input-error' : ''}`} type="number" step="0.01" placeholder="99.99" value={form.price} onChange={e => { field('price', e.target.value); setErrors(v => ({ ...v, price: '' })) }} />
                {errors.price && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.price}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price</label>
                <input className="input" type="number" step="0.01" placeholder="50.00" value={form.costPrice} onChange={e => field('costPrice', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Stock *</label>
                <input className={`input${errors.stock ? ' input-error' : ''}`} type="number" placeholder="100" value={form.stock} onChange={e => { field('stock', e.target.value); setErrors(v => ({ ...v, stock: '' })) }} />
                {errors.stock && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.stock}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="input" placeholder="Beverages" value={form.category} onChange={e => field('category', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Alert Threshold</label>
                <input className="input" type="number" placeholder="5" value={form.minStock} onChange={e => field('minStock', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> {editingProduct ? 'Updating...' : 'Creating...'}</>
                  : editingProduct ? 'Update Product' : 'Create Product'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}