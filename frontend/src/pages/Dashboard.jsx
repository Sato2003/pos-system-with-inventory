import { useState, useEffect } from 'react'
import { productAPI, saleAPI } from '../utils/api'
import {
  TrendingUp, Package, ShoppingBag, AlertTriangle, ArrowUpRight,
  X, Bell, CheckCircle, ChevronRight, DollarSign, Hash, Eye
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import MyStatus from './MyStatus'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

// ── Stat Modal ────────────────────────────────────────────────────────────────
function StatModal({ type, data, onClose }) {
  const config = {
    sales: {
      title: 'Total Sales',
      color: '#3b82f6',
      icon: TrendingUp,
    },
    orders: {
      title: 'Total Orders',
      color: '#22c55e',
      icon: ShoppingBag,
    },
    products: {
      title: 'Total Products',
      color: '#8b5cf6',
      icon: Package,
    },
    lowstock: {
      title: 'Low Stock Items',
      color: '#f59e0b',
      icon: AlertTriangle,
    },
  }
  const cfg = config[type]
  const Icon = cfg.icon

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.15s ease',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexShrink: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: cfg.color + '20', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: cfg.color,
          }}>
            <Icon size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{cfg.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {type === 'sales' && `₱${(data.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} total revenue`}
              {type === 'orders' && `${data.totalOrders || 0} transactions recorded`}
              {type === 'products' && `${data.totalProducts || 0} active products`}
              {type === 'lowstock' && `${data.lowStockItems?.length || 0} items need attention`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {/* TOTAL SALES */}
          {type === 'sales' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Total Revenue', value: `₱${(data.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#3b82f6' },
                  { label: 'Avg Order Value', value: `₱${(data.avgOrderValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#22c55e' },
                  { label: 'Total Orders', value: data.totalOrders || 0, color: '#8b5cf6' },
                  { label: 'Active Days', value: data.activeDays || 0, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Revenue by Payment Method</div>
              {(data.byPaymentMethod || []).length === 0
                ? <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No data yet</div>
                : (data.byPaymentMethod || []).map(m => {
                    const pct = data.totalRevenue > 0 ? ((m.revenue / data.totalRevenue) * 100).toFixed(0) : 0
                    const colors = { cash: '#22c55e', card: '#3b82f6', gcash: '#8b5cf6', maya: '#f59e0b' }
                    return (
                      <div key={m._id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{m._id}</span>
                          <span style={{ fontWeight: 600 }}>₱{(m.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-card2)', borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: colors[m._id] || '#3b82f6', borderRadius: 3, transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          )}

          {/* TOTAL ORDERS */}
          {type === 'orders' && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Recent Transactions</div>
              {(data.recentSales || []).length === 0
                ? <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>No transactions yet</div>
                : (data.recentSales || []).map(s => (
                    <div key={s._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '11px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{s.receiptNumber}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(s.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {' · '}{s.cashierName || 'N/A'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: 14 }}>₱{(s.total || 0).toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.paymentMethod}</div>
                      </div>
                    </div>
                  ))
              }
              <Link to="/sales" onClick={onClose} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginTop: 16, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500,
              }}>
                View all transactions <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* TOTAL PRODUCTS */}
          {type === 'products' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Total', value: data.totalProducts || 0, color: '#8b5cf6' },
                  { label: 'In Stock', value: data.inStock || 0, color: '#22c55e' },
                  { label: 'Out of Stock', value: data.outOfStockCount || 0, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Products by Category</div>
              {(data.byCategory || []).length === 0
                ? <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No products yet</div>
                : (data.byCategory || []).map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{c.count} products</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>₱{(c.value || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
              }
              <Link to="/products" onClick={onClose} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginTop: 16, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500,
              }}>
                Manage products <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {/* LOW STOCK */}
          {type === 'lowstock' && (
            <div>
              {(data.lowStockItems || []).length === 0
                ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    <CheckCircle size={40} color="var(--accent-green)" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>All good!</div>
                    <div style={{ fontSize: 13 }}>No low stock items right now.</div>
                  </div>
                )
                : (data.lowStockItems || []).map(p => (
                    <div key={p._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 8,
                        background: p.stock === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Package size={16} color={p.stock === 0 ? '#ef4444' : '#f59e0b'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: p.stock === 0 ? '#ef4444' : '#f59e0b', fontSize: 14 }}>{p.stock}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ {p.lowStockThreshold} min</div>
                      </div>
                      <span style={{
                        padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                        background: p.stock === 0 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                        color: p.stock === 0 ? '#ef4444' : '#f59e0b', flexShrink: 0,
                      }}>
                        {p.stock === 0 ? 'Out' : 'Low'}
                      </span>
                    </div>
                  ))
              }
              <Link to="/stock-in" onClick={onClose} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                marginTop: 16, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500,
              }}>
                Go to Stock In <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Out-of-Stock Banner ───────────────────────────────────────────────────────
function OutOfStockBanner({ items, onDismiss }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 10, padding: '12px 16px', marginBottom: 20,
      display: 'flex', alignItems: 'flex-start', gap: 12,
      animation: 'slideUp 0.2s ease',
    }}>
      <Bell size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#ef4444', marginBottom: 4 }}>
          {items.length} product{items.length > 1 ? 's are' : ' is'} out of stock
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.slice(0, 6).map(p => (
            <span key={p._id} style={{
              padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
              background: 'rgba(239,68,68,0.12)', color: '#ef4444',
            }}>
              {p.name}
            </span>
          ))}
          {items.length > 6 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px' }}>
              +{items.length - 6} more
            </span>
          )}
        </div>
      </div>
      <Link to="/stock-in" style={{
        fontSize: 11, color: 'var(--accent)', fontWeight: 600,
        textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        Restock →
      </Link>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ currentUser }) {
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModal, setActiveModal] = useState(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    Promise.all([
      productAPI.getSummary(),
      saleAPI.getAnalytics({ period: '30d' }),
      saleAPI.getAll({ limit: 10 }),
      productAPI.getAll(),
    ]).then(([s, a, sl, pr]) => {
      setSummary(s.data)
      setAnalytics(a.data)
      setSales(sl.data?.sales || sl.data || [])
      const prods = Array.isArray(pr.data) ? pr.data : []
      setProducts(prods)
    }).catch(err => {
      console.error('Dashboard error:', err)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div className="spinner" />
    </div>
  )

  const outOfStock = products.filter(p => p.stock === 0 && p.isActive)
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold && p.isActive)
  const allAlertItems = products.filter(p => p.stock <= p.lowStockThreshold && p.isActive)

  const modalData = {
    sales: {
      totalRevenue: analytics?.totals?.totalRevenue || 0,
      avgOrderValue: analytics?.totals?.avgOrderValue || 0,
      totalOrders: analytics?.totals?.totalOrders || 0,
      activeDays: analytics?.dailyRevenue?.length || 0,
      byPaymentMethod: analytics?.byPaymentMethod || [],
    },
    orders: {
      totalOrders: analytics?.totals?.totalOrders || 0,
      recentSales: Array.isArray(sales) ? sales.slice(0, 10) : [],
    },
    products: {
      totalProducts: summary?.totalProducts || 0,
      inStock: products.filter(p => p.stock > p.lowStockThreshold).length,
      outOfStockCount: summary?.outOfStockCount || 0,
      byCategory: (() => {
        const map = {}
        products.forEach(p => {
          const cat = p.category || 'Uncategorized'
          if (!map[cat]) map[cat] = { name: cat, count: 0, value: 0 }
          map[cat].count++
          map[cat].value += p.price * p.stock
        })
        return Object.values(map).sort((a, b) => b.value - a.value)
      })(),
    },
    lowstock: {
      lowStockItems: allAlertItems,
    },
  }

  const stats = [
    {
      key: 'sales',
      label: currentUser?.isAdmin ? 'Total Sales' : 'My Sales',
      value: currentUser?.isAdmin 
        ? `₱${(analytics?.totals?.totalRevenue || 0).toLocaleString()}`
        : `₱${(analytics?.totals?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: '#3b82f6',
      sub: currentUser?.isAdmin ? 'All time revenue' : 'Your total revenue',
    },
    {
      key: 'orders',
      label: currentUser?.isAdmin ? 'Total Orders' : 'My Orders',
      value: analytics?.totals?.totalOrders || 0,
      icon: ShoppingBag,
      color: '#22c55e',
      sub: currentUser?.isAdmin ? 'All time orders' : 'Your orders',
    },
    {
      key: 'products',
      label: currentUser?.isAdmin ? 'Total Products' : 'Products',
      value: summary?.totalProducts || 0,
      icon: Package,
      color: '#8b5cf6',
      sub: `${summary?.lowStockCount || 0} low stock`,
    },
    {
      key: 'lowstock',
      label: 'Low Stock',
      value: summary?.lowStockCount || 0,
      icon: AlertTriangle,
      color: '#f59e0b',
      sub: 'Need restocking',
      badge: outOfStock.length > 0 ? outOfStock.length : null,
    },
  ]

  const categoryData = analytics?.byCategory?.map(c => ({
    name: c._id || 'Other',
    value: c.revenue || 0,
  })) || []

  const weekData = analytics?.dailyRevenue?.slice(-7).map(d => ({
    day: new Date(d._id).toLocaleDateString('en', { weekday: 'short' }),
    sales: d.revenue || 0,
  })) || []

  const topProducts = analytics?.topProducts || []
  const recentSales = Array.isArray(sales) ? sales.slice(0, 5) : []

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            {currentUser?.isAdmin 
              ? 'Welcome back, Admin! Here\'s what\'s happening.'
              : `Welcome back, ${currentUser?.firstName || 'Staff'}! Here's your performance summary.`
            }
          </div>
        </div>
      </div>

      {/* ✅ MyStatus Component - Shows personalized stats for staff only */}
      {!currentUser?.isAdmin && <MyStatus currentUser={currentUser} />}

      {/* Out of stock banner */}
      {!bannerDismissed && (
        <OutOfStockBanner items={outOfStock} onDismiss={() => setBannerDismissed(true)} />
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div
            key={s.key}
            onClick={() => setActiveModal(s.key)}
            className="card"
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
              userSelect: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.color
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 6px 20px ${s.color}22`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow)'
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: s.color + '20', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: s.color, flexShrink: 0,
            }}>
              <s.icon size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
            {s.badge && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: '#ef4444', color: '#fff',
                fontSize: 10, fontWeight: 700,
                padding: '2px 6px', borderRadius: 99,
              }}>
                {s.badge} out
              </div>
            )}
            <ArrowUpRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Sales Overview</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 7 days</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weekData}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="sales" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Sales by Category</div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `₱${v.toLocaleString()}`} contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Top Selling Products</div>
            <Link to="/sales" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowUpRight size={12} /></Link>
          </div>
          {topProducts.length === 0 ? <div className="empty-state"><p>No sales yet</p></div> : topProducts.slice(0, 5).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p._id}</div>
                <div style={{ height: 4, background: 'var(--bg-card2)', borderRadius: 99, marginTop: 4 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: COLORS[i], width: `${Math.min(100, (p.quantity / (topProducts[0]?.quantity || 1)) * 100)}%` }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{p.quantity} sold</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Recent Transactions</div>
            <Link to="/sales" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowUpRight size={12} /></Link>
          </div>
          {recentSales.length === 0 ? <div className="empty-state"><p>No transactions yet</p></div> : recentSales.map(s => (
            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s.receiptNumber || `INV-${s._id?.slice(-4)}`}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(s.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>₱{(s.total || 0).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alert Table */}
      {allAlertItems.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={16} color="var(--accent-red)" />
            <div style={{ fontWeight: 600 }}>Low Stock Alerts</div>
            <span className="badge badge-red">{allAlertItems.length} items</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allAlertItems.slice(0, 8).map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.category}</td>
                  <td><span style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--accent-red)' : 'var(--accent-yellow)' }}>{p.stock}</span></td>
                  <td>{p.lowStockThreshold}</td>
                  <td><span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}>{p.stock === 0 ? 'Out of Stock' : 'Low Stock'}</span></td>
                  <td><Link to="/stock-in" className="btn btn-ghost btn-sm">Restock</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {activeModal && (
        <StatModal
          type={activeModal}
          data={modalData[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}