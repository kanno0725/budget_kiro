<template>
  <v-card class="pa-6">
    <v-card-title class="d-flex justify-space-between align-center pa-0 mb-6">
      <h3 class="text-h5">予算進捗</h3>
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

    <!-- No Budgets State -->
    <div v-else-if="budgetProgress.length === 0" class="text-center py-8">
      <v-icon
        icon="mdi-chart-bar"
        size="64"
        color="grey-lighten-1"
        class="mb-4"
      />
      <p class="text-body-1 mb-4">
        {{ selectedYear }}年{{ selectedMonth }}月の予算が設定されていません
      </p>
      <v-btn
        @click="$emit('create-budget')"
        color="primary"
        variant="elevated"
      >
        予算を設定する
      </v-btn>
    </div>

    <!-- Budget Progress List -->
    <div v-else>
      <v-row>
        <v-col
          v-for="progress in budgetProgress"
          :key="progress.category"
          cols="12"
        >
          <v-card variant="outlined" class="pa-4">
            <!-- Category Header -->
            <div class="d-flex justify-space-between align-center mb-3">
              <h4 class="text-h6">{{ progress.category }}</h4>
              <div class="text-right">
                <div class="text-body-2 text-medium-emphasis">
                  ¥{{ progress.spent.toLocaleString() }} / ¥{{ progress.budget.toLocaleString() }}
                </div>
                <div
                  class="text-body-2 font-weight-medium"
                  :class="{
                    'text-error': progress.isOverBudget,
                    'text-warning': progress.isNearLimit,
                    'text-success': !progress.isNearLimit && !progress.isOverBudget
                  }"
                >
                  {{ Math.round(progress.percentage) }}%
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <v-progress-linear
              :model-value="Math.min(progress.percentage, 100)"
              :color="progress.isOverBudget ? 'error' : progress.isNearLimit ? 'warning' : 'success'"
              height="8"
              rounded
              class="mb-3"
            />

            <!-- Status and Remaining -->
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-chip
                  v-if="progress.isOverBudget"
                  color="error"
                  size="small"
                  prepend-icon="mdi-alert-circle"
                  variant="tonal"
                >
                  予算超過
                </v-chip>
                <v-chip
                  v-else-if="progress.isNearLimit"
                  color="warning"
                  size="small"
                  prepend-icon="mdi-alert"
                  variant="tonal"
                >
                  注意
                </v-chip>
                <v-chip
                  v-else
                  color="success"
                  size="small"
                  prepend-icon="mdi-check-circle"
                  variant="tonal"
                >
                  順調
                </v-chip>
              </div>
              <div class="text-body-2">
                <span v-if="progress.remaining >= 0" class="text-medium-emphasis">
                  残り: ¥{{ progress.remaining.toLocaleString() }}
                </span>
                <span v-else class="text-error">
                  超過: ¥{{ Math.abs(progress.remaining).toLocaleString() }}
                </span>
              </div>
            </div>

            <!-- Edit Button -->
            <div class="d-flex justify-end mt-3">
              <v-btn
                @click="$emit('edit-budget', progress.category)"
                variant="text"
                color="primary"
                size="small"
              >
                編集
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Summary -->
    <v-divider v-if="budgetProgress.length > 0" class="my-6" />
    <v-row v-if="budgetProgress.length > 0">
      <v-col cols="12" md="4" class="text-center">
        <div class="text-h4 font-weight-bold">
          ¥{{ totalBudget.toLocaleString() }}
        </div>
        <div class="text-body-2 text-medium-emphasis">総予算</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div class="text-h4 font-weight-bold">
          ¥{{ totalSpent.toLocaleString() }}
        </div>
        <div class="text-body-2 text-medium-emphasis">総支出</div>
      </v-col>
      <v-col cols="12" md="4" class="text-center">
        <div
          class="text-h4 font-weight-bold"
          :class="{
            'text-error': totalRemaining < 0,
            'text-success': totalRemaining >= 0
          }"
        >
          ¥{{ totalRemaining.toLocaleString() }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ totalRemaining >= 0 ? '残り予算' : '予算超過' }}
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBudgets } from '../../composables/useBudgets'
import type { BudgetProgress } from '../../composables/useBudgets'

interface Emits {
  (e: 'create-budget'): void
  (e: 'edit-budget', category: string): void
}

const emit = defineEmits<Emits>()

const {
  budgetProgress,
  isLoading,
  error,
  currentMonth,
  currentYear,
  setBudgetPeriod,
  fetchBudgets,
  fetchTransactions,
  clearError
} = useBudgets()

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

// Year options for Vuetify select (current year and previous/next years)
const currentYearValue = new Date().getFullYear()
const yearItems = Array.from({ length: 5 }, (_, i) => ({
  title: `${currentYearValue - 2 + i}年`,
  value: currentYearValue - 2 + i
}))

// Computed totals
const totalBudget = computed(() => {
  return budgetProgress.value.reduce((sum, progress) => sum + progress.budget, 0)
})

const totalSpent = computed(() => {
  return budgetProgress.value.reduce((sum, progress) => sum + progress.spent, 0)
})

const totalRemaining = computed(() => {
  return totalBudget.value - totalSpent.value
})

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
</script>
