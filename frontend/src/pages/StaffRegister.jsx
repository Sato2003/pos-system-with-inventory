import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import { UserPlus, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, Shield, User, CheckCircle } from 'lucide-react'

const STEPS = ['Personal Info', 'Choose Role', 'Done']

export default function StaffRegister() {
  const navigate = useNavigate()
  const { notify } = useApp()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: null, // null = not yet chosen
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateStep1 = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name required'
    if (!form.lastName.trim()) e.lastName = 'Last name required'
    if (!form.userName.trim()) e.userName = 'Username required'
    if (!form.email.trim()) e.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password required'
    else if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) setStep(2)
  }

  const handleSubmit = async (isAdmin) => {
    setForm(f => ({ ...f, isAdmin }))
    setLoading(true)
    try {
      await authAPI.register({
        firstName: form.firstName,
        lastName: form.lastName,
        userName: form.userName,
        email: form.email,
        password: form.password,
        isAdmin,
      })
      setStep(3)
    } catch (err) {
      notify(err.response?.data?.message || 'Registration failed', 'error')
      setStep(2)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1.5px solid ${hasError ? 'var(--accent-red)' : 'var(--border)'}`,
    background: 'var(--bg-card2)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  })

  const errText = (key) => errors[key]
    ? <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors[key]}</div>
    : null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', top: '15%', left: '25%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>

        {/* Back button */}
        {step < 3 && (
          <button
            onClick={() => step === 1 ? navigate('/') : setStep(1)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 20, padding: 0 }}
          >
            <ArrowLeft size={14} /> {step === 1 ? 'Back to Login' : 'Back'}
          </button>
        )}

        {/* Step indicator */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
            {STEPS.slice(0, 2).map((label, i) => {
              const num = i + 1
              const active = step === num
              const done = step > num
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 1 ? 1 : 'unset' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'var(--accent-green)' : active ? 'var(--accent)' : 'var(--bg-card2)',
                      color: done || active ? '#fff' : 'var(--text-muted)',
                      border: `2px solid ${done ? 'var(--accent-green)' : active ? 'var(--accent)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}>
                      {done ? <CheckCircle size={14} /> : num}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                  </div>
                  {i < 1 && (
                    <div style={{ flex: 1, height: 1.5, background: step > 1 ? 'var(--accent)' : 'var(--border)', margin: '0 12px', transition: 'background 0.3s' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '32px 28px',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.25s ease',
        }}>

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 26 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
                }}>
                  <UserPlus size={24} color="#fff" />
                </div>
                <div style={{ fontSize: 19, fontWeight: 700 }}>Create Account</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Enter your personal information</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>First Name</label>
                  <input style={inputStyle(errors.firstName)} value={form.firstName} onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); setErrors(v => ({ ...v, firstName: '' })) }} placeholder="Juan" />
                  {errText('firstName')}
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Last Name</label>
                  <input style={inputStyle(errors.lastName)} value={form.lastName} onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); setErrors(v => ({ ...v, lastName: '' })) }} placeholder="Dela Cruz" />
                  {errText('lastName')}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Username</label>
                <input style={inputStyle(errors.userName)} value={form.userName} onChange={e => { setForm(f => ({ ...f, userName: e.target.value })); setErrors(v => ({ ...v, userName: '' })) }} placeholder="juandc" />
                {errText('userName')}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Email</label>
                <input type="email" style={inputStyle(errors.email)} value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(v => ({ ...v, email: '' })) }} placeholder="juan@example.com" />
                {errText('email')}
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} style={{ ...inputStyle(errors.password), paddingRight: 40 }} value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(v => ({ ...v, password: '' })) }} placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errText('password')}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Confirm Password</label>
                <input type="password" style={inputStyle(errors.confirmPassword)} value={form.confirmPassword} onChange={e => { setForm(f => ({ ...f, confirmPassword: e.target.value })); setErrors(v => ({ ...v, confirmPassword: '' })) }} placeholder="Re-enter password" />
                {errText('confirmPassword')}
              </div>

              <button
                onClick={handleNext}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 10,
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Continue <ArrowRight size={15} />
              </button>
            </>
          )}

          {/* ── STEP 2: Choose Role ── */}
          {step === 2 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 19, fontWeight: 700 }}>Choose Account Type</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                  Hi <strong style={{ color: 'var(--text-primary)' }}>{form.firstName}</strong>, what kind of account do you need?
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
                {/* Staff Card */}
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  style={{
                    padding: '20px 22px', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                    border: '2px solid var(--border)', background: 'var(--bg-card2)',
                    textAlign: 'left', transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59,130,246,0.06)' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={22} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Staff / Cashier</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Can process sales, scan barcodes, view products and sales history. Requires admin approval to activate.
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </button>

                {/* Admin Card */}
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  style={{
                    padding: '20px 22px', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                    border: '2px solid var(--border)', background: 'var(--bg-card2)',
                    textAlign: 'left', transition: 'all 0.15s', opacity: loading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139,92,246,0.06)' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={22} color="#8b5cf6" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Administrator</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Full access — manage products, inventory, users, reports, and all system settings.
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </button>
              </div>

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                  <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Creating your account...
                </div>
              )}
            </>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px',
              }}>
                <CheckCircle size={34} color="var(--accent-green)" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Account Created!</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 6 }}>
                Welcome, <strong style={{ color: 'var(--text-primary)' }}>{form.firstName} {form.lastName}</strong>!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 }}>
                {form.isAdmin
                  ? 'Your admin account is ready. You can log in now.'
                  : 'Your staff account is pending admin approval. You will be able to log in once an admin activates your account.'}
              </div>
              <button
                onClick={() => navigate('/')}
                style={{
                  width: '100%', padding: '11px 16px', borderRadius: 10,
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}