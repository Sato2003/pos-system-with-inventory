import { useApp } from '../context/AppContext'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function Notification() {
  const { notification } = useApp()
  if (!notification) return null

  const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle }
  const colors = { success: 'var(--accent-green)', error: 'var(--accent-red)', warning: 'var(--accent-yellow)' }
  const Icon = icons[notification.type] || CheckCircle

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: 'var(--shadow)', animation: 'slideUp 0.2s',
      color: colors[notification.type]
    }}>
      <Icon size={18} />
      <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{notification.msg}</span>
    </div>
  )
}