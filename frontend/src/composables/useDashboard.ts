import { ref, computed } from 'vue'
import { useTransactionsStore, type Transaction } from '../stores/transactions'
import type { CategoryData, MonthlyData } from './useCharts'

export interface DashboardPeriod {
  startDate: string
  endDate: string
  type: string
}

export const useDashboard = () => {
  const transactionsStore = useTransactionsStore()

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentPeriod = ref<DashboardPeriod>({
    startDate: '',
    endDate: '',
    type: 'current-month'
  })

  // 現在の期間のデータを取得
  const loadDashboardData = async (period: DashboardPeriod) => {
    try {
      isLoading.value = true
      error.value = null
      currentPeriod.value = period

      await transactionsStore.fetchTransactions({
        startDate: period.startDate,
        endDate: period.endDate
      })
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'データの取得に失敗しました'
    } finally {
      isLoading.value = false
    }
  }

  // 前月のデータを取得（比較用）
  const loadPreviousMonthData = async () => {
    const currentDate = new Date()
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)

    try {
      const response = await transactionsStore.fetchTransactions({
        startDate: previousMonth.toISOString().split('T')[0],
        endDate: previousMonthEnd.toISOString().split('T')[0]
      })

      // 前月のデータを一時的に保存
      const previousTransactions = [...transactionsStore.transactions]

      // 現在の期間のデータを再取得
      await loadDashboardData(currentPeriod.value)

      return previousTransactions
    } catch (err) {
      console.error('前月データの取得に失敗:', err)
      return []
    }
  }

  // 月次推移データを生成
  const generateMonthlyTrendData = (months: number = 12): MonthlyData[] => {
    const monthlyData: MonthlyData[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      // その月の取引をフィルタリング
      const monthTransactions = transactionsStore.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      })

      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      monthlyData.push({
        month: `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        income,
        expenses
      })
    }

    return monthlyData
  }

  // カテゴリ別データを生成
  const generateCategoryData = (): CategoryData[] => {
    const categoryMap = new Map<string, number>()

    // 支出のみを対象とする
    const expenses = transactionsStore.transactions.filter(t => t.type === 'EXPENSE')

    expenses.forEach(transaction => {
      const amount = Math.abs(transaction.amount)
      const current = categoryMap.get(transaction.category) || 0
      categoryMap.set(transaction.category, current + amount)
    })

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount) // 金額の多い順にソート
  }

  // 現在の期間の収支計算
  const currentPeriodSummary = computed(() => {
    const income = transactionsStore.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactionsStore.transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      income,
      expenses,
      balance: income - expenses
    }
  })

  // 前月との比較データを計算
  const calculatePreviousMonthComparison = (previousTransactions: Transaction[]) => {
    const previousIncome = previousTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const previousExpenses = previousTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      previousIncome,
      previousExpenses
    }
  }

  // データ更新
  const refreshData = async () => {
    await loadDashboardData(currentPeriod.value)
  }

  // 期間変更
  const changePeriod = async (period: DashboardPeriod) => {
    await loadDashboardData(period)
  }

  return {
    // State
    isLoading,
    error,
    currentPeriod,

    // Computed
    currentPeriodSummary,

    // Actions
    loadDashboardData,
    loadPreviousMonthData,
    generateMonthlyTrendData,
    generateCategoryData,
    calculatePreviousMonthComparison,
    refreshData,
    changePeriod,

    // Store access
    transactions: computed(() => transactionsStore.transactions),
    storeLoading: computed(() => transactionsStore.isLoading),
    storeError: computed(() => transactionsStore.error)
  }
}
