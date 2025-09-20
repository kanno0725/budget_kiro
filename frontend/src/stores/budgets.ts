import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'
import type { Budget, CreateBudgetDto, ApiResponse, LoadingState } from '../types'

export const useBudgetStore = defineStore('budgets', () => {
  // State
  const budgets = ref<Budget[]>([])
  const loadingState = ref<LoadingState>('idle')
  const error = ref<string | null>(null)

  // Getters
  const isLoading = computed(() => loadingState.value === 'loading')
  const hasError = computed(() => loadingState.value === 'error')

  // Get budgets for specific month/year
  const getBudgetsForPeriod = computed(() => {
    return (month: number, year: number) => {
      return budgets.value.filter(budget =>
        budget.month === month && budget.year === year
      )
    }
  })

  // Get budget by category for specific period
  const getBudgetByCategory = computed(() => {
    return (category: string, month: number, year: number) => {
      return budgets.value.find(budget =>
        budget.category === category &&
        budget.month === month &&
        budget.year === year
      )
    }
  })

  // Actions
  const fetchBudgets = async () => {
    try {
      loadingState.value = 'loading'
      error.value = null

      const response = await apiService.budgets.getAll()

      if (response.data.success && response.data.data) {
        budgets.value = response.data.data
        loadingState.value = 'success'
      } else {
        throw new Error(response.data.error?.message || '予算データの取得に失敗しました')
      }
    } catch (err) {
      console.error('Failed to fetch budgets:', err)
      error.value = err instanceof Error ? err.message : '予算データの取得に失敗しました'
      loadingState.value = 'error'
    }
  }

  const createBudget = async (budgetData: CreateBudgetDto) => {
    try {
      loadingState.value = 'loading'
      error.value = null

      const response = await apiService.budgets.create(budgetData)

      if (response.data.success && response.data.data) {
        budgets.value.push(response.data.data)
        loadingState.value = 'success'
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || '予算の作成に失敗しました')
      }
    } catch (err) {
      console.error('Failed to create budget:', err)
      error.value = err instanceof Error ? err.message : '予算の作成に失敗しました'
      loadingState.value = 'error'
      throw err
    }
  }

  const updateBudget = async (id: string, budgetData: Partial<CreateBudgetDto>) => {
    try {
      loadingState.value = 'loading'
      error.value = null

      const response = await apiService.budgets.update(id, budgetData)

      if (response.data.success && response.data.data) {
        const index = budgets.value.findIndex(budget => budget.id === id)
        if (index !== -1) {
          budgets.value[index] = response.data.data
        }
        loadingState.value = 'success'
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || '予算の更新に失敗しました')
      }
    } catch (err) {
      console.error('Failed to update budget:', err)
      error.value = err instanceof Error ? err.message : '予算の更新に失敗しました'
      loadingState.value = 'error'
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    budgets.value = []
    loadingState.value = 'idle'
    error.value = null
  }

  return {
    // State
    budgets,
    loadingState,
    error,

    // Getters
    isLoading,
    hasError,
    getBudgetsForPeriod,
    getBudgetByCategory,

    // Actions
    fetchBudgets,
    createBudget,
    updateBudget,
    clearError,
    reset
  }
})
