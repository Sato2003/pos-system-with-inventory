// components/DenomInput.jsx
// Denominations in descending order — coins stored as decimals (0.5 = 50¢, 0.25 = 25¢)
export const DENOMS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5, 0.25]

/**
 * Tolerates both number keys { 1000: 2 } and string keys { "1000": 2 }.
 * Uses fixed-point math to avoid floating point drift on coin values.
 */
export const calcDenomTotal = (denoms = {}) =>
  Math.round(
    DENOMS.reduce((sum, d) => sum + (Number(denoms[d] ?? denoms[String(d)]) || 0) * d, 0)
    * 100
  ) / 100

/** Human-readable label for a denomination value */
const denomLabel = (d) => {
  if (d >= 1000) return `₱${d / 1000}k`
  if (d === 0.5)  return '50¢'
  if (d === 0.25) return '25¢'
  return `₱${d}`
}

/** Format a subtotal, handling cents correctly */
const fmtSubtotal = (n) =>
  `₱${n.toLocaleString('en', { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 })}`

export default function DenomInput({ value, onChange, label = 'Cash Count' }) {
  const total = calcDenomTotal(value)

  const set = (denom, qty) =>
    onChange({ ...value, [denom]: Math.max(0, Number(qty) || 0) })

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
        <span style={{
          fontWeight: 700, fontSize: 18,
          color: 'var(--accent-green, #22c55e)',
        }}>
          ₱{total.toLocaleString('en', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Denom rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DENOMS.map(d => {
          const qty = Number(value[d] ?? value[String(d)]) || 0
          const subtotal = Math.round(qty * d * 100) / 100
          const isCoin = d < 1
          return (
            <div key={d} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 90px',
              alignItems: 'center', gap: 10,
              padding: '6px 10px', borderRadius: 8,
              background: qty > 0
                ? isCoin ? 'rgba(251,191,36,0.06)' : 'rgba(34,197,94,0.06)'
                : 'var(--bg-card2)',
              border: `1px solid ${qty > 0
                ? isCoin ? 'rgba(251,191,36,0.25)' : 'rgba(34,197,94,0.2)'
                : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>
              {/* Bill / coin label */}
              <div style={{
                fontWeight: 700, fontSize: 13,
                color: qty > 0
                  ? isCoin ? '#f59e0b' : '#22c55e'
                  : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono, monospace)',
              }}>
                {denomLabel(d)}
              </div>

              {/* Qty input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => set(d, qty - 1)}
                  disabled={qty === 0}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--bg-card)', cursor: qty === 0 ? 'default' : 'pointer',
                    color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: qty === 0 ? 0.4 : 1,
                  }}
                >−</button>
                <input
                  type="number"
                  min="0"
                  value={qty || ''}
                  placeholder="0"
                  onChange={e => set(d, e.target.value)}
                  style={{
                    width: 52, textAlign: 'center', padding: '4px 6px',
                    borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--bg-card)', color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600,
                  }}
                />
                <button
                  type="button"
                  onClick={() => set(d, qty + 1)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--bg-card)', cursor: 'pointer',
                    color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >+</button>
              </div>

              {/* Subtotal */}
              <div style={{
                textAlign: 'right', fontSize: 12,
                color: qty > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: qty > 0 ? 600 : 400,
              }}>
                {subtotal > 0 ? fmtSubtotal(subtotal) : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Total bar */}
      <div style={{
        marginTop: 12, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#22c55e', fontFamily: 'var(--font-mono, monospace)' }}>
          ₱{total.toLocaleString('en', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}