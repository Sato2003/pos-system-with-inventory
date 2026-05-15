import { useState } from 'react'
import { refundAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import { X, RotateCcw, AlertTriangle, CheckCircle, Minus, Plus } from 'lucide-react'

const REASONS = ['Damaged', 'Expired', 'Wrong Item', 'Customer Return', 'Other']

export default function RefundModal({ sale, currentUser, onClose, onSuccess }) {
  const { notify } = useApp()
  const isAdmin = currentUser?.isAdmin === true

  const [selectedItems, setSelectedItems] = useState(
    sale.items.map(item => ({
      productId:   item.product._id || item.product,
      productName: item.productName,
      unitPrice:   item.unitPrice,
      maxQty:      item.quantity - (item.refundedQty || 0),
      refundQty:   0,
      selected:    false,
    }))
  )
  const [reason,        setReason]        = useState('')
  const [notes,         setNotes]         = useState('')
  const [adminOverride, setAdminOverride] = useState(false)
  const [submitting,    setSubmitting]    = useState(false)

  const daysSinceSale = (Date.now() - new Date(sale.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  const pastWindow    = daysSinceSale > 30

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n || 0)

  const toggleItem = (idx) => {
    setSelectedItems(prev => prev.map((item, i) =>
      i !== idx ? item
        : { ...item, selected: !item.selected, refundQty: !item.selected ? Math.min(1, item.maxQty) : 0 }
    ))
  }

  const updateQty = (idx, delta) => {
    setSelectedItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const next = Math.max(1, Math.min(item.maxQty, item.refundQty + delta))
      return { ...item, refundQty: next }
    }))
  }

  const activeItems = selectedItems.filter(i => i.selected && i.refundQty > 0)
  const refundTotal = activeItems.reduce((s, i) => s + i.unitPrice * i.refundQty, 0)
  const canSubmit   = activeItems.length > 0 && reason && (!pastWindow || (isAdmin && adminOverride))

  const handleSubmit = async () => {
    if (!canSubmit) return
    
    setSubmitting(true)
    try {
      const response = await refundAPI.create({
        saleId: sale._id,
        items:  activeItems.map(i => ({ 
          productId: i.productId, 
          quantity: i.refundQty,
          unitPrice: i.unitPrice 
        })),
        reason,
        notes,
        adminOverride: isAdmin ? adminOverride : false,
      })
      
      notify('Refund processed successfully', 'success')
      
      // Pass the updated sale data back to parent
      if (onSuccess) {
        onSuccess(response?.data?.updatedSale)
      }
      onClose()
    } catch (err) {
      notify(err.response?.data?.message || 'Refund failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1100,
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, width: 520, maxWidth: '94%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={18} color="var(--accent-red)" /> Process Refund
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {sale.receiptNumber}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* 30-day warning */}
        {pastWindow && (
          <div style={{
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12 }}>
              <strong style={{ color: '#f59e0b' }}>Outside 30-day window</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                This sale is {Math.floor(daysSinceSale)} days old.
                {isAdmin ? ' Enable admin override below to proceed.' : ' Only an admin can refund this sale.'}
              </div>
            </div>
          </div>
        )}

        {/* Item selection */}
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Select Items to Refund</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {selectedItems.map((item, idx) => {
            const exhausted = item.maxQty === 0
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 14px',
                  border: `1.5px solid ${item.selected ? 'var(--accent)' : 'var(--border)'}`,
                  opacity: exhausted ? 0.45 : 1,
                  cursor: exhausted ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => { if (!exhausted) toggleItem(idx) }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${item.selected ? 'var(--accent)' : 'var(--border)'}`,
                    background: item.selected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.selected && <CheckCircle size={12} color="#fff" />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatCurrency(item.unitPrice)} each ·{' '}
                      {exhausted
                        ? 'Already fully refunded'
                        : `Up to ${item.maxQty} unit${item.maxQty !== 1 ? 's' : ''} available`}
                    </div>
                  </div>

                  {/* Qty stepper */}
                  {item.selected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={e => e.stopPropagation()}>
                      <button onClick={() => updateQty(idx, -1)} style={{
                        width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--bg-card)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}><Minus size={12} /></button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                        {item.refundQty}
                      </span>
                      <button onClick={() => updateQty(idx, 1)}
                        disabled={item.refundQty >= item.maxQty}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                          background: 'var(--bg-card)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: item.refundQty >= item.maxQty ? 0.4 : 1,
                        }}><Plus size={12} /></button>
                    </div>
                  )}

                  {item.selected && (
                    <div style={{ minWidth: 72, textAlign: 'right', fontSize: 13, fontWeight: 700 }}>
                      {formatCurrency(item.unitPrice * item.refundQty)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Reason */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Refund Reason *</label>
          <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">Select a reason…</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Additional Notes</label>
          <textarea className="input" rows={2} style={{ resize: 'vertical' }}
            placeholder="Optional notes…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* Admin override toggle */}
        {pastWindow && isAdmin && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-card2)', borderRadius: 10,
              padding: '10px 14px', marginBottom: 16, cursor: 'pointer',
            }}
            onClick={() => setAdminOverride(v => !v)}
          >
            <div style={{
              width: 38, height: 22, borderRadius: 11,
              background: adminOverride ? 'var(--accent)' : 'var(--border)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, left: adminOverride ? 18 : 3,
                transition: 'left 0.2s',
              }} />
            </div>
            <div style={{ fontSize: 13 }}>
              <strong>Admin Override</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>Allow refund past 30-day window</span>
            </div>
          </div>
        )}

        {/* Refund total */}
        {refundTotal > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Refund Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-red)' }}>
              {formatCurrency(refundTotal)}
            </span>
          </div>
        )}

        {/* Actions */}
        <button
          className="btn btn-primary"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          style={{
            width: '100%', justifyContent: 'center', padding: '12px',
            background: canSubmit ? '#ef4444' : undefined,
            borderColor: canSubmit ? '#ef4444' : undefined,
            marginBottom: 8,
          }}
        >
          <RotateCcw size={15} />
          {submitting ? 'Processing…' : `Process Refund${refundTotal > 0 ? ` · ${formatCurrency(refundTotal)}` : ''}`}
        </button>
        <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}