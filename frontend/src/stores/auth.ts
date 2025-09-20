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
        return true
      } else {
        error.value = response.data.error?.message || 'Registration failed'
        return false
      }
    } catch (err: any) {
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

  // Initialize user from token if available
  const initializeAuth = async () => {
    if (token.value) {
      // In a real app, you might want to validate the token with the server
      // For now, we'll assume the token is valid if it exists
      try {
        // You could add a /auth/me endpoint to get current user info
        // const response = await apiService.auth.me()
        // user.value = response.data.data
      } catch (err) {
        // Token is invalid, clear it
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
    // Getters
    isAuthenticated,
    // Actions
    login,
    register,
    logout,
    clearError,
    initializeAuth,
  }
})
