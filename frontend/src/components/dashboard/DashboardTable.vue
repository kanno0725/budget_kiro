<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">ダッシュボード概要</h3>
      <div class="flex items-center space-x-2">
        <button
          @click="toggleView"
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          {{ viewMode === 'summary' ? '詳細表示' : 'サマリー表示' }}
        </button>
      </div>
    </div>

    <!-- サマリーテーブル -->
    <div v-if="viewMode === 'summary'" class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              項目
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              今月
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              前月
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              変化
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              変化率
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- 収入行 -->
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <span class="text-green-600 text-lg mr-2">📈</span>
                <span class="text-sm font-medium text-gray-900">収入</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
              {{ formatCurrency(monthlyIncome) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
              {{ formatCurrency(previousMonthIncome) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm" :class="incomeChangeClass">
              {{ formatCurrency(incomeChange) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm" :class="incomeChangeClass">
              {{ incomeChangePercent }}%
            </td>
          </tr>

          <!-- 支出行 -->
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <span class="text-red-600 text-lg mr-2">📉</span>
                <span class="text-sm font-medium text-gray-900">支出</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
              {{ formatCurrency(monthlyExpenses) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
              {{ formatCurrency(previousMonthExpenses) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm" :class="expenseChangeClass">
              {{ formatCurrency(expenseChange) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm" :class="expenseChangeClass">
              {{ expenseChangePercent }}%
            </td>
          </tr>

          <!-- 残高行 -->
          <tr class="hover:bg-gray-50 border-t-2 border-gray-300">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <span class="text-lg mr-2" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ balance >= 0 ? '💰' : '⚠️' }}
                </span>
                <span class="text-sm font-bold text-gray-900">残高</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold" :class="balanceClass">
              {{ formatCurrency(balance) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
              {{ formatCurrency(previousBalance) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm" :class="balanceChangeClass">
              {{ formatCurrency(balanceChange) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" :class="balanceClass">
              貯蓄率: {{ savingsRate }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- カテゴリ別詳細テーブル -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              カテゴリ
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              金額
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              割合
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              取引数
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              平均額
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(item, index) in categoryDataWithStats" :key="item.category" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div
                  class="w-3 h-3 rounded-full mr-3"
                  :style="{ backgroundColor: getCategoryColor(index) }"
                ></div>
                <span class="text-sm font-medium text-gray-900">{{ item.category }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
              {{ formatCurrency(item.amount) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
              {{ item.percentage.toFixed(1) }}%
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
              {{ item.transactionCount }}件
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
              {{ formatCurrency(item.averageAmount) }}
            </td>
          </tr>

          <!-- 合計行 -->
          <tr class="border-t-2 border-gray-300 bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="text-sm font-bold text-gray-900">合計</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
              {{ formatCurrency(totalCategoryAmount) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
              100.0%
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
              {{ totalTransactionCount }}件
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
              {{ formatCurrency(overallAverageAmount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- データがない場合 -->
    <div v-if="!hasData" class="text-center py-8 text-gray-500">
      <div class="text-4xl mb-2">📊</div>
      <p>表示するデータがありません</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharts, type CategoryData } from '../../composables/useCharts'

interface CategoryDataWithStats extends CategoryData {
  percentage: number
  transactionCount: number
  averageAmount: number
}

interface Props {
  monthlyIncome: number
  monthlyExpenses: number
  previousMonthIncome: number
  previousMonthExpenses: number
  categoryData: CategoryData[]
  transactions: any[]
}

const props = defineProps<Props>()

const viewMode = ref<'summary' | 'detail'>('summary')

const { formatCurrency, defaultColors } = useCharts()

const hasData = computed(() => props.monthlyIncome > 0 || props.monthlyExpenses > 0 || props.categoryData.length > 0)

// 計算値
const balance = computed(() => props.monthlyIncome - props.monthlyExpenses)
const previousBalance = computed(() => props.previousMonthIncome - props.previousMonthExpenses)
const incomeChange = computed(() => props.monthlyIncome - props.previousMonthIncome)
const expenseChange = computed(() => props.monthlyExpenses - props.previousMonthExpenses)
const balanceChange = computed(() => balance.value - previousBalance.value)

const incomeChangePercent = computed(() => {
  if (props.previousMonthIncome === 0) return '0.0'
  return ((incomeChange.value / props.previousMonthIncome) * 100).toFixed(1)
})

const expenseChangePercent = computed(() => {
  if (props.previousMonthExpenses === 0) return '0.0'
  return ((expenseChange.value / props.previousMonthExpenses) * 100).toFixed(1)
})

const savingsRate = computed(() => {
  if (props.monthlyIncome === 0) return '0.0'
  return ((balance.value / props.monthlyIncome) * 100).toFixed(1)
})

// スタイルクラス
const incomeChangeClass = computed(() =>
  incomeChange.value >= 0 ? 'text-green-600' : 'text-red-600'
)

const expenseChangeClass = computed(() =>
  expenseChange.value >= 0 ? 'text-red-600' : 'text-green-600'
)

const balanceClass = computed(() =>
  balance.value >= 0 ? 'text-green-600' : 'text-red-600'
)

const balanceChangeClass = computed(() =>
  balanceChange.value >= 0 ? 'text-green-600' : 'text-red-600'
)

// カテゴリ別統計データ
const categoryDataWithStats = computed((): CategoryDataWithStats[] => {
  const total = props.categoryData.reduce((sum, item) => sum + item.amount, 0)

  return props.categoryData.map(item => {
    // そのカテゴリの取引を取得
    const categoryTransactions = props.transactions.filter(t => t.category === item.category && t.type === 'EXPENSE')

    return {
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
      transactionCount: categoryTransactions.length,
      averageAmount: categoryTransactions.length > 0 ? item.amount / categoryTransactions.length : 0
    }
  })
})

const totalCategoryAmount = computed(() =>
  props.categoryData.reduce((sum, item) => sum + item.amount, 0)
)

const totalTransactionCount = computed(() =>
  categoryDataWithStats.value.reduce((sum, item) => sum + item.transactionCount, 0)
)

const overallAverageAmount = computed(() =>
  totalTransactionCount.value > 0 ? totalCategoryAmount.value / totalTransactionCount.value : 0
)

const getCategoryColor = (index: number): string => {
  return defaultColors[index % defaultColors.length]
}

const toggleView = () => {
  viewMode.value = viewMode.value === 'summary' ? 'detail' : 'summary'
}
</script>

<style scoped>
.card {
  @apply bg-white rounded-lg shadow-sm border p-6;
}
</style>
