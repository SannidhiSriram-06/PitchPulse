import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  timeout: 120000
})

// Attach Clerk JWT to every request
api.interceptors.request.use(async (config) => {
  try {
    const { getToken } = window.__clerk__ || {}
    if (getToken) {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch (e) {
    console.error('Token fetch failed:', e)
  }
  return config
})

// Redirect to login on 401 — but skip for public share routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isPublic = url.startsWith('/api/share/')
    if (error.response?.status === 401 && !isPublic) {
      window.location.href = '/sign-in'
    }
    return Promise.reject(error)
  }
)

export default api
