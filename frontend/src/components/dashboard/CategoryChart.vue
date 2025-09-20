<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">カテゴリ別支出</h3>
      <div class="flex items-center space-x-2">
        <select
          v-model="chartType"
          class="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="pie">円グラフ</option>
          <option value="doughnut">ドーナツグラフ</option>
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

      <Pie
        v-else-if="chartType === 'pie'"
        :data="pieChartData"
        :options="pieChartOptions"
      />

      <Doughnut
        v-else
        :data="doughnutChartData"
        :options="doughnutChartOptions"
      />
    </div>

    <!-- カテゴリ別詳細 -->
    <div v-if="hasData" class="mt-4 space-y-2">
      <div
        v-for="(item, index) in categoryDataWithPercentage"
        :key="item.category"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex items-center space-x-2">
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: colors[index % colors.length] }"
          ></div>
          <span>{{ item.category }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="font-medium">{{ formatCurrency(item.amount) }}</span>
          <span class="text-gray-500">({{ item.percentage.toFixed(1) }}%)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Pie, Doughnut } from 'vue-chartjs'
import { useCharts, type CategoryData } from '../../composables/useCharts'

interface CategoryDataWithPercentage extends CategoryData {
  percentage: number
}

interface Props {
  categoryData: CategoryData[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const chartType = ref<'pie' | 'doughnut'>('doughnut')

const {
  createCategoryPieChart,
  createCategoryDoughnutChart,
  defaultPieOptions,
  formatCurrency,
  defaultColors
} = useCharts()

const hasData = computed(() => props.categoryData.length > 0)
const colors = computed(() => defaultColors)

// Add percentage to category data
const categoryDataWithPercentage = computed((): CategoryDataWithPercentage[] => {
  const total = props.categoryData.reduce((sum, item) => sum + item.amount, 0)
  return props.categoryData.map(item => ({
    ...item,
    percentage: total > 0 ? (item.amount / total) * 100 : 0
  }))
})

const dataWithColors = computed(() =>
  categoryDataWithPercentage.value.map((item, index) => ({
    ...item,
    color: colors.value[index % colors.value.length]
  }))
)

const pieChartData = computed(() => createCategoryPieChart(dataWithColors.value))
const doughnutChartData = computed(() => createCategoryDoughnutChart(dataWithColors.value))

const pieChartOptions = computed(() => ({
  ...defaultPieOptions,
  plugins: {
    ...defaultPieOptions.plugins,
    tooltip: {
      ...defaultPieOptions.plugins?.tooltip,
      callbacks: {
        label: (context: unknown) => {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          return `${label}: ${formatCurrency(value)} (${percentage}%)`
        },
      },
    },
  },
}))

const doughnutChartOptions = computed(() => ({
  ...defaultPieOptions,
  plugins: {
    ...defaultPieOptions.plugins,
    tooltip: {
      ...defaultPieOptions.plugins?.tooltip,
      callbacks: {
        label: (context: unknown) => {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          return `${label}: ${formatCurrency(value)} (${percentage}%)`
        },
      },
    },
  },
}))
</script>
