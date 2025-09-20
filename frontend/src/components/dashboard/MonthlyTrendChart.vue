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

    <div class="h-64 relative">
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>

      <div v-else-if="!hasData" class="flex items-center justify-center h-full text-gray-500">
        データがありません
      </div>

      <Line v-else :data="chartData" :options="chartOptions" />
    </div>

    <!-- 統計情報 -->
    <div v-if="hasData" class="mt-4 grid grid-cols-2 gap-4 text-sm">
      <div class="text-center p-2 bg-green-50 rounded">
        <div class="text-green-600 font-medium">平均収入</div>
        <div class="text-lg font-bold text-green-700">{{ formatCurrency(averageIncome) }}</div>
      </div>
      <div class="text-center p-2 bg-red-50 rounded">
        <div class="text-red-600 font-medium">平均支出</div>
        <div class="text-lg font-bold text-red-700">{{ formatCurrency(averageExpenses) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import { useCharts, type MonthlyData } from '../../composables/useCharts'

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

const { createMonthlyTrendChart, defaultLineOptions, formatCurrency } = useCharts()

const hasData = computed(() => props.monthlyData.length > 0)

const chartData = computed(() => createMonthlyTrendChart(props.monthlyData))

const chartOptions = computed(() => ({
  ...defaultLineOptions,
  plugins: {
    ...defaultLineOptions.plugins,
    tooltip: {
      ...defaultLineOptions.plugins?.tooltip,
      callbacks: {
        label: (context: any) => {
          const label = context.dataset.label || ''
          const value = context.parsed.y
          return `${label}: ${formatCurrency(value)}`
        },
      },
    },
  },
  scales: {
    ...defaultLineOptions.scales,
    y: {
      ...defaultLineOptions.scales?.y,
      ticks: {
        callback: (value: unknown) => formatCurrency(Number(value)),
      },
    },
  },
}))

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
</script>
