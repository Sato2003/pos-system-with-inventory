import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { applyTheme } from '../App'
import { testPrint, checkPrinterStatus, setupPrinter, connectUsbPrinter, disconnectUsbPrinter, isPrinterConnected } from '../utils/ReceiptPrinter'
import { settingsAPI } from '../utils/api'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Printer, 
  DollarSign, 
  Percent, 
  Shield, 
  Moon, 
  Sun,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  TestTube,
  Usb,
  Monitor
} from 'lucide-react'

export default function Settings({ currentUser }) {
  const { notify } = useApp()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [initialLoad, setInitialLoad] = useState(true)

  const [settings, setSettings] = useState({
    companyName: 'Inventory & POS System',
    companyEmail: 'admin@possystem.com',
    companyPhone: '+63 912 345 6789',
    companyAddress: '123 Main Street, Manila, Philippines',
    taxRate: 12,
    defaultDiscount: 0,
    enableAutoDiscount: false,
    receiptHeader: 'THANK YOU FOR SHOPPING!',
    receiptFooter: 'Please come again!',
    showReceiptLogo: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    dailySalesReport: true,
    emailReports: false,
    printerType: 'thermal',
    printerConnection: 'browser',
    paperWidth: '80mm',
    autoPrintReceipt: true,
    copiesToPrint: 1,
    sessionTimeout: 30,
    requirePasswordForRefund: true,
    twoFactorAuth: false,
    theme: 'dark',
    compactView: false,
    cashDrawerPort: 'COM1',
    openDrawerOnPayment: true,
  })

  // Printer testing state
  const [printerStatus, setPrinterStatus] = useState(null)
  const [testingPrinter, setTestingPrinter] = useState(false)

  // Load settings from API on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings()
      const serverSettings = response.data
      setSettings(prev => ({ ...prev, ...serverSettings }))
      if (serverSettings.theme) applyTheme(serverSettings.theme)
    } catch (error) {
      console.warn('Failed to load settings from server, using defaults:', error.message)
      // Keep default settings if API fails
    } finally {
      setInitialLoad(false)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      await settingsAPI.updateSettings(settings)
      notify('Settings saved successfully!', 'success')
    } catch (error) {
      console.error('Failed to save settings:', error)
      notify('Failed to save settings: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetSettings = async () => {
    if (!window.confirm('Reset all settings to default values? This will affect all users.')) return

    setLoading(true)
    try {
      await settingsAPI.resetSettings()
      await loadSettings() // Reload settings from server
      notify('Settings reset to default', 'info')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      notify('Failed to reset settings: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleThemeChange = (theme) => {
    updateSetting('theme', theme)
    applyTheme(theme)
  }

  // Printer testing functions
  const testPrinterConnection = async () => {
    setTestingPrinter(true)
    try {
      const status = await checkPrinterStatus()
      setPrinterStatus(status)
      if (status.success !== false) {
        notify('Printer status checked successfully', 'success')
      } else {
        notify(status.message || 'Printer check failed', 'warning')
      }
    } catch (error) {
      setPrinterStatus({ success: false, message: error.message })
      notify('Failed to check printer status', 'error')
    } finally {
      setTestingPrinter(false)
    }
  }

  const handleTestPrint = async () => {
    setTestingPrinter(true)
    try {
      const result = await testPrint(settings)
      if (result.success) {
        notify('Test receipt printed successfully!', 'success')
      } else {
        notify(result.message, 'warning')
      }
    } catch (error) {
      notify('Test print failed: ' + error.message, 'error')
    } finally {
      setTestingPrinter(false)
    }
  }

  const handlePrinterSetup = async () => {
    setTestingPrinter(true)
    try {
      const result = await setupPrinter()
      if (result.success) {
        notify(result.message, 'success')
        updateSetting('printerConnection', 'usb')
      } else {
        notify(result.message, 'warning')
      }
    } catch (error) {
      notify('Printer setup failed: ' + error.message, 'error')
    } finally {
      setTestingPrinter(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'tax', label: 'Tax & Discount', icon: Percent },
    { id: 'receipt', label: 'Receipt', icon: Printer },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: settings.theme === 'dark' ? Moon : Sun },
  ]

  if (!currentUser?.isAdmin) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Access Denied</div>
        <div style={{ color: 'var(--text-muted)' }}>Only administrators can access settings.</div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">System Settings</div>
          <div className="page-subtitle">Configure your POS system preferences</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={resetSettings}>
            <RefreshCw size={15} /> Reset
          </button>
          <button className="btn btn-primary" onClick={saveSettings} disabled={loading}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Save size={15} />}
            Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Sidebar tabs */}
        <div style={{ width: 200, flexShrink: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                marginBottom: 4,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>

          {/* General */}
          {activeTab === 'general' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>Company Information</h3>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="input" value={settings.companyName} onChange={e => updateSetting('companyName', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Company Email</label>
                  <input type="email" className="input" value={settings.companyEmail} onChange={e => updateSetting('companyEmail', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Phone</label>
                  <input className="input" value={settings.companyPhone} onChange={e => updateSetting('companyPhone', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Company Address</label>
                <textarea className="input" rows={3} value={settings.companyAddress} onChange={e => updateSetting('companyAddress', e.target.value)} />
              </div>
            </div>
          )}

          {/* Tax & Discount */}
          {activeTab === 'tax' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>Tax & Discount Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input type="number" className="input" value={settings.taxRate} onChange={e => updateSetting('taxRate', parseFloat(e.target.value) || 0)} min="0" max="100" step="0.5" />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Current tax: {settings.taxRate}%</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Discount (%)</label>
                  <input type="number" className="input" value={settings.defaultDiscount} onChange={e => updateSetting('defaultDiscount', parseFloat(e.target.value) || 0)} min="0" max="100" />
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.enableAutoDiscount} onChange={e => updateSetting('enableAutoDiscount', e.target.checked)} />
                  <span>Enable automatic discount for bulk purchases</span>
                </label>
              </div>
            </div>
          )}

          {/* Receipt */}
          {activeTab === 'receipt' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>Receipt Configuration</h3>
              <div className="form-group">
                <label className="form-label">Receipt Header Message</label>
                <input className="input" value={settings.receiptHeader} onChange={e => updateSetting('receiptHeader', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Receipt Footer Message</label>
                <input className="input" value={settings.receiptFooter} onChange={e => updateSetting('receiptFooter', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Printer Type</label>
                  <select className="input" value={settings.printerType} onChange={e => updateSetting('printerType', e.target.value)}>
                    <option value="thermal">Thermal Printer</option>
                    <option value="dotmatrix">Dot Matrix</option>
                    <option value="inkjet">Inkjet</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Paper Width</label>
                  <select className="input" value={settings.paperWidth} onChange={e => updateSetting('paperWidth', e.target.value)}>
                    <option value="58mm">58mm (Mobile)</option>
                    <option value="80mm">80mm (Standard)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Printer Connection</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => updateSetting('printerConnection', 'browser')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${settings.printerConnection === 'browser' ? 'var(--accent)' : 'var(--border)'}`,
                      background: settings.printerConnection === 'browser' ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <Monitor size={16} />
                    Browser Print
                  </button>
                  <button
                    onClick={() => updateSetting('printerConnection', 'usb')}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${settings.printerConnection === 'usb' ? 'var(--accent)' : 'var(--border)'}`,
                      background: settings.printerConnection === 'usb' ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <Usb size={16} />
                    USB Printer
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {settings.printerConnection === 'usb' ? 'Requires Chrome/Edge browser and compatible thermal printer' : 'Prints using browser print dialog'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Number of Copies</label>
                  <input type="number" className="input" value={settings.copiesToPrint} onChange={e => updateSetting('copiesToPrint', parseInt(e.target.value) || 1)} min="1" max="5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Printer Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-card2)' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: printerStatus?.connected ? 'var(--accent-green)' : printerStatus?.available === false ? 'var(--accent-red)' : 'var(--text-muted)'
                    }} />
                    <span style={{ fontSize: 12 }}>
                      {printerStatus ? printerStatus.message : 'Not checked'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.autoPrintReceipt} onChange={e => updateSetting('autoPrintReceipt', e.target.checked)} />
                  <span>Auto-print receipt after payment</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.showReceiptLogo} onChange={e => updateSetting('showReceiptLogo', e.target.checked)} />
                  <span>Show company logo on receipt</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  className="btn btn-ghost"
                  onClick={testPrinterConnection}
                  disabled={testingPrinter}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {testingPrinter ? <Loader2 size={14} className="spin" /> : <TestTube size={14} />}
                  Check Printer
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={handlePrinterSetup}
                  disabled={testingPrinter}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {testingPrinter ? <Loader2 size={14} className="spin" /> : <Usb size={14} />}
                  Setup USB Printer
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={handleTestPrint}
                  disabled={testingPrinter}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {testingPrinter ? <Loader2 size={14} className="spin" /> : <Printer size={14} />}
                  Test Print
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>Notification Preferences</h3>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.lowStockAlert} onChange={e => updateSetting('lowStockAlert', e.target.checked)} />
                  <span>Enable low stock alerts</span>
                </label>
              </div>
              {settings.lowStockAlert && (
                <div className="form-group" style={{ marginLeft: 24 }}>
                  <label className="form-label">Low Stock Threshold</label>
                  <input type="number" className="input" value={settings.lowStockThreshold} onChange={e => updateSetting('lowStockThreshold', parseInt(e.target.value) || 10)} min="1" />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Alert when stock is below {settings.lowStockThreshold} units</div>
                </div>
              )}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.dailySalesReport} onChange={e => updateSetting('dailySalesReport', e.target.checked)} />
                  <span>Send daily sales report</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.emailReports} onChange={e => updateSetting('emailReports', e.target.checked)} />
                  <span>Send reports via email</span>
                </label>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>Security Settings</h3>
              <div className="form-group">
                <label className="form-label">Session Timeout (minutes)</label>
                <input type="number" className="input" value={settings.sessionTimeout} onChange={e => updateSetting('sessionTimeout', parseInt(e.target.value) || 30)} min="5" max="120" />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Auto logout after {settings.sessionTimeout} minutes of inactivity</div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.requirePasswordForRefund} onChange={e => updateSetting('requirePasswordForRefund', e.target.checked)} />
                  <span>Require password for refunds</span>
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.twoFactorAuth} onChange={e => updateSetting('twoFactorAuth', e.target.checked)} />
                  <span>Enable Two-Factor Authentication (2FA)</span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Cash Drawer Port</label>
                <input className="input" value={settings.cashDrawerPort} onChange={e => updateSetting('cashDrawerPort', e.target.value)} placeholder="COM1, COM2, USB001, etc." />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.openDrawerOnPayment} onChange={e => updateSetting('openDrawerOnPayment', e.target.checked)} />
                  <span>Open cash drawer automatically on payment</span>
                </label>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ marginBottom: 20, fontSize: 16 }}>Appearance</h3>
              <div className="form-group">
                <label className="form-label">Theme</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => handleThemeChange('light')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${settings.theme === 'light' ? 'var(--accent)' : 'var(--border)'}`,
                      background: settings.theme === 'light' ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Sun size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div>Light</div>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${settings.theme === 'dark' ? 'var(--accent)' : 'var(--border)'}`,
                      background: settings.theme === 'dark' ? 'rgba(59,130,246,0.1)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Moon size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div>Dark</div>
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.compactView} onChange={e => updateSetting('compactView', e.target.checked)} />
                  <span>Compact view (show more items per page)</span>
                </label>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
            Settings are saved to the server and apply to all users. Only administrators can modify settings.
          </div>
        </div>
      </div>
    </div>
  )
}