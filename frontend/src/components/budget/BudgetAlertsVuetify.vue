<template>
  <div v-if="alertsToShow.length > 0">
    <h3 class="text-h5 mb-4">予算アラート</h3>

    <v-row>
      <v-col
        v-for="alert in alertsToShow"
        :key="alert.category"
        cols="12"
      >
        <v-alert
          :type="alert.type === 'danger' ? 'error' : 'warning'"
          variant="tonal"
          :icon="alert.type === 'danger' ? 'mdi-alert-circle' : 'mdi-alert'"
          closable
          @click:close="dismissAlert(alert.category)"
        >
          <template #title>
            <div class="d-flex justify-space-between align-center">
              <span>{{ alert.category }}</span>
              <v-chip
                :color="alert.type === 'danger' ? 'error' : 'warning'"
                size="small"
                variant="elevated"
              >
                {{ Math.round(alert.percentage) }}%
              </v-chip>
            </div>
          </template>

          <div class="mb-3">{{ alert.message }}</div>

          <!-- Action Buttons -->
          <div class="d-flex ga-2">
            <v-btn
              @click="$emit('view-category', alert.category)"
              :color="alert.type === 'danger' ? 'error' : 'warning'"
              variant="text"
              size="small"
            >
              詳細を見る
            </v-btn>
            <v-btn
              @click="$emit('edit-budget', alert.category)"
              :color="alert.type === 'danger' ? 'error' : 'warning'"
              variant="text"
              size="small"
            >
              予算を編集
            </v-btn>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Summary Alert -->
    <v-alert
      v-if="criticalAlerts.length > 0"
      type="error"
      variant="tonal"
      icon="mdi-alert-octagon"
      class="mt-4"
    >
      <template #title>予算管理の注意が必要です</template>
      {{ criticalAlerts.length }}個のカテゴリで予算を超過しています。
      支出を見直すか、予算を調整することをお勧めします。
    </v-alert>
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
const alertsToShow = computed(() => {
  return budgetAlerts.value.filter(alert => !dismissedAlerts.value.has(alert.category))
})

// Get critical alerts (over budget)
const criticalAlerts = computed(() => {
  return alertsToShow.value.filter(alert => alert.type === 'danger')
})

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
</script>
