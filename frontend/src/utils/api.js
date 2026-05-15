import axios from 'axios'

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

console.log('🔗 API URL:', API_URL)

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach JWT token to every request ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token') || sessionStorage.getItem('pos_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ── Products ──────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  getSummary: () => api.get('/products/summary'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  restock: (id, quantity) => api.patch(`/products/${id}/restock`, { quantity }),
}

// ── Sales ─────────────────────────────────────────────────────────────────────
export const saleAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getAnalytics: (params) => api.get('/sales/analytics', { params }),
  getStaffStats: (userId) => api.get(`/sales/staff-stats/${userId}`),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, newPassword) => api.put(`/users/${id}/reset-password`, { newPassword }),
  updateMyProfile: (data) => api.put('/users/profile/me', data),
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  resetSettings: () => api.post('/settings/reset'),
}

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadAPI = {
  image: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// ── Shifts ────────────────────────────────────────────────────────────────────
export const shiftAPI = {
  getActive:  ()           => api.get('/shifts/active'),
  start:      (data)       => api.post('/shifts/start', data),
  end:        (id, data)   => api.put(`/shifts/${id}/end`, data),
  getAll:     ()           => api.get('/shifts'),
  getById:    (id)         => api.get(`/shifts/${id}`),
}

// ── Refunds ───────────────────────────────────────────────────────────────────
export const refundAPI = {
  create: (data) => api.post('/refunds', data),
  getAll: (params) => api.get('/refunds', { params }),
  getById: (id) => api.get(`/refunds/${id}`),
  getAnalytics: (params) => api.get('/refunds/analytics', { params }),
}

export default api
