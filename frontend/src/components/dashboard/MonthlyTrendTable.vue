<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">月次推移</h3>
      <div class="flex items-center space-x-2">
        <select
          v-model="selectedPeriod"
          @change="$emit('periodChange', selectedPeriod)"
          class="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="6">過去6ヶ月</option>
          <option value="12">過去12ヶ月</option>
          <option value="24">過去24ヶ月</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center h-32">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>

    <div v-else-if="!hasData" class="text-center py-8 text-gray-500">
      <div class="text-4xl mb-2">📈</div>
      <p>表示するデータがありません</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              月
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              収入
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              支出
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              残高
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              貯蓄率
            </th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              傾向
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(item, index) in monthlyDataWithStats"
            :key="item.month"
            class="hover:bg-gray-50"
            :class="{ 'bg-blue-50': isCurrentMonth(item.month) }"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <span class="text-sm font-medium text-gray-900">{{ item.month }}</span>
                <span v-if="isCurrentMonth(item.month)" class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  今月
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
              {{ formatCurrency(item.income) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
              {{ formatCurrency(item.expenses) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" :class="getBalanceClass(item.balance)">
              {{ formatCurrency(item.balance) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm" :class="getSavingsRateClass(item.savingsRate)">
              {{ item.savingsRate }}%
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <div class="flex items-center justify-center space-x-1">
                <span class="text-lg">{{ getTrendIcon(item.trend) }}</span>
                <span class="text-xs text-gray-500">{{ getTrendText(item.trend) }}</span>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot class="bg-gray-50">
          <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
              平均
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
              {{ formatCurrency(averageIncome) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
              {{ formatCurrency(averageExpenses) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold" :class="getBalanceClass(averageBalance)">
              {{ formatCurrency(averageBalance) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold" :class="getSavingsRateClass(averageSavingsRate)">
              {{ averageSavingsRate }}%
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
              -
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharts, type MonthlyData } from '../../composables/useCharts'

interface MonthlyDataWithStats extends MonthlyData {
  balance: number
  savingsRate: string
  trend: 'up' | 'down' | 'stable'
}

interface Props {
  monthlyData: MonthlyData[]
  isLoading?: boolean
}

interface Emits {
  (e: 'periodChange', period: number): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

defineEmits<Emits>()

const selectedPeriod = ref(12)

const { formatCurrency } = useCharts()

const hasData = computed(() => props.monthlyData.length > 0)

const monthlyDataWithStats = computed((): MonthlyDataWithStats[] => {
  return props.monthlyData.map((item, index) => {
    const balance = item.income - item.expenses
    const savingsRate = item.income > 0 ? ((balance / item.income) * 100).toFixed(1) : '0.0'

    // 前月との比較で傾向を判定
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (index > 0) {
      const prevBalance = props.monthlyData[index - 1].income - props.monthlyData[index - 1].expenses
      if (balance > prevBalance * 1.05) trend = 'up'
      else if (balance < prevBalance * 0.95) trend = 'down'
    }

    return {
      ...item,
      balance,
      savingsRate,
      trend
    }
  })
})

const averageIncome = computed(() => {
  if (props.monthlyData.length === 0) return 0
  const total = props.monthlyData.reduce((sum, item) => sum + item.income, 0)
  return total / props.monthlyData.length
})

const averageExpenses = computed(() => {
  if (props.monthlyData.length === 0) return 0
  const total = props.monthlyData.reduce((sum, item) => sum + item.expenses, 0)
  return total / props.monthlyData.length
})

const averageBalance = computed(() => averageIncome.value - averageExpenses.value)

const averageSavingsRate = computed(() => {
  if (averageIncome.value === 0) return '0.0'
  return ((averageBalance.value / averageIncome.value) * 100).toFixed(1)
})

const isCurrentMonth = (month: string): boolean => {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  return month === currentMonth
}

const getBalanceClass = (balance: number): string => {
  return balance >= 0 ? 'text-green-600' : 'text-red-600'
}

const getSavingsRateClass = (savingsRate: string | number): string => {
  const rate = typeof savingsRate === 'string' ? parseFloat(savingsRate) : savingsRate
  if (rate >= 20) return 'text-green-600'
  if (rate >= 10) return 'text-yellow-600'
  return 'text-red-600'
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '📈'
    case 'down': return '📉'
    case 'stable': return '➡️'
    default: return '➡️'
  }
}

const getTrendText = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '改善'
    case 'down': return '悪化'
    case 'stable': return '安定'
    default: return '安定'
  }
}
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-sm border p-6;
}
</style>
