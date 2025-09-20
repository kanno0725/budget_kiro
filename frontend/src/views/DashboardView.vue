<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- 期間選択 -->
      <PeriodSelector
        :is-loading="dashboard.isLoading.value || dashboard.storeLoading.value"
        @period-change="handlePeriodChange"
        @refresh="handleRefresh"
      />

      <!-- エラー表示 -->
      <div v-if="dashboard.error.value || dashboard.storeError.value" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 class="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <p class="mt-1 text-sm text-red-700">
                {{ dashboard.error.value || dashboard.storeError.value }}
              </p>
            </div>
          </div>
        </div>
      </div>

        <!-- 表示切り替えボタン -->
      <div class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="displayMode = 'table'"
              :class="displayMode === 'table' ? 'btn-primary' : 'btn-secondary'"
              class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            >
              <span class="hidden sm:inline">📊 表形式</span>
              <span class="sm:hidden">📊</span>
            </button>
            <button
              @click="displayMode = 'chart'"
              :class="displayMode === 'chart' ? 'btn-primary' : 'btn-secondary'"
              class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            >
              <span class="hidden sm:inline">📈 チャート形式</span>
              <span class="sm:hidden">📈</span>
            </button>
            <button
              @click="displayMode = 'mixed'"
              :class="displayMode === 'mixed' ? 'btn-primary' : 'btn-secondary'"
              class="px-3 py-2 text-sm font-medium rounded-md transition-colors"
            >
              <span class="hidden sm:inline">🔄 混合表示</span>
              <span class="sm:hidden">🔄</span>
            </button>
          </div>
          <div class="text-sm text-gray-600">
            表示モード: {{ getDisplayModeText() }}
          </div>
        </div>
      </div>

      <!-- 表形式表示 -->
      <div v-if="displayMode === 'table' || displayMode === 'mixed'">
        <!-- ダッシュボードテーブル -->
        <div class="mb-8">
          <DashboardTable
            :monthly-income="summaryData.income"
            :monthly-expenses="summaryData.expenses"
            :previous-month-income="previousMonthData.income"
            :previous-month-expenses="previousMonthData.expenses"
            :category-data="categoryData"
            :transactions="dashboard.transactions.value"
          />
        </div>

        <!-- 月次推移テーブル -->
        <div class="mb-8">
          <MonthlyTrendTable
            :monthly-data="monthlyTrendData"
            :is-loading="dashboard.isLoading.value || dashboard.storeLoading.value"
            @period-change="handleTrendPeriodChange"
          />
        </div>
      </div>

      <!-- チャート形式表示 -->
      <div v-if="displayMode === 'chart' || displayMode === 'mixed'">
        <!-- 収支サマリー -->
        <SummaryCards
          :monthly-income="summaryData.income"
          :monthly-expenses="summaryData.expenses"
          :previous-month-income="previousMonthData.income"
          :previous-month-expenses="previousMonthData.expenses"
        />

        <!-- チャート -->
        <div class="grid lg:grid-cols-2 gap-6 mb-8">
          <CategoryChart
            :category-data="categoryData"
            :is-loading="dashboard.isLoading.value || dashboard.storeLoading.value"
          />

          <MonthlyTrendChart
            :monthly-data="monthlyTrendData"
            :is-loading="dashboard.isLoading.value || dashboard.storeLoading.value"
            @period-change="handleTrendPeriodChange"
          />
        </div>
      </div>

      <!-- クイックアクション -->
      <div class="grid md:grid-cols-4 gap-4">
        <router-link to="/transactions" class="card hover:shadow-lg transition-shadow text-center">
          <div class="text-orange-600 text-3xl mb-2">💰</div>
          <h4 class="font-semibold">取引管理</h4>
          <p class="text-sm text-gray-600 mt-1">{{ dashboard.transactions.value.length }}件の取引</p>
        </router-link>

        <router-link to="/budget" class="card hover:shadow-lg transition-shadow text-center">
          <div class="text-orange-600 text-3xl mb-2">📊</div>
          <h4 class="font-semibold">予算管理</h4>
          <p class="text-sm text-gray-600 mt-1">予算を設定・管理</p>
        </router-link>

        <router-link to="/groups" class="card hover:shadow-lg transition-shadow text-center">
          <div class="text-orange-600 text-3xl mb-2">👥</div>
          <h4 class="font-semibold">グループ</h4>
          <p class="text-sm text-gray-600 mt-1">共同出費を管理</p>
        </router-link>

        <div class="card hover:shadow-lg transition-shadow text-center cursor-pointer" @click="handleExport">
          <div class="text-orange-600 text-3xl mb-2">📤</div>
          <h4 class="font-semibold">エクスポート</h4>
          <p class="text-sm text-gray-600 mt-1">データをダウンロード</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDashboard, type DashboardPeriod } from '../composables/useDashboard'
import SummaryCards from '../components/dashboard/SummaryCards.vue'
import CategoryChart from '../components/dashboard/CategoryChart.vue'
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart.vue'
import PeriodSelector from '../components/dashboard/PeriodSelector.vue'
import DashboardTable from '../components/dashboard/DashboardTable.vue'
import MonthlyTrendTable from '../components/dashboard/MonthlyTrendTable.vue'

const router = useRouter()
const authStore = useAuthStore()
const dashboard = useDashboard()

const previousMonthData = ref({ income: 0, expenses: 0 })
const trendPeriodMonths = ref(12)
const displayMode = ref<'table' | 'chart' | 'mixed'>('table')

// 現在の期間のサマリーデータ
const summaryData = computed(() => dashboard.currentPeriodSummary.value)

// カテゴリ別データ
const categoryData = computed(() => dashboard.generateCategoryData())

// 月次推移データ
const monthlyTrendData = computed(() => dashboard.generateMonthlyTrendData(trendPeriodMonths.value))



const handlePeriodChange = async (period: DashboardPeriod) => {
  await dashboard.changePeriod(period)
  // 前月データも更新
  await loadPreviousMonthData()
}

const handleRefresh = async () => {
  await dashboard.refreshData()
  await loadPreviousMonthData()
}

const handleTrendPeriodChange = (months: number) => {
  trendPeriodMonths.value = months
}

const handleExport = () => {
  // TODO: エクスポート機能の実装（タスク18で実装予定）
  alert('エクスポート機能は今後実装予定です')
}

const getDisplayModeText = () => {
  switch (displayMode.value) {
    case 'table': return '表形式'
    case 'chart': return 'チャート形式'
    case 'mixed': return '混合表示'
    default: return '表形式'
  }
}

const loadPreviousMonthData = async () => {
  try {
    const previousTransactions = await dashboard.loadPreviousMonthData()
    const comparison = dashboard.calculatePreviousMonthComparison(previousTransactions)
    previousMonthData.value = {
      income: comparison.previousIncome,
      expenses: comparison.previousExpenses
    }
  } catch (error) {
    console.error('前月データの取得に失敗:', error)
  }
}

onMounted(async () => {
  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // 初期データ読み込み
  const currentDate = new Date()
  const currentMonth = {
    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0],
    type: 'current-month'
  }

  await dashboard.loadDashboardData(currentMonth)
  await loadPreviousMonthData()
})
</script>
