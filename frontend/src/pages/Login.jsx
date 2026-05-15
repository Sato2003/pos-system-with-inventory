import { useState } from 'react'
import { ShoppingCart, Eye, EyeOff, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { Link } from 'react-router-dom'


export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    if (error) setError('')
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password })
      const { token, user } = res.data
      if (form.remember) {
        localStorage.setItem('pos_token', token)
        localStorage.setItem('pos_user', JSON.stringify(user))
      } else {
        sessionStorage.setItem('pos_token', token)
        sessionStorage.setItem('pos_user', JSON.stringify(user))
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      onLogin(user)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          }}>
            <ShoppingCart size={28} color="#fff" />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Inventory & POS System</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign in to your account</div>
        </div>


        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            color: 'var(--accent-red)', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={handle}
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handle}
                autoComplete="current-password"
                disabled={loading}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handle}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Remember me</span>
            </label>
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}
              onClick={() => alert('Contact your administrator to reset your password.')}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          Inventory & POS System v1.0
        </div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/register" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
            Register New Staff Account
          </Link>
        </div>
      </div>
    </div>
  )
}