import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import { useAuthStore } from '../stores/auth'

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    const authStore = useAuthStore()

    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      authStore.logout()
      window.location.href = '/login'
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
    }

    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// API service methods
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', credentials),

    register: (userData: { email: string; password: string; name: string }) =>
      api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', userData),

    logout: () => api.post<ApiResponse>('/auth/logout'),
  },

  // Transaction endpoints
  transactions: {
    getAll: (params?: { startDate?: string; endDate?: string; category?: string }) =>
      api.get<ApiResponse<any[]>>('/transactions', { params }),

    create: (transaction: any) =>
      api.post<ApiResponse<any>>('/transactions', transaction),

    update: (id: string, transaction: any) =>
      api.put<ApiResponse<any>>(`/transactions/${id}`, transaction),

    delete: (id: string) =>
      api.delete<ApiResponse>(`/transactions/${id}`),
  },

  // Budget endpoints
  budgets: {
    getAll: () => api.get<ApiResponse<any[]>>('/budgets'),

    create: (budget: any) =>
      api.post<ApiResponse<any>>('/budgets', budget),

    update: (id: string, budget: any) =>
      api.put<ApiResponse<any>>(`/budgets/${id}`, budget),
  },

  // Dashboard endpoints
  dashboard: {
    getSummary: (params?: { month?: number; year?: number }) =>
      api.get<ApiResponse<any>>('/dashboard/summary', { params }),

    getCategoryData: (params?: { month?: number; year?: number }) =>
      api.get<ApiResponse<any>>('/dashboard/categories', { params }),

    getMonthlyTrend: (params?: { months?: number }) =>
      api.get<ApiResponse<any>>('/dashboard/trend', { params }),
  },

  // Group endpoints
  groups: {
    getAll: () => api.get<ApiResponse<any[]>>('/groups'),

    create: (group: { name: string }) =>
      api.post<ApiResponse<any>>('/groups', group),

    join: (groupId: string, inviteCode: string) =>
      api.post<ApiResponse>(`/groups/${groupId}/join`, { inviteCode }),

    getExpenses: (groupId: string) =>
      api.get<ApiResponse<any[]>>(`/groups/${groupId}/expenses`),

    createExpense: (groupId: string, expense: any) =>
      api.post<ApiResponse<any>>(`/groups/${groupId}/expenses`, expense),

    getBalances: (groupId: string) =>
      api.get<ApiResponse<any>>(`/groups/${groupId}/balances`),

    splitEqually: (groupId: string) =>
      api.post<ApiResponse>(`/groups/${groupId}/split-equally`),

    getSettlements: (groupId: string) =>
      api.get<ApiResponse<any[]>>(`/groups/${groupId}/settlements`),
  },

  // Export endpoints
  export: {
    transactions: (params?: { startDate?: string; endDate?: string }) =>
      api.get('/export/transactions', {
        params,
        responseType: 'blob',
        headers: { 'Accept': 'text/csv' }
      }),

    budgets: () =>
      api.get('/export/budgets', {
        responseType: 'blob',
        headers: { 'Accept': 'text/csv' }
      }),

    groups: (groupId: string) =>
      api.get(`/export/groups/${groupId}`, {
        responseType: 'blob',
        headers: { 'Accept': 'text/csv' }
      }),
  },
}

export default api
