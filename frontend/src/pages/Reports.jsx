import { useState, useEffect } from 'react'
import { saleAPI, refundAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import { 
  TrendingUp, ShoppingBag, Wallet, Calendar, Package, 
  CreditCard, BarChart3, Download, RefreshCw, RotateCcw
} from 'lucide-react'

export default function Reports({ currentUser }) {
  const { notify } = useApp()
  const [analytics,        setAnalytics]        = useState(null)
  const [refundAnalytics,  setRefundAnalytics]  = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [period,           setPeriod]           = useState('30d')

  useEffect(() => { fetchAll() }, [period])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [salesRes, refundRes] = await Promise.all([
        saleAPI.getAnalytics({ period }),
        refundAPI.getAnalytics({ period }),
      ])
      setAnalytics(salesRes.data)
      setRefundAnalytics(refundRes.data)
    } catch {
      notify('Error fetching analytics', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n || 0)

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })

  const getPeriodLabel = () =>
    ({ '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', '1y': 'Last Year' }[period] || 'Last 30 Days')

  const REASON_COLORS = {
    Damaged:         '#ef4444',
    Expired:         '#f59e0b',
    'Wrong Item':    '#3b82f6',
    'Customer Return':'#8b5cf6',
    Other:           '#64748b',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Data Available</div>
        <div style={{ color: 'var(--text-muted)' }}>Start making sales to see reports</div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Revenue',  value: formatCurrency(analytics.totals?.totalRevenue || 0), icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.12)'   },
    { label: 'Total Orders',   value: analytics.totals?.totalOrders || 0,                  icon: ShoppingBag, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Average Order',  value: formatCurrency(analytics.totals?.avgOrderValue || 0),icon: Wallet,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Period',         value: getPeriodLabel(),                                    icon: Calendar,    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Sales Reports</div>
          <div className="page-subtitle">View and analyze your sales performance</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input" style={{ width: 140 }}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button className="btn btn-ghost" onClick={fetchAll}><RefreshCw size={15} /></button>
          <button className="btn btn-primary" onClick={() => window.print()}><Download size={15} /> Export</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              <s.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── REFUND SUMMARY ──────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <RotateCcw size={16} color="var(--accent-red)" />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Refund Summary</div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>{getPeriodLabel()}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Refunded',  value: formatCurrency(refundAnalytics?.totalRefundAmount || 0), color: '#ef4444' },
            { label: 'Refund Count',    value: refundAnalytics?.totalRefundCount || 0,                  color: '#f59e0b' },
            { label: 'Refund Rate',     value: analytics.totals?.totalRevenue
                ? `${((refundAnalytics?.totalRefundAmount || 0) / analytics.totals.totalRevenue * 100).toFixed(1)}%`
                : '0%',
              color: '#8b5cf6'
            },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card2)', borderRadius: 10, padding: '14px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* By Reason */}
        {refundAnalytics?.byReason?.length > 0 && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Refunds by Reason</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {refundAnalytics.byReason.map(r => {
                const maxAmt = refundAnalytics.byReason[0]?.amount || 1
                const pct    = (r.amount / maxAmt) * 100
                const color  = REASON_COLORS[r._id] || '#64748b'
                return (
                  <div key={r._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{r._id}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(r.amount)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>({r.count} refund{r.count !== 1 ? 's' : ''})</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-card2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(!refundAnalytics?.byReason?.length) && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            No refunds recorded in this period
          </div>
        )}
      </div>

      {/* ── SALES CHARTS ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Daily Revenue */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Daily Revenue</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getPeriodLabel()}</div>
          </div>
          {!analytics.dailyRevenue?.length ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No sales data available</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analytics.dailyRevenue?.slice(-10).map(day => {
                const maxRev = Math.max(...(analytics.dailyRevenue?.map(d => d.revenue) || [1]))
                const pct    = maxRev > 0 ? (day.revenue / maxRev) * 100 : 0
                return (
                  <div key={day._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDate(day._id)}</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(day.revenue)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-card2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Top Selling Products</div>
          {!analytics.topProducts?.length ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No products sold yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analytics.topProducts?.slice(0, 5).map((product, i) => {
                const maxQty = analytics.topProducts?.[0]?.quantity || 1
                const pct    = (product.quantity / maxQty) * 100
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)',
                          color: '#fff', fontSize: 10, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{product._id}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{formatCurrency(product.revenue)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{product.quantity} sold</div>
                      </div>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-card2)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-green)', borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Payment Methods */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CreditCard size={16} color="var(--accent)" />
            <div style={{ fontWeight: 600 }}>Revenue by Payment Method</div>
          </div>
          {!analytics.byPaymentMethod?.length ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No payment data available</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analytics.byPaymentMethod?.map(method => {
                const totalRev = analytics.totals?.totalRevenue || 1
                const pct = (method.revenue / totalRev) * 100
                return (
                  <div key={method._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{method._id}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(method.revenue)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-card2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Package size={16} color="var(--accent)" />
            <div style={{ fontWeight: 600 }}>Revenue by Category</div>
          </div>
          {!analytics.byCategory?.length ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No category data available</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analytics.byCategory?.map(category => {
                const totalRev = analytics.totals?.totalRevenue || 1
                const pct = (category.revenue / totalRev) * 100
                return (
                  <div key={category._id || 'Other'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{category._id || 'Other'}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(category.revenue)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-card2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-yellow)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{analytics.dailyRevenue?.length || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active Days</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-green)' }}>{analytics.topProducts?.length || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Products Sold</div>
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-red)' }}>{refundAnalytics?.totalRefundCount || 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Refunds</div>
          </div>
        </div>
      </div>
    </div>
  )
}