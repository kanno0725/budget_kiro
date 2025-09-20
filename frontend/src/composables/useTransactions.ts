import { ref, computed } from 'vue'
import { useTransactionsStore } from '../stores/transactions'
import type { Transaction, TransactionFilters, CreateTransactionDto } from '../types'

export function useTransactions() {
  const transactionsStore = useTransactionsStore()

  // Local state
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const transactions = computed(() => transactionsStore.transactions)
  const totalIncome = computed(() => transactionsStore.totalIncome)
  const totalExpenses = computed(() => transactionsStore.totalExpenses)
  const balance = computed(() => transactionsStore.balance)
  const transactionsByCategory = computed(() => transactionsStore.transactionsByCategory)

  // Methods
  const fetchTransactions = async (filters?: TransactionFilters) => {
    isLoading.value = true
    error.value = null

    try {
      await transactionsStore.fetchTransactions(filters)
    } catch (err) {
      error.value = 'Failed to fetch transactions'
    } finally {
      isLoading.value = false
    }
  }

  const createTransaction = async (transactionData: CreateTransactionDto): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const success = await transactionsStore.createTransaction(transactionData)
      if (!success) {
        error.value = transactionsStore.error || 'Failed to create transaction'
      }
      return success
    } catch (err) {
      error.value = 'Failed to create transaction'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateTransaction = async (id: string, transactionData: Partial<Transaction>): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const success = await transactionsStore.updateTransaction(id, transactionData)
      if (!success) {
        error.value = transactionsStore.error || 'Failed to update transaction'
      }
      return success
    } catch (err) {
      error.value = 'Failed to update transaction'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteTransaction = async (id: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const success = await transactionsStore.deleteTransaction(id)
      if (!success) {
        error.value = transactionsStore.error || 'Failed to delete transaction'
      }
      return success
    } catch (err) {
      error.value = 'Failed to delete transaction'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const filterTransactions = (
    transactions: Transaction[],
    filters: TransactionFilters
  ): Transaction[] => {
    let filtered = [...transactions]

    if (filters.startDate) {
      filtered = filtered.filter(t => t.date >= filters.startDate!)
    }

    if (filters.endDate) {
      filtered = filtered.filter(t => t.date <= filters.endDate!)
    }

    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category)
    }

    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type)
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getTransactionsByDateRange = (startDate: string, endDate: string): Transaction[] => {
    return transactions.value.filter(t => t.date >= startDate && t.date <= endDate)
  }

  const getTransactionsByCategory = (category: string): Transaction[] => {
    return transactions.value.filter(t => t.category === category)
  }

  const getTransactionsByType = (type: 'INCOME' | 'EXPENSE'): Transaction[] => {
    return transactions.value.filter(t => t.type === type)
  }

  const clearError = () => {
    error.value = null
    transactionsStore.clearError()
  }

  return {
    // State
    isLoading,
    error,

    // Computed
    transactions,
    totalIncome,
    totalExpenses,
    balance,
    transactionsByCategory,

    // Methods
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    filterTransactions,
    getTransactionsByDateRange,
    getTransactionsByCategory,
    getTransactionsByType,
    clearError
  }
}
