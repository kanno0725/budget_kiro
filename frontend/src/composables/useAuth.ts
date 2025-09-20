import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface AuthOptions {
  redirectTo?: string
  showSuccessMessage?: boolean
  immediateRedirect?: boolean
}

export const useAuth = () => {
  const router = useRouter()
  const authStore = useAuthStore()

  const isLoggingIn = ref(false)
  const isRegistering = ref(false)
  const loginSuccess = ref(false)
  const registerSuccess = ref(false)

  /**
   * Login with credentials and redirect to dashboard or specified path
   */
  const login = async (credentials: LoginCredentials, options: AuthOptions = {}) => {
    try {
      isLoggingIn.value = true
      loginSuccess.value = false
      authStore.clearError()

      const success = await authStore.login(credentials)

      if (success) {
        loginSuccess.value = true

        // Determine redirect path
        const redirectPath = options.redirectTo || '/dashboard'

        // Perform navigation
        const performNavigation = () => {
          router.push(redirectPath).catch((error) => {
            console.error('Navigation error:', error)
            // Fallback to dashboard if redirect fails
            router.push('/dashboard')
          })
        }

        // Check if immediate redirect is requested
        if (options.immediateRedirect) {
          performNavigation()
        } else {
          // Add a small delay to show success state if requested
          const delay = options.showSuccessMessage ? 1000 : 0
          setTimeout(performNavigation, delay)
        }

        return true
      } else {
        loginSuccess.value = false
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      loginSuccess.value = false
      return false
    } finally {
      isLoggingIn.value = false
    }
  }

  /**
   * Register with user data and redirect to dashboard
   */
  const register = async (userData: RegisterData, options: AuthOptions = {}) => {
    try {
      isRegistering.value = true
      registerSuccess.value = false
      authStore.clearError()

      const success = await authStore.register(userData)

      if (success) {
        registerSuccess.value = true

        // Determine redirect path
        const redirectPath = options.redirectTo || '/dashboard'

        // Perform navigation
        const performNavigation = () => {
          router.push(redirectPath).catch((error) => {
            console.error('Navigation error:', error)
            // Fallback to dashboard if redirect fails
            router.push('/dashboard')
          })
        }

        // Check if immediate redirect is requested
        if (options.immediateRedirect) {
          performNavigation()
        } else {
          // Add a small delay to show success state if requested
          const delay = options.showSuccessMessage ? 1000 : 0
          setTimeout(performNavigation, delay)
        }

        return true
      } else {
        registerSuccess.value = false
        return false
      }
    } catch (error) {
      console.error('Register error:', error)
      registerSuccess.value = false
      return false
    } finally {
      isRegistering.value = false
    }
  }

  /**
   * Logout and redirect to login page
   */
  const logout = async (redirectTo: string = '/login') => {
    try {
      await authStore.logout()
      router.push(redirectTo)
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      router.push(redirectTo)
    }
  }

  /**
   * Check if user is authenticated and redirect if not
   */
  const requireAuth = (redirectTo: string = '/login') => {
    if (!authStore.isAuthenticated) {
      router.push({
        path: redirectTo,
        query: { redirect: router.currentRoute.value.fullPath }
      })
      return false
    }
    return true
  }

  /**
   * Redirect authenticated users away from auth pages
   */
  const redirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
    if (authStore.isAuthenticated) {
      router.push(redirectTo)
      return true
    }
    return false
  }

  return {
    // State
    isLoggingIn,
    isRegistering,
    loginSuccess,
    registerSuccess,

    // Store access
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    error: authStore.error,

    // Actions
    login,
    register,
    logout,
    requireAuth,
    redirectIfAuthenticated,

    // Store actions
    clearError: authStore.clearError,
  }
}
