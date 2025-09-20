<template>
  <div v-if="alertsToShow.length > 0" class="space-y-3">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">予算アラート</h3>

    <div
      v-for="alert in alertsToShow"
      :key="alert.category"
      class="rounded-md p-4"
      :class="{
        'bg-red-50 border border-red-200': alert.type === 'danger',
        'bg-yellow-50 border border-yellow-200': alert.type === 'warning'
      }"
    >
      <div class="flex">
        <!-- Alert Icon -->
        <div class="flex-shrink-0">
          <svg
            v-if="alert.type === 'danger'"
            class="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            class="h-5 w-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <!-- Alert Content -->
        <div class="ml-3 flex-1">
          <div class="flex justify-between items-start">
            <div>
              <h4
                class="text-sm font-medium"
                :class="{
                  'text-red-800': alert.type === 'danger',
                  'text-yellow-800': alert.type === 'warning'
                }"
              >
                {{ alert.category }}
              </h4>
              <p
                class="mt-1 text-sm"
                :class="{
                  'text-red-700': alert.type === 'danger',
                  'text-yellow-700': alert.type === 'warning'
                }"
              >
                {{ alert.message }}
              </p>
            </div>

            <!-- Percentage Badge -->
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-red-100 text-red-800': alert.type === 'danger',
                'bg-yellow-100 text-yellow-800': alert.type === 'warning'
              }"
            >
              {{ Math.round(alert.percentage) }}%
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="mt-3 flex space-x-3">
            <button
              @click="$emit('view-category', alert.category)"
              class="text-sm font-medium"
              :class="{
                'text-red-600 hover:text-red-500': alert.type === 'danger',
                'text-yellow-600 hover:text-yellow-500': alert.type === 'warning'
              }"
            >
              詳細を見る
            </button>
            <button
              @click="$emit('edit-budget', alert.category)"
              class="text-sm font-medium"
              :class="{
                'text-red-600 hover:text-red-500': alert.type === 'danger',
                'text-yellow-600 hover:text-yellow-500': alert.type === 'warning'
              }"
            >
              予算を編集
            </button>
            <button
              @click="dismissAlert(alert.category)"
              class="text-sm font-medium text-gray-600 hover:text-gray-500"
            >
              非表示
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Alert -->
    <div v-if="criticalAlerts.length > 0" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h4 class="text-sm font-medium text-red-800">
            予算管理の注意が必要です
          </h4>
          <p class="mt-1 text-sm text-red-700">
            {{ criticalAlerts.length }}個のカテゴリで予算を超過しています。
            支出を見直すか、予算を調整することをお勧めします。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBudgets } from '../../composables/useBudgets'

interface Emits {
  (e: 'view-category', category: string): void
  (e: 'edit-budget', category: string): void
}

const emit = defineEmits<Emits>()

const { budgetAlerts } = useBudgets()

// Local state for dismissed alerts
const dismissedAlerts = ref<Set<string>>(new Set())

// Filter out dismissed alerts
const visibleAlerts = computed(() => {
  return budgetAlerts.value.filter(alert => !dismissedAlerts.value.has(alert.category))
})

// Get critical alerts (over budget)
const criticalAlerts = computed(() => {
  return visibleAlerts.value.filter(alert => alert.type === 'danger')
})

// Use visible alerts as the main alerts
const budgetAlertsFiltered = computed(() => visibleAlerts.value)

// Expose filtered alerts
const budgetAlertsComputed = budgetAlertsFiltered

// Dismiss alert
const dismissAlert = (category: string) => {
  dismissedAlerts.value.add(category)
}

// Reset dismissed alerts when budgetAlerts change (e.g., new month)
const resetDismissedAlerts = () => {
  dismissedAlerts.value.clear()
}

// Expose methods and computed properties
defineExpose({
  resetDismissedAlerts
})

// Use the filtered alerts in template
const alertsToShow = budgetAlertsFiltered
</script>
