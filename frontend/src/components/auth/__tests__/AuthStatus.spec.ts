import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import AuthStatus from '../AuthStatus.vue'
import { useAuthStore } from '../../../stores/auth'

// Mock the API service
vi.mock('../../../services/api', () => ({
  apiService: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      me: vi.fn(),
    }
  }
}))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } }
  ]
})

describe('AuthStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows login state when user is authenticated', async () => {
    const authStore = useAuthStore()

    // Mock authenticated state
    authStore.user = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User'
    }
    authStore.accessToken = 'mock-token'
    authStore.lastActivity = Date.now()

    const wrapper = mount(AuthStatus, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('ログイン済み')
    expect(wrapper.text()).toContain('Test User')
    expect(wrapper.text()).toContain('test@example.com')
  })

  it('shows login/register buttons when user is not authenticated', async () => {
    const wrapper = mount(AuthStatus, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('未ログイン')
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/register"]').exists()).toBe(true)
  })
})
