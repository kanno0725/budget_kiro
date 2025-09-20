<template>
  <v-card class="pa-6">
    <v-card-title class="d-flex justify-space-between align-center pa-0 mb-6">
      <h3 class="text-h5">予算vs実績比較</h3>
      <div class="d-flex ga-2">
        <v-select
          v-model="selectedMonth"
          :items="monthItems"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 100px"
        />
        <v-select
          v-model="selectedYear"
          :items="yearItems"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width: 100px"
        />
      </div>
    </v-card-title>

    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex justify-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <v-icon
        icon="mdi-alert-circle"
        size="64"
        color="error"
        class="mb-4"
      />
      <p class="text-body-1 mb-4">{{ error }}</p>
      <v-btn
        @click="refresh"
        color="primary"
        variant="elevated"
      >
        再試行
      </v-btn>
    </div>

    <!-- No Data State -->
    <div v-else-if="budgetComparisonData.length === 0" class="text-center py-8">
      <v-icon
        icon="mdi-chart-bar"
        size="64"
        color="grey-lighten-1"
        class="mb-4"
      />
      <p class="text-body-1 mb-4">
        {{ selectedYear }}年{{ selectedMonth }}月の予算データがありません
      </p>
      <v-btn
        @click="$emit('create-budget')"
        color="primary"
        variant="elevated"
      >
        予算を設定する
      </v-btn>
    </div>

    <!-- Chart Container -->
    <div v-else>
      <!-- Chart -->
      <div class="relative h-80 mb-6">
        <canvas ref="chartCanvas"></canvas>
      </div>

      <!-- Legend and Summary -->
      <v-row>
        <!-- Legend -->
        <v-col cols="12" md="6">
          <h4 class="text-h6 mb-3">凡例</h4>
          <div class="d-flex flex-column ga-2">
            <div class="d-flex align-center">
              <div class="bg-blue rounded mr-2" style="width: 16px; height: 16px;"></div>
              <span class="text-body-2">予算</span>
            </div>
            <div class="d-flex align-center">
              <div class="bg-orange rounded mr-2" style="width: 16px; height: 16px;"></div>
              <span class="text-body-2">実績</span>
            </div>
          </div>
        </v-col>

        <!-- Summary Stats -->
        <v-col cols="12" md="6">
          <h4 class="text-h6 mb-3">サマリー</h4>
          <v-list density="compact" class="pa-0">
            <v-list-item class="px-0">
              <template #prepend>
                <span class="text-medium-emphasis">総予算:</span>
              </template>
              <template #append>
                <span class="font-weight-medium">¥{{ totalBudget.toLocaleString() }}</span>
              </template>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend>
                <span class="text-medium-emphasis">総実績:</span>
              </template>
              <template #append>
                <span class="font-weight-medium">¥{{ totalActual.toLocaleString() }}</span>
              </template>
            </v-list-item>
            <v-divider class="my-2" />
            <v-list-item class="px-0">
              <template #prepend>
                <span class="text-medium-emphasis">差額:</span>
              </template>
              <template #append>
                <span
                  class="font-weight-medium"
                  :class="{
                    'text-success': difference >= 0,
                    'text-error': difference < 0
                  }"
                >
                  {{ difference >= 0 ? '+' : '' }}¥{{ difference.toLocaleString() }}
                </span>
              </template>
            </v-list-item>
            <v-list-item class="px-0">
              <template #prepend>
                <span class="text-medium-emphasis">達成率:</span>
              </template>
              <template #append>
                <span
                  class="font-weight-medium"
                  :class="{
                    'text-success': achievementRate <= 100,
                    'text-error': achievementRate > 100
                  }"
                >
                  {{ Math.round(achievementRate) }}%
                </span>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <!-- Category Details -->
      <v-divider class="my-6" />
      <h4 class="text-h6 mb-4">カテゴリ別詳細</h4>
      <v-data-table
        :headers="tableHeaders"
        :items="budgetComparisonData"
        :items-per-page="-1"
        hide-default-footer
        class="elevation-1"
      >
        <template #item.category="{ item }">
          <span class="font-weight-medium">{{ item.category }}</span>
        </template>
        <template #item.budget="{ item }">
          ¥{{ item.budget.toLocaleString() }}
        </template>
        <template #item.actual="{ item }">
          ¥{{ item.actual.toLocaleString() }}
        </template>
        <template #item.difference="{ item }">
          <span
            :class="{
              'text-success': (item.budget - item.actual) >= 0,
              'text-error': (item.budget - item.actual) < 0
            }"
          >
            {{ (item.budget - item.actual) >= 0 ? '+' : '' }}¥{{ (item.budget - item.actual).toLocaleString() }}
          </span>
        </template>
        <template #item.achievementRate="{ item }">
          <span
            :class="{
              'text-success': (item.actual / item.budget * 100) <= 100,
              'text-error': (item.actual / item.budget * 100) > 100
            }"
          >
            {{ Math.round(item.actual / item.budget * 100) }}%
          </span>
        </template>
      </v-data-table>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Chart, type ChartConfiguration } from 'chart.js'
