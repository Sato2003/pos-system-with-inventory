import { useState } from 'react'
import { userAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import { User, Mail, Lock, Loader2, Save, Eye, EyeOff } from 'lucide-react'

export default function Profile({ currentUser, onUpdate }) {
  const { notify } = useApp()
  const [form, setForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    userName: currentUser?.userName || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.userName.trim()) e.userName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (form.newPassword) {
      if (!form.currentPassword) e.currentPassword = 'Required to change password'
      if (form.newPassword.length < 6) e.newPassword = 'Min 6 characters'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        userName: form.userName,
        email: form.email,
      }
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }
      const res = await userAPI.updateMyProfile(payload)
      notify('Profile updated successfully')
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }))
      onUpdate?.(res.data)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Profile</div>
          <div className="page-subtitle">Update your personal information and password</div>
        </div>
      </div>

      <div style={{ maxWidth: 520 }}>
        {/* Avatar */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: currentUser?.isAdmin ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
            color: currentUser?.isAdmin ? '#8b5cf6' : '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700,
          }}>
            {form.firstName?.[0]}{form.lastName?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser?.isAdmin ? 'Administrator' : 'Staff'}</div>
          </div>
        </div>

        {/* Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={15} /> Personal Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' }].map(f => (
              <div className="form-group" key={f.key} style={{ marginBottom: 0 }}>
                <label className="form-label">{f.label}</label>
                <input className={`input${errors[f.key] ? ' input-error' : ''}`} value={form[f.key]} onChange={e => { field(f.key, e.target.value); setErrors(v => ({ ...v, [f.key]: '' })) }} />
                {errors[f.key] && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors[f.key]}</div>}
              </div>
            ))}
          </div>

          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Username</label>
            <input className={`input${errors.userName ? ' input-error' : ''}`} value={form.userName} onChange={e => { field('userName', e.target.value); setErrors(v => ({ ...v, userName: '' })) }} />
            {errors.userName && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.userName}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input className={`input${errors.email ? ' input-error' : ''}`} type="email" value={form.email} onChange={e => { field('email', e.target.value); setErrors(v => ({ ...v, email: '' })) }} />
            {errors.email && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.email}</div>}
          </div>
        </div>

        {/* Password */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={15} /> Change Password <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
          </div>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input className={`input${errors.currentPassword ? ' input-error' : ''}`} type={showCurrent ? 'text' : 'password'} placeholder="Enter current password" value={form.currentPassword} onChange={e => { field('currentPassword', e.target.value); setErrors(v => ({ ...v, currentPassword: '' })) }} style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowCurrent(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.currentPassword && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.currentPassword}</div>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input className={`input${errors.newPassword ? ' input-error' : ''}`} type={showNew ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.newPassword} onChange={e => { field('newPassword', e.target.value); setErrors(v => ({ ...v, newPassword: '' })) }} style={{ paddingRight: 40 }} />
              <button type="button" onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.newPassword && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.newPassword}</div>}
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit} disabled={submitting}>
          {submitting ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}