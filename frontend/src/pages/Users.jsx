import { useState, useEffect } from 'react'
import { userAPI, authAPI } from '../utils/api'
import { useApp } from '../context/AppContext'
import { Users as UsersIcon, UserPlus, Shield, User, Search, X, Eye, EyeOff, Loader2, ToggleLeft, ToggleRight, Pencil, KeyRound } from 'lucide-react'

const EMPTY_FORM = { firstName: '', lastName: '', userName: '', email: '', password: '', isAdmin: false }

export default function Users({ currentUser }) {
  const { notify } = useApp()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')
  const [editModal, setEditModal] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editErrors, setEditErrors] = useState({})
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [resetModal, setResetModal] = useState(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [showResetPass, setShowResetPass] = useState(false)

  const isAdmin = currentUser?.isAdmin

  const fetchUsers = () => {
    setLoading(true)
    userAPI.getAll()
      .then(r => {
        let data = []
        if (Array.isArray(r.data)) data = r.data
        else if (Array.isArray(r.data?.users)) data = r.data.users
        else if (Array.isArray(r.data?.data)) data = r.data.data
        setUsers(data)
      })
      .catch(() => notify('Failed to load users', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const bySearch = `${u.firstName} ${u.lastName} ${u.email} ${u.userName}`.toLowerCase().includes(search.toLowerCase())
    const byStatus = statusFilter === 'all' ? true
      : statusFilter === 'active' ? u.isActive
      : statusFilter === 'pending' ? !u.isActive && !u.isAdmin
      : !u.isActive
    return bySearch && byStatus
  })

  // ── Create validation ──
  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.userName.trim()) e.userName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Required'
    else if (form.password.length < 6) e.password = 'Min 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Create submit ──
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await authAPI.register({ ...form, isActive: true })
      notify(`${form.isAdmin ? 'Admin' : 'Staff'} account created!`)
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchUsers()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to create account', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Toggle active ──
  const toggleActive = async (user) => {
    try {
      await userAPI.update(user._id, { isActive: !user.isActive, isAdmin: user.isAdmin })
      notify(`User ${user.isActive ? 'deactivated' : 'activated'}`)
      fetchUsers()
    } catch {
      notify('Failed to update user', 'error')
    }
  }

  // ── Edit modal ──
  const openEdit = (user) => {
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    })
    setEditErrors({})
    setEditModal(user)
  }

  const validateEdit = () => {
    const e = {}
    if (!editForm.firstName?.trim()) e.firstName = 'Required'
    if (!editForm.lastName?.trim()) e.lastName = 'Required'
    if (!editForm.userName?.trim()) e.userName = 'Required'
    if (!editForm.email?.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(editForm.email)) e.email = 'Invalid email'
    setEditErrors(e)
    return Object.keys(e).length === 0
  }

  const handleEditSubmit = async () => {
    if (!validateEdit()) return
    setEditSubmitting(true)
    try {
      await userAPI.update(editModal._id, editForm)
      notify('User updated successfully')
      setEditModal(null)
      fetchUsers()
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update user', 'error')
    } finally {
      setEditSubmitting(false)
    }
  }

  // ── Reset password ──
  const handleResetPassword = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      notify('Password must be at least 6 characters', 'error')
      return
    }
    setResetSubmitting(true)
    try {
      await userAPI.resetPassword(resetModal._id, resetPassword)
      notify('Password reset successfully')
      setResetModal(null)
      setResetPassword('')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to reset password', 'error')
    } finally {
      setResetSubmitting(false)
    }
  }

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">Manage admin and staff accounts</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setErrors({}) }}>
            <UserPlus size={15} /> Add Account
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Accounts', value: users.length, icon: UsersIcon, color: '#3b82f6' },
          { label: 'Admins', value: users.filter(u => u.isAdmin).length, icon: Shield, color: '#8b5cf6' },
          { label: 'Staff', value: users.filter(u => !u.isAdmin).length, icon: User, color: '#22c55e' },
          { label: 'Pending Approval', value: users.filter(u => !u.isActive && !u.isAdmin).length, icon: X, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              <s.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontWeight: 600 }}>All Accounts</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'active', 'pending'].map(f => (
              <button key={f} className={`btn btn-ghost btn-sm${statusFilter === f ? ' active' : ''}`} onClick={() => setStatusFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" style={{ paddingLeft: 32, width: 220 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: u.isAdmin ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)',
                        color: u.isAdmin ? '#8b5cf6' : '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>@{u.userName}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.isAdmin ? 'badge-purple' : 'badge-blue'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {u.isAdmin ? <><Shield size={10} /> Admin</> : <><User size={10} /> Staff</>}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : u.isAdmin ? 'Inactive' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(u.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {/* Edit */}
                        <button className="btn btn-ghost btn-sm" title="Edit user" onClick={() => openEdit(u)}>
                          <Pencil size={14} />
                        </button>
                        {/* Toggle active — not self */}
                        {u._id !== currentUser?._id && (
                          <button
                            className="btn btn-ghost btn-sm"
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleActive(u)}
                            style={{ color: u.isActive ? 'var(--accent-red)' : 'var(--accent-green)' }}
                          >
                            {u.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          </button>
                        )}
                        {/* Reset password — not self */}
                        {u._id !== currentUser?._id && (
                          <button className="btn btn-ghost btn-sm" title="Reset password" onClick={() => { setResetModal(u); setResetPassword(''); setShowResetPass(false) }}>
                            <KeyRound size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Account Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Create New Account</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Register a new admin or staff member</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[{ label: 'Staff', val: false, icon: User, color: '#3b82f6' }, { label: 'Admin', val: true, icon: Shield, color: '#8b5cf6' }].map(r => (
                <button key={r.label} onClick={() => field('isAdmin', r.val)} style={{
                  padding: '12px 16px', borderRadius: 10,
                  border: `2px solid ${form.isAdmin === r.val ? r.color : 'var(--border)'}`,
                  background: form.isAdmin === r.val ? r.color + '15' : 'var(--bg-card2)',
                  color: form.isAdmin === r.val ? r.color : 'var(--text-secondary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                }}>
                  <r.icon size={15} />{r.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ key: 'firstName', label: 'First Name', placeholder: 'Juan' }, { key: 'lastName', label: 'Last Name', placeholder: 'Dela Cruz' }].map(f => (
                <div className="form-group" key={f.key} style={{ marginBottom: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input className={`input${errors[f.key] ? ' input-error' : ''}`} placeholder={f.placeholder} value={form[f.key]} onChange={e => { field(f.key, e.target.value); setErrors(v => ({ ...v, [f.key]: '' })) }} />
                  {errors[f.key] && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors[f.key]}</div>}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Username</label>
              <input className={`input${errors.userName ? ' input-error' : ''}`} placeholder="juandc" value={form.userName} onChange={e => { field('userName', e.target.value); setErrors(v => ({ ...v, userName: '' })) }} />
              {errors.userName && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.userName}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className={`input${errors.email ? ' input-error' : ''}`} type="email" placeholder="juan@example.com" value={form.email} onChange={e => { field('email', e.target.value); setErrors(v => ({ ...v, email: '' })) }} />
              {errors.email && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className={`input${errors.password ? ' input-error' : ''}`} type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => { field('password', e.target.value); setErrors(v => ({ ...v, password: '' })) }} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{errors.password}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating...</> : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Edit User</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Update account details and role</div>
              </div>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {/* Role selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[{ label: 'Staff', val: false, icon: User, color: '#3b82f6' }, { label: 'Admin', val: true, icon: Shield, color: '#8b5cf6' }].map(r => (
                <button key={r.label} onClick={() => setEditForm(f => ({ ...f, isAdmin: r.val }))} style={{
                  padding: '12px 16px', borderRadius: 10,
                  border: `2px solid ${editForm.isAdmin === r.val ? r.color : 'var(--border)'}`,
                  background: editForm.isAdmin === r.val ? r.color + '15' : 'var(--bg-card2)',
                  color: editForm.isAdmin === r.val ? r.color : 'var(--text-secondary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                }}>
                  <r.icon size={15} />{r.label}
                </button>
              ))}
            </div>

            {/* Active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-card2)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Account Active</span>
              <button onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: editForm.isActive ? 'var(--accent-green)' : 'var(--text-muted)', display: 'flex' }}>
                {editForm.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ key: 'firstName', label: 'First Name' }, { key: 'lastName', label: 'Last Name' }].map(f => (
                <div className="form-group" key={f.key} style={{ marginBottom: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input className={`input${editErrors[f.key] ? ' input-error' : ''}`} value={editForm[f.key] || ''} onChange={e => setEditForm(v => ({ ...v, [f.key]: e.target.value }))} />
                  {editErrors[f.key] && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{editErrors[f.key]}</div>}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Username</label>
              <input className={`input${editErrors.userName ? ' input-error' : ''}`} value={editForm.userName || ''} onChange={e => setEditForm(v => ({ ...v, userName: e.target.value }))} />
              {editErrors.userName && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{editErrors.userName}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className={`input${editErrors.email ? ' input-error' : ''}`} type="email" value={editForm.email || ''} onChange={e => setEditForm(v => ({ ...v, email: e.target.value }))} />
              {editErrors.email && <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>{editErrors.email}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setEditModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleEditSubmit} disabled={editSubmitting}>
                {editSubmitting ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Reset Password</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Set a new password for <strong>{resetModal.firstName} {resetModal.lastName}</strong>
                </div>
              </div>
              <button onClick={() => setResetModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showResetPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowResetPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showResetPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setResetModal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleResetPassword} disabled={resetSubmitting}>
                {resetSubmitting ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> Resetting...</> : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}