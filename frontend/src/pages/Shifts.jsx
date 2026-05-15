import { useState, useEffect } from 'react'
import { shiftAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import DenomInput, { calcDenomTotal } from '../components/DenomInput'
import {
  Clock, PlayCircle, StopCircle, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Loader2, X, Banknote
} from 'lucide-react'

const DENOMS_LIST = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5, 0.25]
const EMPTY_DENOMS = { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.5: 0, 0.25: 0 }

const denomLabel = (d) => {
  if (d >= 1000) return `₱${d / 1000}k`
  if (d === 0.5)  return '50¢'
  if (d === 0.25) return '25¢'
  return `₱${d}`
}

const fmt = (n) => `₱${Number(n || 0).toLocaleString('en', { minimumFractionDigits: 2 })}`
const fmtDate = (d) => new Date(d).toLocaleString('en-PH', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
})
const duration = (start, end) => {
  const ms = new Date(end || Date.now()) - new Date(start)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

/**
 * Safely read a denomination value regardless of whether the key is a number or string.
 * Handles: { 1000: 2 }, { "1000": 2 }, and Mongoose plain objects after toObject().
 */
const getQty = (denoms, d) => Number(denoms?.[d] ?? denoms?.[String(d)]) || 0

// ✅ Fixed DenomReadout — handles string or number keys
function DenomReadout({ denoms, title }) {
  const hasValues = DENOMS_LIST.some(d => getQty(denoms, d) > 0)

  if (!denoms || !hasValues) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>
        No denominations recorded
      </div>
    )
  }

  return (
    <div>
      {title && <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DENOMS_LIST.map(d => {
          const qty = getQty(denoms, d)
          if (qty === 0) return null
          return (
            <div key={d} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, padding: '6px 10px',
              background: 'var(--bg-card2)', borderRadius: 6,
              border: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {denomLabel(d)} × {qty}
              </span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                ₱{(Math.round(d * qty * 100) / 100).toLocaleString('en', { minimumFractionDigits: d < 1 ? 2 : 0 })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Shifts({ currentUser }) {
  const { notify } = useApp()
  const isAdmin = currentUser?.isAdmin

  const [activeShift, setActiveShift] = useState(null)
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  const [showStart, setShowStart] = useState(false)
  const [openingDenoms, setOpeningDenoms] = useState({ ...EMPTY_DENOMS })
  const [startNotes, setStartNotes] = useState('')
  const [starting, setStarting] = useState(false)

  const [showEnd, setShowEnd] = useState(false)
  const [closingDenoms, setClosingDenoms] = useState({ ...EMPTY_DENOMS })
  const [endNotes, setEndNotes] = useState('')
  const [ending, setEnding] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [activeRes, allRes] = await Promise.all([
        shiftAPI.getActive(),
        shiftAPI.getAll(),
      ])
      console.log('[Shifts] activeShift:', activeRes.data)
      console.log('[Shifts] all shifts:', allRes.data)
      setActiveShift(activeRes.data)
      setShifts(Array.isArray(allRes.data) ? allRes.data : [])
    } catch (error) {
      console.error('Error loading shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleStartShift = async () => {
    setStarting(true)
    try {
      await shiftAPI.start({ openingDenoms, notes: startNotes })
      notify('Shift started successfully!', 'success')
      setShowStart(false)
      setOpeningDenoms({ ...EMPTY_DENOMS })
      setStartNotes('')
      loadData()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to start shift', 'error')
    } finally {
      setStarting(false)
    }
  }

  const handleEndShift = async () => {
    if (!activeShift) return
    setEnding(true)
    try {
      await shiftAPI.end(activeShift._id, { closingDenoms, notes: endNotes })
      notify('Shift closed successfully!', 'success')
      setShowEnd(false)
      setClosingDenoms({ ...EMPTY_DENOMS })
      setEndNotes('')
      loadData()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to end shift', 'error')
    } finally {
      setEnding(false)
    }
  }

  const closedShifts = shifts.filter(s => s.status === 'closed')
  const totalShortage = closedShifts.reduce((sum, s) => sum + (s.shortage || 0), 0)
  const totalCashSales = closedShifts.reduce((sum, s) => sum + (s.cashSales || 0), 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Cashier Shifts</div>
          <div className="page-subtitle">
            {isAdmin ? 'View all cashier shifts' : 'Manage your shift and cash float'}
          </div>
        </div>
        {!isAdmin && !activeShift && (
          <button className="btn btn-primary" onClick={() => setShowStart(true)}>
            <PlayCircle size={15} /> Start Shift
          </button>
        )}
        {!isAdmin && activeShift && (
          <button
            className="btn btn-danger"
            style={{ background: '#ef4444', color: '#fff' }}
            onClick={() => { setShowEnd(true); setClosingDenoms({ ...EMPTY_DENOMS }) }}
          >
            <StopCircle size={15} /> End Shift
          </button>
        )}
      </div>

      {/* Active shift banner */}
      {!isAdmin && activeShift && (
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <div>
              <div style={{ fontWeight: 700 }}>Shift Active</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Started {activeShift.openedAt ? fmtDate(activeShift.openedAt) : 'N/A'} · {activeShift.openedAt ? duration(activeShift.openedAt) : '0h 0m'} elapsed
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Opening Float</div>
            <div style={{ fontWeight: 700, color: '#22c55e' }}>{fmt(activeShift.openingFloat)}</div>
          </div>
        </div>
      )}

      {/* Admin stats */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Shifts', value: shifts.length, icon: Clock, color: '#3b82f6' },
            { label: 'Total Cash Sales', value: fmt(totalCashSales), icon: Banknote, color: '#22c55e' },
            {
              label: totalShortage >= 0 ? 'Total Overage' : 'Total Shortage',
              value: fmt(Math.abs(totalShortage)),
              icon: totalShortage >= 0 ? TrendingUp : TrendingDown,
              color: totalShortage >= 0 ? '#22c55e' : '#ef4444',
            },
          ].map(s => (
            <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                <s.icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shift list */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 16 }}>{isAdmin ? 'All Shifts' : 'My Shifts'}</div>
        {shifts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No shifts found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shifts.map(s => {
              const isOpen = s.status === 'open'
              const isExpanded = expandedId === s._id
              const shortage = s.shortage || 0
              return (
                <div key={s._id} style={{
                  border: `1px solid ${isOpen ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                  borderRadius: 10, overflow: 'hidden',
                  background: isOpen ? 'rgba(34,197,94,0.04)' : 'var(--bg-card2)',
                }}>
                  {/* Header row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isAdmin ? '1.5fr 1fr 1fr 1fr 1fr 0.3fr' : '1.5fr 1fr 1fr 1fr 0.3fr',
                      gap: 12,
                      alignItems: 'center',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : s._id)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {isAdmin && (
                      <div style={{ fontWeight: 500 }}>
                        {s.cashier?.firstName} {s.cashier?.lastName}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Opened</div>
                      <div style={{ fontSize: 12 }}>{s.openedAt ? fmtDate(s.openedAt) : 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duration</div>
                      <div style={{ fontSize: 12 }}>{s.openedAt ? duration(s.openedAt, s.closedAt) : '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Opening</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(s.openingFloat)}</div>
                    </div>
                    <div>
                      {isOpen ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', background: 'rgba(34,197,94,0.12)', padding: '3px 10px', borderRadius: 20 }}>● Open</span>
                      ) : (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          color: shortage >= 0 ? '#22c55e' : '#ef4444',
                          background: shortage >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        }}>
                          {shortage >= 0 ? `+${fmt(shortage)}` : fmt(shortage)}
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

                        {/* Opening Denominations */}
                        <div>
                          <DenomReadout denoms={s.openingDenoms} title="💰 Opening Float Breakdown" />
                          <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Total Opening Float:</span>
                              <strong style={{ color: '#22c55e' }}>{fmt(s.openingFloat)}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Closing Denominations */}
                        {!isOpen && (
                          <div>
                            <DenomReadout denoms={s.closingDenoms} title="🔒 Closing Cash Breakdown" />
                            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total Closing Cash:</span>
                                <strong style={{ color: s.closingCash >= s.expectedCash ? '#22c55e' : '#ef4444' }}>
                                  {fmt(s.closingCash)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Shift Summary */}
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>📊 Shift Summary</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                              <span>Opening Float:</span>
                              <strong>{fmt(s.openingFloat)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                              <span>Cash Sales:</span>
                              <strong style={{ color: '#3b82f6' }}>{fmt(s.cashSales)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                              <span>Expected Cash:</span>
                              <strong>{fmt(s.expectedCash)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                              <span>Actual Cash:</span>
                              <strong>{fmt(s.closingCash)}</strong>
                            </div>
                            <div style={{
                              display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                              background: shortage >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              borderRadius: 6, marginTop: 4,
                            }}>
                              <span style={{ fontWeight: 600 }}>{shortage >= 0 ? '✅ Overage' : '❌ Shortage'}:</span>
                              <strong style={{ color: shortage >= 0 ? '#22c55e' : '#ef4444' }}>
                                {shortage >= 0 ? `+${fmt(shortage)}` : fmt(shortage)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {s.notes && (
                        <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-card2)', borderRadius: 8, fontSize: 12 }}>
                          <strong>📝 Notes:</strong> {s.notes}
                        </div>
                      )}

                      {/* Debug view — remove in production */}
                      {import.meta.env.DEV && (
                        <details style={{ marginTop: 12 }}>
                          <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>Raw denom data (dev only)</summary>
                          <pre style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'auto', maxHeight: 120, marginTop: 6 }}>
                            openingDenoms: {JSON.stringify(s.openingDenoms, null, 2)}{'\n'}
                            closingDenoms: {JSON.stringify(s.closingDenoms, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Start Shift Modal */}
      {showStart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Start Shift</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter your opening float breakdown</div>
              </div>
              <button onClick={() => setShowStart(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <DenomInput value={openingDenoms} onChange={setOpeningDenoms} label="Opening Float" />
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Notes (optional)</label>
              <input className="input" placeholder="e.g. Morning shift" value={startNotes} onChange={e => setStartNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowStart(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStartShift} disabled={starting}>
                {starting ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Start Shift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Shift Modal */}
      {showEnd && activeShift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>End Shift</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Count your cash and close the shift</div>
              </div>
              <button onClick={() => setShowEnd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>Opening Recap</div>
                <div style={{ background: 'var(--bg-card2)', padding: 16, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Opening Float:</span>
                    <strong>{fmt(activeShift.openingFloat)}</strong>
                  </div>
                </div>
              </div>
              <div>
                <DenomInput value={closingDenoms} onChange={setClosingDenoms} label="Closing Cash Count" />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Notes (optional)</label>
              <input className="input" placeholder="e.g. Quiet afternoon" value={endNotes} onChange={e => setEndNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowEnd(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444' }} onClick={handleEndShift} disabled={ending}>
                {ending ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'End Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}