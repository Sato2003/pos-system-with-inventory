import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Tag, TrendingDown,
  TrendingUp, BarChart2, Users, Settings, Boxes, LogOut, Menu, X, Clock, Undo2
} from 'lucide-react'
import './Layout.css'

const NAV_ALL = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'POS' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: Tag, label: 'Categories', adminOnly: true },
  { to: '/stock-in', icon: TrendingUp, label: 'Stock In', adminOnly: true },
  { to: '/stock-out', icon: TrendingDown, label: 'Stock Out', adminOnly: true },
  { to: '/sales', icon: BarChart2, label: 'Sales' },
  { to: '/reports', icon: Boxes, label: 'Reports' },
  { to: '/shifts', icon: Clock, label: 'Shifts' },  // ← ADD THIS LINE
   { to: '/refunds', icon: Undo2, label: 'Refunds' },  // ← ADD THIS LINE
  { to: '/users', icon: Users, label: 'Users', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Settings', adminOnly: true },

]

export default function Layout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 640) setSidebarOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const NAV = NAV_ALL.filter(item => !item.adminOnly || user?.isAdmin)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.firstName
      ? `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase()
      : 'U'

  const displayName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : user?.isAdmin ? 'Administrator' : 'Staff'

  return (
    <div className="layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon"><ShoppingCart size={18} /></div>
          <div>
            <div className="logo-title">Inventory & POS</div>
            <div className="logo-sub">Management System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div className="user-role">{displayRole}</div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                  borderRadius: 6, transition: 'color 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="topbar">
          {/* Hamburger — mobile only */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="topbar-title">Inventory & POS System</div>

          <div className="topbar-actions">
            <div className="topbar-dot green" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Connected</span>
          </div>
        </div>

        <div className="page-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}