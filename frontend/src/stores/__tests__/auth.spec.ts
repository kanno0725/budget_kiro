import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      me: vi.fn(),
    }
  }
}))

import { useAuthStore } from '../auth'
import { apiService } from '../../services/api'

const mockApiService = apiService as unknown

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should login successfully', async () => {
    const authStore = useAuthStore()

    // Mock successful login response
    mockApiService.auth.login.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          accessToken: 'mock-access-token'
        }
      }
    })

    const result = await authStore.login({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result).toBe(true)
    expect(authStore.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    })
    expect(authStore.accessToken).toBe('mock-access-token')
    expect(authStore.isAuthenticated).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-access-token')
  })

  it('should handle login failure', async () => {
    const authStore = useAuthStore()

    // Mock failed login response
    mockApiService.auth.login.mockResolvedValue({
      data: {
        success: false,
        error: { message: 'Invalid credentials' }
      }
    })

    const result = await authStore.login({
      email: 'test@example.com',
      password: 'wrongpassword'
    })

    expect(result).toBe(false)
    expect(authStore.user).toBe(null)
    expect(authStore.accessToken).toBe(null)
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.error).toBe('Invalid credentials')
  })

  it('should register successfully', async () => {
    const authStore = useAuthStore()

    // Mock successful register response
    mockApiService.auth.register.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          accessToken: 'mock-access-token'
        }
      }
    })

    const result = await authStore.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })

    expect(result).toBe(true)
    expect(authStore.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    })
    expect(authStore.accessToken).toBe('mock-access-token')
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('should logout successfully', async () => {
    const authStore = useAuthStore()

    // Set initial authenticated state
    authStore.user = { id: '1', email: 'test@example.com', name: 'Test User' }
    authStore.accessToken = 'mock-access-token'

    await authStore.logout()

    expect(authStore.user).toBe(null)
    expect(authStore.accessToken).toBe(null)
    expect(authStore.isAuthenticated).toBe(false)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
  })

  it('should check session timeout', () => {
    const authStore = useAuthStore()

    // Set authenticated state with old activity
    authStore.user = { id: '1', email: 'test@example.com', name: 'Test User' }
    authStore.accessToken = 'mock-access-token'
    authStore.lastActivity = Date.now() - (31 * 60 * 1000) // 31 minutes ago

    expect(authStore.isSessionExpired()).toBe(true)
  })
})
