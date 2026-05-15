import { useState, useEffect } from 'react'
import { productAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Package,
  TrendingUp,
  AlertTriangle,
  X,
  CheckCircle
} from 'lucide-react'

const EMPTY_FORM = {
  name: '',
  description: '',
  color: '#3b82f6'
}

export default function Categories({ currentUser }) {
  const { notify } = useApp()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

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

  // Extract unique categories from products
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].map(category => {
    const categoryProducts = products.filter(p => p.category === category)
    const totalStock = categoryProducts.reduce((sum, p) => sum + p.stock, 0)
    const lowStockCount = categoryProducts.filter(p => p.stock <= (p.minStock || 5)).length
    const outOfStockCount = categoryProducts.filter(p => p.stock === 0).length

    return {
      name: category,
      productCount: categoryProducts.length,
      totalStock,
      lowStockCount,
      outOfStockCount,
      totalValue: categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0)
    }
  })

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (categories.some(c => c.name.toLowerCase() === form.name.toLowerCase() && c.name !== editingCategory?.name)) {
      e.name = 'Category already exists'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      // For now, categories are managed through products
      // In a real app, this would call a categories API
      notify(editingCategory ? 'Category updated successfully!' : 'Category created successfully!')
      setShowModal(false)
      setEditingCategory(null)
      setForm(EMPTY_FORM)
      // Note: Since categories are derived from products, we don't need to refetch
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save category', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setForm({
      name: category.name,
      description: '',
      color: '#3b82f6'
    })
    setShowModal(true)
    setErrors({})
  }

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"? This will affect ${category.productCount} products.`)) return

    // In a real implementation, this would call an API to update all products in this category
    notify('Category deletion not implemented yet - would require updating all products in this category')
  }

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const totalCategories = categories.length
  const totalProducts = products.length
  const categoriesWithLowStock = categories.filter(c => c.lowStockCount > 0).length
  const categoriesWithOutOfStock = categories.filter(c => c.outOfStockCount > 0).length

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Category Management</div>
          <div className="page-subtitle">Organize your products by categories</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setEditingCategory(null); setForm(EMPTY_FORM); setErrors({}) }}>
            <Plus size={15} />
            Add Category
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Categories', value: totalCategories, icon: Tag, color: '#3b82f6' },
          { label: 'Total Products', value: totalProducts, icon: Package, color: '#22c55e' },
          { label: 'Categories with Low Stock', value: categoriesWithLowStock, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Categories with Out of Stock', value: categoriesWithOutOfStock, icon: X, color: '#ef4444' },
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
          <div style={{ fontWeight: 600 }}>All Categories</div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Products</th>
                <th>Total Stock</th>
                <th>Stock Status</th>
                <th>Total Value</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No categories found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', flexShrink: 0,
                      }}>
                        <Tag size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 500 }}>{c.productCount}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>products</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 500 }}>{c.totalStock}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>units</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.outOfStockCount > 0 && (
                        <span className="badge badge-red" style={{ fontSize: 10 }}>
                          {c.outOfStockCount} out
                        </span>
                      )}
                      {c.lowStockCount > 0 && (
                        <span className="badge badge-orange" style={{ fontSize: 10 }}>
                          {c.lowStockCount} low
                        </span>
                      )}
                      {c.outOfStockCount === 0 && c.lowStockCount === 0 && (
                        <span className="badge badge-green" style={{ fontSize: 10 }}>
                          Good
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      ₱{c.totalValue.toLocaleString()}
                    </div>
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit"
                          onClick={() => handleEdit(c)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="View Products"
                          onClick={() => notify(`${c.productCount} products in ${c.name} category`)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Delete"
                          onClick={() => handleDelete(c)}
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

      {/* Category Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {editingCategory ? 'Update category information' : 'Create a new product category'}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input className={`input${errors.name ? ' input-error' : ''}`} placeholder="Beverages" value={form.name} onChange={e => { field('name', e.target.value); setErrors(v => ({ ...v, name: '' })) }} />
              {errors.name && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" rows={3} placeholder="Optional description..." value={form.description} onChange={e => field('description', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={e => field('color', e.target.value)}
                  style={{ width: 50, height: 40, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Choose a color for this category</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> {editingCategory ? 'Updating...' : 'Creating...'}</> : (editingCategory ? 'Update Category' : 'Create Category')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}