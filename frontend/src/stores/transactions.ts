import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export interface Transaction {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  userId: string
  createdAt: string
  updatedAt: string
}

export const useTransactionsStore = defineStore('transactions', () => {
  // State
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalIncome = computed(() =>
    transactions.value
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
  )

  const totalExpenses = computed(() =>
    transactions.value
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )

  const balance = computed(() => totalIncome.value - totalExpenses.value)

  const transactionsByCategory = computed(() => {
    const categories: Record<string, { total: number; count: number; transactions: Transaction[] }> = {}

    transactions.value.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = {
          total: 0,
          count: 0,
          transactions: []
        }
      }

      categories[transaction.category].total += Math.abs(transaction.amount)
      categories[transaction.category].count += 1
      categories[transaction.category].transactions.push(transaction)
    })

    return categories
  })

  // Actions
  const fetchTransactions = async (filters?: {
    startDate?: string
    endDate?: string
    category?: string
  }) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.transactions.getAll(filters)

      if (response.data.success && response.data.data) {
        transactions.value = response.data.data
      } else {
        error.value = response.data.error?.message || 'Failed to fetch transactions'
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch transactions'
    } finally {
      isLoading.value = false
    }
  }

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.transactions.create(transactionData)

      if (response.data.success && response.data.data) {
        transactions.value.unshift(response.data.data)
        return true
      } else {
        error.value = response.data.error?.message || 'Failed to create transaction'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create transaction'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.transactions.update(id, transactionData)

      if (response.data.success && response.data.data) {
        const index = transactions.value.findIndex(t => t.id === id)
        if (index !== -1) {
          transactions.value[index] = response.data.data
        }
        return true
      } else {
        error.value = response.data.error?.message || 'Failed to update transaction'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to update transaction'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.transactions.delete(id)

      if (response.data.success) {
        transactions.value = transactions.value.filter(t => t.id !== id)
        return true
      } else {
        error.value = response.data.error?.message || 'Failed to delete transaction'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to delete transaction'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    transactions,
    isLoading,
    error,
    // Getters
    totalIncome,
    totalExpenses,
    balance,
    transactionsByCategory,
    // Actions
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearError,
  }
})
