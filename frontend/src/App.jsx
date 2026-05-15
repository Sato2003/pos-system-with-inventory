import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'
import Notification from './components/Notification'
import Dashboard from './pages/Dashboard'
import POS from "./pages/Pos";
import Login from './pages/Login'
import Users from './pages/Users'
import api from './utils/api'
import StaffRegister from './pages/StaffRegister'
import Settings from './pages/Settings'
import Products from './pages/Products'
import Categories from './pages/Categories'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Shifts from './pages/Shifts'  // ✅ ADD THIS IMPORT
import RefundHistory from './pages/RefundHistory'



const Placeholder = ({ name }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, flexDirection: 'column', gap: 12 }}>
    <div style={{ fontSize: 48 }}>🚧</div>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{name}</div>
    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>This page is coming soon.</div>
  </div>
)

function getStoredAuth() {
  try {
    const token = localStorage.getItem('pos_token') || sessionStorage.getItem('pos_token')
    const user = localStorage.getItem('pos_user') || sessionStorage.getItem('pos_user')
    if (token && user) return { token, user: JSON.parse(user) }
  } catch {}
  return null
}

// ✅ Export this function to use in Settings
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  // ✅ Apply saved theme on app load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pos_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.theme) applyTheme(parsed.theme)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const stored = getStoredAuth()
    if (stored) {
      api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`
      setUser(stored.user)
    }
    setChecking(false)
  }, [])

  const handleLogin = (userData) => setUser(userData)

  const handleLogout = () => {
    localStorage.removeItem('pos_token')
    localStorage.removeItem('pos_user')
    sessionStorage.removeItem('pos_token')
    sessionStorage.removeItem('pos_user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
      <div className="spinner" />
    </div>
  )

  if (!user) return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/register" element={<StaffRegister />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
        <Notification />
      </AppProvider>
    </BrowserRouter>
  )

  return (
    <BrowserRouter>
      <AppProvider>
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
  <Route path="/" element={<Dashboard currentUser={user} />} />
  <Route path="/pos" element={<POS />} />
  <Route path="/products" element={<Products currentUser={user} />} />
  <Route path="/categories" element={<Categories currentUser={user} />} />
  <Route path="/stock-in" element={<StockIn currentUser={user} />} />
  <Route path="/stock-out" element={<StockOut currentUser={user} />} />
  <Route path="/sales" element={<Sales currentUser={user} />} />
  <Route path="/reports" element={<Reports currentUser={user} />} />
  <Route path="/users" element={<Users currentUser={user} />} />
  <Route path="/settings" element={<Settings currentUser={user} />} />
  <Route path="/shifts" element={<Shifts currentUser={user} />} />
  <Route path="/refunds" element={<RefundHistory currentUser={user} />} />  {/* ← MOVE HERE */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
        </Layout>
        <Notification />
      </AppProvider>
    </BrowserRouter>
  )
}