import { useBudgets } from '../../composables/useBudgets'
import { useCharts } from '../../composables/useCharts'

interface Emits {
  (e: 'create-budget'): void
}

const emit = defineEmits<Emits>()

const {
  budgetComparisonData,
  isLoading,
  error,
  currentMonth,
  currentYear,
  setBudgetPeriod,
  fetchBudgets,
  fetchTransactions,
  clearError
} = useBudgets()

const { createBudgetComparisonChart } = useCharts()

// Chart instance and canvas ref
const chartCanvas = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

// Local state for period selection
const selectedMonth = ref(currentMonth.value)
const selectedYear = ref(currentYear.value)

// Month options for Vuetify select
const monthItems = [
  { title: '1月', value: 1 },
  { title: '2月', value: 2 },
  { title: '3月', value: 3 },
  { title: '4月', value: 4 },
  { title: '5月', value: 5 },
  { title: '6月', value: 6 },
  { title: '7月', value: 7 },
  { title: '8月', value: 8 },
  { title: '9月', value: 9 },
  { title: '10月', value: 10 },
  { title: '11月', value: 11 },
  { title: '12月', value: 12 }
]

// Year options for Vuetify select
const currentYearValue = new Date().getFullYear()
const yearItems = Array.from({ length: 5 }, (_, i) => ({
  title: `${currentYearValue - 2 + i}年`,
  value: currentYearValue - 2 + i
}))

// Table headers for Vuetify data table
const tableHeaders = [
  { title: 'カテゴリ', key: 'category', align: 'start' as const },
  { title: '予算', key: 'budget', align: 'end' as const },
  { title: '実績', key: 'actual', align: 'end' as const },
  { title: '差額', key: 'difference', align: 'end' as const },
  { title: '達成率', key: 'achievementRate', align: 'end' as const }
]

// Computed summary values
const totalBudget = computed(() => {
  return budgetComparisonData.value.reduce((sum, item) => sum + item.budget, 0)
})

const totalActual = computed(() => {
  return budgetComparisonData.value.reduce((sum, item) => sum + item.actual, 0)
})

const difference = computed(() => {
  return totalBudget.value - totalActual.value
})

const achievementRate = computed(() => {
  return totalBudget.value > 0 ? (totalActual.value / totalBudget.value) * 100 : 0
})

// Create or update chart
const createChart = async () => {
  if (!chartCanvas.value || budgetComparisonData.value.length === 0) {
    return
  }

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  await nextTick()

  // Create new chart
  const chartData = createBudgetComparisonChart(budgetComparisonData.value)

  const config: ChartConfiguration = {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              const label = context.dataset.label
              return `${label}: ¥${value.toLocaleString()}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              return `¥${Number(value).toLocaleString()}`
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  }

  chartInstance = new Chart(chartCanvas.value, config)
}

// Watch for data changes
watch(budgetComparisonData, () => {
  createChart()
}, { deep: true })

// Watch for period changes
watch([selectedMonth, selectedYear], ([month, year]) => {
  setBudgetPeriod(month, year)
})

// Refresh data
const refresh = () => {
  clearError()
  fetchBudgets()
  fetchTransactions()
}

// Lifecycle hooks
onMounted(() => {
  createChart()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>
