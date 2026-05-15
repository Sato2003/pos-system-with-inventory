import { useState, useEffect } from 'react'
import { saleAPI } from '../utils/api'
import { 
  TrendingUp, ShoppingBag, Package, User, Calendar, ChevronRight, Award,
  Clock, Target, Star, Zap, Coffee, Smile, Rocket, Sparkles,
  Eye, BarChart3, Receipt, Wallet
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function MyStatus({ currentUser }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    loading: true
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [todayStats, setTodayStats] = useState({
    todaySales: 0,
    todayOrders: 0
  })
  const [weeklyGoal, setWeeklyGoal] = useState(5000)
  const [weeklyProgress, setWeeklyProgress] = useState(0)

  useEffect(() => {
    if (currentUser && !currentUser.isAdmin) {
      fetchStaffStats()
      fetchRecentActivity()
      fetchTodayStats()
      fetchWeeklyProgress()
    }
  }, [currentUser])

  const fetchStaffStats = async () => {
  try {
    const response = await saleAPI.getStaffStats(currentUser._id)
    setStats({
      totalSales: response.data.totalSales || 0,
      totalOrders: response.data.totalOrders || 0,
      totalProducts: response.data.totalProducts || 0,
      loading: false
    })
  } catch (error) {
    console.error('Error fetching staff stats:', error)
    setStats(prev => ({ ...prev, loading: false }))
  }
}

  const fetchRecentActivity = async () => {
  try {
    const response = await saleAPI.getAll({ limit: 20 })
    const allSales = response.data?.sales || response.data || []
    // Filter to only this staff member's sales
    const mySales = allSales.filter(s => 
      s.cashier === currentUser._id || 
      s.cashierName === `${currentUser.firstName} ${currentUser.lastName}`
    )
    setRecentActivity(mySales.slice(0, 5))
  } catch (error) {
    console.error('Error fetching recent activity:', error)
  }
}
  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await saleAPI.getAll({ startDate: today, limit: 100 })
      const todaySalesData = response.data?.sales || response.data || []
      const totalTodaySales = todaySalesData.reduce((sum, sale) => sum + (sale.total || 0), 0)
      setTodayStats({
        todaySales: totalTodaySales,
        todayOrders: todaySalesData.length
      })
    } catch (error) {
      console.error('Error fetching today stats:', error)
    }
  }

  const fetchWeeklyProgress = async () => {
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const response = await saleAPI.getAll({ startDate: weekAgo.toISOString().split('T')[0], limit: 500 })
      const weekSales = response.data?.sales || response.data || []
      const totalWeekSales = weekSales.reduce((sum, sale) => sum + (sale.total || 0), 0)
      const progressPercent = Math.min(100, (totalWeekSales / weeklyGoal) * 100)
      setWeeklyProgress(progressPercent)
    } catch (error) {
      console.error('Error fetching weekly progress:', error)
    }
  }

  const handleNavigate = (path) => {
    navigate(path)
  }

  const handleViewReceipt = (receiptNumber) => {
    navigate(`/sales?search=${receiptNumber}`)
  }

  if (!currentUser || currentUser.isAdmin) {
    return null
  }

  if (stats.loading) {
    return (
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div className="spinner" style={{ width: 24, height: 24 }} />
          <span style={{ color: 'var(--text-muted)' }}>Loading your performance stats...</span>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      key: 'sales',
      label: 'My Total Sales',
      value: `₱${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      sub: 'Total revenue generated',
      action: () => handleNavigate('/sales'),
      buttonText: 'View Sales History'
    },
    {
      key: 'orders',
      label: 'My Orders',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      sub: 'Transactions completed',
      action: () => handleNavigate('/sales'),
      buttonText: 'View Orders'
    },
    {
      key: 'products',
      label: 'Products Sold',
      value: stats.totalProducts,
      icon: Package,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
      sub: 'Units sold',
      action: () => handleNavigate('/pos'),
      buttonText: 'Start Selling'
    }
  ]

  const quickActions = [
    {
      label: 'New Sale',
      icon: Zap,
      color: '#22c55e',
      action: () => handleNavigate('/pos'),
      description: 'Start a new transaction'
    },
    {
      label: 'View Reports',
      icon: BarChart3,
      color: '#3b82f6',
      action: () => handleNavigate('/reports'),
      description: 'See your performance'
    },
    {
      label: 'Browse Products',
      icon: Eye,
      color: '#8b5cf6',
      action: () => handleNavigate('/products'),
      description: 'Check inventory'
    },
    {
      label: 'Recent Sales',
      icon: Receipt,
      color: '#f59e0b',
      action: () => handleNavigate('/sales'),
      description: 'View transaction history'
    }
  ]

  const getPerformanceMessage = () => {
    const percentage = stats.totalOrders === 0 ? 0 : (stats.totalOrders / 100) * 100
    if (stats.totalOrders === 0) {
      return { text: "🌟 Welcome! Make your first sale to get started.", icon: Sparkles, color: '#f59e0b' }
    } else if (stats.totalOrders < 10) {
      return { text: "📈 Great start! Keep up the momentum.", icon: Rocket, color: '#3b82f6' }
    } else if (stats.totalOrders < 50) {
      return { text: "⭐ Excellent performance! You're doing great.", icon: Star, color: '#8b5cf6' }
    } else if (stats.totalOrders < 100) {
      return { text: "🏆 Outstanding! You're a top performer!", icon: Award, color: '#22c55e' }
    } else {
      return { text: "👑 Legendary! You're crushing your goals!", icon: Target, color: '#ef4444' }
    }
  }

  const performance = getPerformanceMessage()
  const PerformanceIcon = performance.icon

  return (
    <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
      {/* Header with gradient */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))',
        padding: '20px 24px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={28} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Staff Dashboard</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{currentUser?.firstName} {currentUser?.lastName}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>@{currentUser?.userName || currentUser?.email}</div>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '8px 16px',
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <PerformanceIcon size={14} />
            {performance.text}
          </div>
        </div>
      </div>

      {/* Today's Stats Mini Bar */}
      <div style={{
        padding: '12px 24px',
        background: 'var(--bg-card2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today's Sales</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>
              ₱{todayStats.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Today's Orders</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{todayStats.todayOrders}</div>
          </div>
          <div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekly Goal</span>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6' }}>
  {weeklyProgress.toFixed(0)}%
</div>
          </div>
        </div>
        <button
          onClick={() => handleNavigate('/sales')}
          style={{
            background: 'var(--accent)',
            border: 'none',
            padding: '6px 14px',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Clock size={12} /> View Today
        </button>
      </div>

      {/* Weekly Goal Progress Bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--text-muted)' }}>Weekly Goal Progress</span>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
  {weeklyProgress.toFixed(0)}% complete
</span>
        </div>
        <div style={{
          height: 6,
          background: 'var(--bg-card2)',
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${weeklyProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--accent-green))',
            borderRadius: 3,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Stats Grid - Clickable Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)' }}>
        {statCards.map((s) => (
          <div
            key={s.key}
            onClick={s.action}
            style={{
              background: 'var(--bg-card)',
              padding: '20px 16px',
              transition: 'all 0.15s',
              cursor: 'pointer',
              textAlign: 'center'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-card)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <s.icon size={24} color={s.color} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {s.sub}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                s.action()
              }}
              style={{
                marginTop: 12,
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${s.color}`,
                background: 'transparent',
                color: s.color,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = s.color
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = s.color
              }}
            >
              {s.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions Section */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Zap size={14} color="var(--accent)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>QUICK ACTIONS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.action}
              style={{
                padding: '12px',
                borderRadius: 10,
                background: 'var(--bg-card2)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'center'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = action.color
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <action.icon size={20} color={action.color} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {action.label}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {action.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>RECENT ACTIVITY</span>
          </div>
          <button
            onClick={() => handleNavigate('/sales')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: 11,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            View All <ChevronRight size={12} />
          </button>
        </div>
        {recentActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActivity.slice(0, 3).map((sale, idx) => (
              <div
                key={idx}
                onClick={() => handleViewReceipt(sale.receiptNumber)}
                style={{
                  background: 'var(--bg-card2)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card2)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Wallet size={14} color="var(--accent-green)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent-green)' }}>
                      ₱{sale.total?.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {sale.receiptNumber}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(sale.createdAt).toLocaleString('en', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '24px',
            color: 'var(--text-muted)',
            background: 'var(--bg-card2)',
            borderRadius: 8
          }}>
            <Coffee size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <div style={{ fontSize: 13 }}>No sales yet</div>
            <button
              onClick={() => handleNavigate('/pos')}
              style={{
                marginTop: 12,
                background: 'var(--accent)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                color: '#fff',
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              Start Selling
            </button>
          </div>
        )}
      </div>

      {/* Motivation Footer */}
      {stats.totalOrders > 0 && (
        <div style={{
          padding: '12px 24px',
          background: 'rgba(34,197,94,0.08)',
          borderTop: '1px solid rgba(34,197,94,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, color: 'var(--accent-green)' }}>
            <Smile size={14} style={{ display: 'inline', marginRight: 6 }} />
            Keep up the great work! You've made {stats.totalOrders} customer{stats.totalOrders !== 1 ? 's' : ''} happy today!
          </div>
        </div>
      )}
    </div>
  )
}