import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../useAuth'

// Mock the auth store
vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  }))
}))

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
    { path: '/dashboard', component: { template: '<div>Dashboard</div>' } }
  ]
})

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should login and redirect to dashboard', async () => {
    const { login } = useAuth()
    const mockAuthStore = await import('../../stores/auth')

    // Mock successful login
    mockAuthStore.useAuthStore().login.mockResolvedValue(true)

    const routerPushSpy = vi.spyOn(router, 'push').mockResolvedValue()

    const result = await login(
      { email: 'test@example.com', password: 'password' },
      { immediateRedirect: true }
    )

    expect(result).toBe(true)
    expect(routerPushSpy).toHaveBeenCalledWith('/dashboard')
  })

  it('should login and redirect to custom path', async () => {
    const { login } = useAuth()
    const mockAuthStore = await import('../../stores/auth')

    // Mock successful login
    mockAuthStore.useAuthStore().login.mockResolvedValue(true)

    const routerPushSpy = vi.spyOn(router, 'push').mockResolvedValue()

    const result = await login(
      { email: 'test@example.com', password: 'password' },
      { redirectTo: '/transactions', immediateRedirect: true }
    )

    expect(result).toBe(true)
    expect(routerPushSpy).toHaveBeenCalledWith('/transactions')
  })

  it('should handle login failure', async () => {
    const { login } = useAuth()
    const mockAuthStore = await import('../../stores/auth')

    // Mock failed login
    mockAuthStore.useAuthStore().login.mockResolvedValue(false)

    const routerPushSpy = vi.spyOn(router, 'push')

    const result = await login(
      { email: 'test@example.com', password: 'wrongpassword' },
      { immediateRedirect: true }
    )

    expect(result).toBe(false)
    expect(routerPushSpy).not.toHaveBeenCalled()
  })

  it('should register and redirect to dashboard', async () => {
    const { register } = useAuth()
    const mockAuthStore = await import('../../stores/auth')

    // Mock successful registration
    mockAuthStore.useAuthStore().register.mockResolvedValue(true)

    const routerPushSpy = vi.spyOn(router, 'push').mockResolvedValue()

    const result = await register(
      { name: 'Test User', email: 'test@example.com', password: 'password' },
      { immediateRedirect: true }
    )

    expect(result).toBe(true)
    expect(routerPushSpy).toHaveBeenCalledWith('/dashboard')
  })
})
