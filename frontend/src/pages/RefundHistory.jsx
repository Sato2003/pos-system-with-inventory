import { useState, useEffect } from 'react'
import { refundAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import { 
  Search, X, Eye, ChevronLeft, ChevronRight,
  Calendar, Receipt, DollarSign, TrendingUp, RotateCcw
} from 'lucide-react'

export default function RefundHistory({ currentUser }) {
  const { notify } = useApp()
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ startDate: '', endDate: '', reason: '', page: 1, limit: 20 })
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({ totalRefundAmount: 0, totalRefundCount: 0, byReason: [] })

  useEffect(() => { 
    fetchRefunds()
    fetchStats()
  }, [filters])

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const params = { ...filters }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const response = await refundAPI.getAll(params)
      setRefunds(response.data.refunds || response.data || [])
      setTotal(response.data.total || 0)
      setPages(response.data.pages || 1)
    } catch (error) {
      notify('Error fetching refunds', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await refundAPI.getAnalytics()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleFilterChange = (field, value) =>
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }))

  const clearFilters = () =>
    setFilters({ startDate: '', endDate: '', reason: '', page: 1, limit: 20 })

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n || 0)

  const getReasonBadge = (reason) => {
    const reasons = {
      Damaged: { label: 'Damaged', color: '#ef4444', icon: '🚫' },
      Expired: { label: 'Expired', color: '#f59e0b', icon: '⏰' },
      'Wrong Item': { label: 'Wrong Item', color: '#3b82f6', icon: '🔄' },
      'Customer Return': { label: 'Return', color: '#8b5cf6', icon: '📦' },
      Other: { label: 'Other', color: '#6b7280', icon: '📝' },
    }
    return reasons[reason] || reasons.Other
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Refund History</div>
          <div className="page-subtitle">Track all product refunds and returns</div>
        </div>
        <button className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowFilters(!showFilters)}>
          <Search size={15} /> Filters
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Refunds', value: stats.totalRefundCount || 0, icon: Receipt, color: '#8b5cf6' },
          { label: 'Total Amount', value: formatCurrency(stats.totalRefundAmount), icon: DollarSign, color: '#ef4444' },
          { label: 'Average Refund', value: formatCurrency((stats.totalRefundAmount / (stats.totalRefundCount || 1))), icon: TrendingUp, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              <s.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 24, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Filter Refunds</div>
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={14} /> Clear all</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date</label>
              <input type="date" className="input" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date</label>
              <input type="date" className="input" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reason</label>
              <select className="input" value={filters.reason} onChange={e => handleFilterChange('reason', e.target.value)}>
                <option value="">All Reasons</option>
                <option value="Damaged">Damaged</option>
                <option value="Expired">Expired</option>
                <option value="Wrong Item">Wrong Item</option>
                <option value="Customer Return">Customer Return</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Refunds Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : refunds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <RotateCcw size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Refunds Found</div>
            <div style={{ color: 'var(--text-muted)' }}>No refunds have been processed yet</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Refund #</th>
                    <th>Receipt #</th>
                    <th>Items</th>
                    <th>Reason</th>
                    <th>Amount</th>
                    <th>Processed By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map(refund => {
                    const reasonBadge = getReasonBadge(refund.reason)
                    return (
                      <tr key={refund._id}>
                        <td>{formatDate(refund.createdAt)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{refund.refundNumber}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{refund.receiptNumber}</td>
                        <td>{refund.items?.length || 0} item(s)</td>
                        <td>
                          <span style={{ background: reasonBadge.color + '20', color: reasonBadge.color, padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>
                            {reasonBadge.icon} {reasonBadge.label}
                          </span>
                        </td>
                        <td style={{ color: '#ef4444', fontWeight: 700 }}>{formatCurrency(refund.refundAmount)}</td>
                        <td style={{ fontSize: 12 }}>{refund.processedByName}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRefund(refund)}>
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <div>Page {filters.page} of {pages} ({total} total)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" disabled={filters.page === 1} onClick={() => handleFilterChange('page', filters.page - 1)}>Previous</button>
                  <button className="btn btn-ghost btn-sm" disabled={filters.page === pages} onClick={() => handleFilterChange('page', filters.page + 1)}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
            padding: 28, width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Refund Details</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selectedRefund.refundNumber}
                </div>
              </div>
              <button onClick={() => setSelectedRefund(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Date</div>
                  <div>{formatDate(selectedRefund.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Receipt #</div>
                  <div>{selectedRefund.receiptNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Reason</div>
                  <div>{selectedRefund.reason}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Amount</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{formatCurrency(selectedRefund.refundAmount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Processed By</div>
                  <div>{selectedRefund.processedByName}</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Items Refunded</div>
              {selectedRefund.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div>{item.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.quantity} × {formatCurrency(item.unitPrice)}</div>
                  </div>
                  <div>{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>

            {selectedRefund.notes && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                <div style={{ padding: 10, background: 'var(--bg-card2)', borderRadius: 8 }}>{selectedRefund.notes}</div>
              </div>
            )}

            <button className="btn btn-primary" onClick={() => setSelectedRefund(null)} style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}