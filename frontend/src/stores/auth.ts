import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export interface User {
  id: string
  email: string
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastActivity = ref<number>(Date.now())
  const sessionTimeout = 30 * 60 * 1000 // 30 minutes in milliseconds

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  const login = async (credentials: { email: string; password: string }) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.auth.login(credentials)

      if (response.data.success && response.data.data) {
        user.value = response.data.data.user
        token.value = response.data.data.token
        localStorage.setItem('auth_token', token.value)
        updateActivity()
        return true
      } else {
        error.value = response.data.error?.message || 'Login failed'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: { email: string; password: string; name: string }) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.auth.register(userData)

      if (response.data.success && response.data.data) {
        user.value = response.data.data.user
        token.value = response.data.data.token
        localStorage.setItem('auth_token', token.value)
        updateActivity()
        return true
      } else {
        error.value = response.data.error?.message || 'Registration failed'
        return false
      }
    } catch (err: unknown) {
      error.value = err.response?.data?.error?.message || 'Registration failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await apiService.auth.logout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('auth_token')
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Update last activity timestamp
  const updateActivity = () => {
    lastActivity.value = Date.now()
  }

  // Check if session has expired
  const isSessionExpired = () => {
    if (!token.value) return false
    return Date.now() - lastActivity.value > sessionTimeout
  }

  // Auto logout on session timeout
  const checkSessionTimeout = () => {
    if (isAuthenticated.value && isSessionExpired()) {
      logout()
      error.value = 'セッションがタイムアウトしました。再度ログインしてください。'
    }
  }

  // Start session timeout checker
  const startSessionChecker = () => {
    // Check session every minute
    setInterval(checkSessionTimeout, 60 * 1000)

    // Update activity on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })
  }

  // Initialize user from token if available
  const initializeAuth = async () => {
    if (token.value) {
      try {
        // Try to get current user info to validate token
        const response = await apiService.auth.me()
        if (response.data.success && response.data.data) {
          user.value = response.data.data
        } else {
          // Token is invalid, clear it
          logout()
        }
      } catch (err) {
        // Token is invalid or network error, clear it
        console.error('Token validation failed:', err)
        logout()
      }
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    lastActivity,
    // Getters
    isAuthenticated,
    // Actions
    login,
    register,
    logout,
    clearError,
    initializeAuth,
    updateActivity,
    isSessionExpired,
    checkSessionTimeout,
    startSessionChecker,
  }
})
