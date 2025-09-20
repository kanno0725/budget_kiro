import { ref, computed, onMounted } from 'vue'
import { useBudgetStore } from '../stores/budgets'
import { useTransactionsStore } from '../stores/transactions'
import type { Budget, Transaction, BudgetForm } from '../types'

export interface BudgetProgress {
  category: string
  budget: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
  isNearLimit: boolean
}

export interface BudgetAlert {
  category: string
  type: 'warning' | 'danger'
  message: string
  percentage: number
}

export function useBudgets() {
  const budgetStore = useBudgetStore()
  const transactionStore = useTransactionsStore()

  const currentMonth = ref(new Date().getMonth() + 1)
  const currentYear = ref(new Date().getFullYear())

  // Computed properties
  const budgets = computed(() => budgetStore.budgets)
  const isLoading = computed(() => budgetStore.isLoading || transactionStore.isLoading)
  const error = computed(() => budgetStore.error || transactionStore.error)

  // Get current period budgets
  const currentBudgets = computed(() => {
    return budgetStore.getBudgetsForPeriod(currentMonth.value, currentYear.value)
  })

  // Calculate budget progress for current period
  const budgetProgress = computed((): BudgetProgress[] => {
    const budgets = currentBudgets.value
    const transactions = transactionStore.transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate.getMonth() + 1 === currentMonth.value &&
             transactionDate.getFullYear() === currentYear.value &&
             t.type === 'EXPENSE'
    })

    return budgets.map(budget => {
      const categoryTransactions = transactions.filter(t => t.category === budget.category)
      const spent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const remaining = budget.amount - spent
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0

      return {
        category: budget.category,
        budget: budget.amount,
        spent,
        remaining,
        percentage,
        isOverBudget: spent > budget.amount,
        isNearLimit: percentage >= 80 && percentage < 100
      }
    })
  })

  // Generate budget alerts
  const budgetAlerts = computed((): BudgetAlert[] => {
    return budgetProgress.value
      .filter(progress => progress.isNearLimit || progress.isOverBudget)
      .map(progress => ({
        category: progress.category,
        type: progress.isOverBudget ? 'danger' : 'warning',
        message: progress.isOverBudget
          ? `${progress.category}の予算を${Math.round(progress.percentage - 100)}%超過しています`
          : `${progress.category}の予算の${Math.round(progress.percentage)}%を使用しています`,
        percentage: progress.percentage
      }))
  })

  // Budget vs actual comparison data for charts
  const budgetComparisonData = computed(() => {
    return budgetProgress.value.map(progress => ({
      category: progress.category,
      budget: progress.budget,
      actual: progress.spent
    }))
  })

  // Actions
  const fetchBudgets = async () => {
    await budgetStore.fetchBudgets()
  }

  const fetchTransactions = async () => {
    await transactionStore.fetchTransactions()
  }

  const createBudget = async (budgetData: BudgetForm) => {
    const createData = {
      category: budgetData.category,
      amount: typeof budgetData.amount === 'string' ? parseFloat(budgetData.amount) : budgetData.amount,
      month: budgetData.month,
      year: budgetData.year
    }

    return await budgetStore.createBudget(createData)
  }

  const updateBudget = async (id: string, budgetData: Partial<BudgetForm>) => {
    const updateData: any = {}

    if (budgetData.category) updateData.category = budgetData.category
    if (budgetData.amount) {
      updateData.amount = typeof budgetData.amount === 'string'
        ? parseFloat(budgetData.amount)
        : budgetData.amount
    }
    if (budgetData.month) updateData.month = budgetData.month
    if (budgetData.year) updateData.year = budgetData.year

    return await budgetStore.updateBudget(id, updateData)
  }

  const setBudgetPeriod = (month: number, year: number) => {
    currentMonth.value = month
    currentYear.value = year
  }

  const clearError = () => {
    budgetStore.clearError()
    transactionStore.clearError()
  }

  // Initialize data on mount
  onMounted(() => {
    fetchBudgets()
    fetchTransactions()
  })

  return {
    // State
    budgets,
    currentBudgets,
    currentMonth,
    currentYear,
    isLoading,
    error,

    // Computed
    budgetProgress,
    budgetAlerts,
    budgetComparisonData,

    // Actions
    fetchBudgets,
    fetchTransactions,
    createBudget,
    updateBudget,
    setBudgetPeriod,
    clearError
  }
}
