import { useState, useEffect } from 'react'
import { saleAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import RefundModal from '../components/RefundModal'
import { 
  Search, Filter, X, Eye, ChevronLeft, ChevronRight,
  Calendar, CreditCard, Receipt, DollarSign, TrendingUp, RotateCcw
} from 'lucide-react'

export default function Sales({ currentUser }) {
  const { notify } = useApp()
  const [sales,         setSales]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filters,       setFilters]       = useState({ startDate: '', endDate: '', paymentMethod: '', page: 1, limit: 20 })
  const [total,         setTotal]         = useState(0)
  const [pages,         setPages]         = useState(0)
  const [selectedSale,  setSelectedSale]  = useState(null)
  const [refundSale,    setRefundSale]    = useState(null)
  const [showFilters,   setShowFilters]   = useState(false)

  useEffect(() => { fetchSales() }, [filters])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const params = { ...filters }
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
      const response = await saleAPI.getAll(params)
      setSales(response.data.sales)
      setTotal(response.data.total)
      setPages(response.data.pages)
    } catch {
      notify('Error fetching sales', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) =>
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }))

  const clearFilters = () =>
    setFilters({ startDate: '', endDate: '', paymentMethod: '', page: 1, limit: 20 })

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const formatShortDate = (d) =>
    new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n || 0)

  const getPaymentMethodColor = (method) => {
    const colors = {
      cash:  { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', label: 'Cash'  },
      card:  { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'Card'  },
      gcash: { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', label: 'GCash' },
      maya:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Maya'  },
    }
    return colors[method] || { bg: 'rgba(100,116,139,0.12)', color: '#64748b', label: method }
  }

  const getPaymentIcon = (method) =>
    ({ cash: '💵', card: '💳', gcash: '📱', maya: '🟢' }[method] || '💰')

  const RefundBadge = ({ status }) => {
    if (!status || status === 'none') return null
    const style = status === 'full'
      ? { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', label: 'Fully Refunded' }
      : { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'Partially Refunded' }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
        background: style.bg, color: style.color, marginLeft: 6,
      }}>
        <RotateCcw size={9} /> {style.label}
      </span>
    )
  }

  const canRefund = (sale) => {
    if (sale.refundStatus === 'full') return false
    const allDone = sale.items.every(i => (i.refundedQty || 0) >= i.quantity)
    return !allDone
  }

  // Calculate accurate revenue statistics from sales data
  const calculateRevenueStats = () => {
    const totalRefunds = sales.reduce((sum, sale) => sum + (sale.refundAmount || 0), 0)
    const totalRevenue = sales.reduce((sum, sale) => {
      const netTotal = sale.netTotal != null
        ? sale.netTotal
        : (sale.total || 0) - (sale.refundAmount || 0)
      return sum + Math.max(0, netTotal)
    }, 0)
    const grossRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
    const averageOrder = sales.length > 0 ? totalRevenue / sales.length : 0

    return { totalRevenue, totalRefunds, grossRevenue, averageOrder }
  }

  const stats = calculateRevenueStats()

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Sales History</div>
          <div className="page-subtitle">View and manage all transactions</div>
        </div>
        <button
          className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={15} /> Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card" style={{ marginBottom: 24, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Filter Sales</div>
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}><X size={14} /> Clear all</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date</label>
              <input type="date" className="input" value={filters.startDate}
                onChange={e => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date</label>
              <input type="date" className="input" value={filters.endDate}
                onChange={e => handleFilterChange('endDate', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select className="input" value={filters.paymentMethod}
                onChange={e => handleFilterChange('paymentMethod', e.target.value)}>
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={fetchSales} style={{ width: '100%' }}>
                <Search size={15} /> Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary - Updated to show accurate revenue after refunds */}
      {!loading && sales.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{total}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Sales</div>
            </div>
          </div>
          
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} color="#22c55e" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(stats.totalRevenue)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net Revenue</div>
              {stats.totalRefunds > 0 && (
                <div style={{ fontSize: 10, color: 'var(--accent-red)' }}>
                  (Refunds: {formatCurrency(stats.totalRefunds)})
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#8b5cf6" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(stats.averageOrder)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Average Order</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={18} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(stats.totalRefunds)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Refunds</div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Receipt size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Sales Found</div>
            <div style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or make a sale</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Refunded</th>
                    <th>Net Total</th>
                    <th>Payment</th>
                    <th>Cashier</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => {
                    const paymentStyle = getPaymentMethodColor(sale.paymentMethod)
                    const netTotal = (sale.total || 0) - (sale.refundAmount || 0)
                    return (
                      <tr key={sale._id}>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {sale.receiptNumber}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {formatShortDate(sale.createdAt)}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {formatCurrency(sale.subtotal || sale.total)}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--accent-red)' }}>
                          {sale.refundAmount > 0 ? formatCurrency(sale.refundAmount) : '-'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                            {formatCurrency(netTotal)}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 99,
                            fontSize: 11, fontWeight: 600,
                            background: paymentStyle.bg, color: paymentStyle.color,
                          }}>
                            <span>{getPaymentIcon(sale.paymentMethod)}</span>
                            {paymentStyle.label}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {sale.cashierName || 'N/A'}
                        </td>
                        <td>
                          {sale.refundStatus && sale.refundStatus !== 'none' ? (
                            <RefundBadge status={sale.refundStatus} />
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--accent-green)', fontWeight: 600 }}>✓ Completed</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSale(sale)}
                              style={{ padding: '6px 10px' }}>
                              <Eye size={14} /> View
                            </button>
                            {canRefund(sale) && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setRefundSale(sale)}
                                style={{ padding: '6px 10px', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                              >
                                <RotateCcw size={14} /> Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{
                padding: '14px 20px', borderTop: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Page {filters.page} of {pages} ({total} total sales)
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" disabled={filters.page === 1}
                    onClick={() => handleFilterChange('page', filters.page - 1)}>
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={filters.page === pages}
                    onClick={() => handleFilterChange('page', filters.page + 1)}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 28, width: 500, maxWidth: '90%',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Sale Details</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {selectedSale.receiptNumber}
                </div>
              </div>
              <button onClick={() => setSelectedSale(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Date', formatDate(selectedSale.createdAt)],
                  ['Cashier', selectedSale.cashierName || 'N/A'],
                  ['Payment Method', selectedSale.paymentMethod],
                  ['Refund Status', selectedSale.refundStatus === 'none' ? 'None' : selectedSale.refundStatus === 'full' ? 'Fully Refunded' : 'Partially Refunded'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Items</div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.productName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                        {(item.refundedQty || 0) > 0 && (
                          <span style={{ color: 'var(--accent-red)', marginLeft: 8 }}>
                            ({item.refundedQty} refunded)
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 14 }}>
              {[
                ['Subtotal', formatCurrency(selectedSale.subtotal || selectedSale.total)],
                ...(selectedSale.discount > 0 ? [['Discount', `-${formatCurrency(selectedSale.discount)}`]] : []),
                ['Tax (12%)', formatCurrency(selectedSale.tax || 0)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l}</span>
                  <span>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Original Total</span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>
                    {formatCurrency(selectedSale.subtotal || selectedSale.total)}
                  </span>
                </div>
                {selectedSale.refundAmount > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--accent-red)' }}>Refunded Amount</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}>
                        -{formatCurrency(selectedSale.refundAmount)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-green)' }}>Net Total</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>
                        {formatCurrency(selectedSale.netTotal != null
                          ? selectedSale.netTotal
                          : (selectedSale.subtotal || selectedSale.total) - (selectedSale.refundAmount || 0)
                        )}
                      </span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount Paid</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{formatCurrency(selectedSale.amountPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Change</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{formatCurrency(selectedSale.change)}</span>
                </div>
              </div>
            </div>

            {selectedSale.notes && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 13, padding: 10, background: 'var(--bg-card2)', borderRadius: 8 }}>
                  {selectedSale.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {canRefund(selectedSale) && (
                <button
                  className="btn btn-ghost"
                  onClick={() => { setSelectedSale(null); setRefundSale(selectedSale) }}
                  style={{ flex: 1, justifyContent: 'center', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  <RotateCcw size={14} /> Refund
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setSelectedSale(null)}
                style={{ flex: 1, justifyContent: 'center' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundSale && (
        <RefundModal
          sale={refundSale}
          currentUser={currentUser}
          onClose={() => setRefundSale(null)}
          onSuccess={(updatedSale) => {
            // Update the specific sale in the sales array immediately
            if (updatedSale) {
              setSales(prevSales =>
                prevSales.map(sale =>
                  sale._id === updatedSale._id ? updatedSale : sale
                )
              )
              // Also refresh from server to ensure consistency
              fetchSales()
            } else {
              // Just refresh all sales if no updated data received
              fetchSales()
            }
          }}
        />
      )}
    </div>
  )
}