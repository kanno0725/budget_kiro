<template>
  <div class="card mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
      <h2 class="text-xl font-semibold text-gray-900">ダッシュボード</h2>

      <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <!-- 期間選択 -->
        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium text-gray-700">期間:</label>
          <select
            v-model="selectedPeriod"
            @change="handlePeriodChange"
            class="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="current-month">今月</option>
            <option value="last-month">先月</option>
            <option value="last-3-months">過去3ヶ月</option>
            <option value="last-6-months">過去6ヶ月</option>
            <option value="last-12-months">過去12ヶ月</option>
            <option value="current-year">今年</option>
            <option value="last-year">昨年</option>
            <option value="custom">カスタム</option>
          </select>
        </div>

        <!-- カスタム期間選択 -->
        <div v-if="selectedPeriod === 'custom'" class="flex items-center space-x-2">
          <input
            v-model="customStartDate"
            type="date"
            class="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <span class="text-gray-500">〜</span>
          <input
            v-model="customEndDate"
            type="date"
            class="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <button
            @click="applyCustomPeriod"
            class="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
          >
            適用
          </button>
        </div>

        <!-- 更新ボタン -->
        <button
          @click="$emit('refresh')"
          :disabled="isLoading"
          class="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <span class="text-sm">🔄</span>
          <span>更新</span>
        </button>
      </div>
    </div>

    <!-- 選択中の期間表示 -->
    <div class="mt-3 text-sm text-gray-600">
      選択中の期間: {{ formatPeriodDisplay() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  isLoading?: boolean
}

interface Emits {
  (e: 'periodChange', period: { startDate: string; endDate: string; type: string }): void
  (e: 'refresh'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const selectedPeriod = ref('current-month')
const customStartDate = ref('')
const customEndDate = ref('')

// 期間の計算
const calculatePeriod = (type: string) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  switch (type) {
    case 'current-month':
      return {
        startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        type
      }

    case 'last-month':
      return {
        startDate: new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
        type
      }

    case 'last-3-months':
      return {
        startDate: new Date(currentYear, currentMonth - 2, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        type
      }

    case 'last-6-months':
      return {
        startDate: new Date(currentYear, currentMonth - 5, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        type
      }

    case 'last-12-months':
      return {
        startDate: new Date(currentYear - 1, currentMonth + 1, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        type
      }

    case 'current-year':
      return {
        startDate: new Date(currentYear, 0, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, 11, 31).toISOString().split('T')[0],
        type
      }

    case 'last-year':
      return {
        startDate: new Date(currentYear - 1, 0, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear - 1, 11, 31).toISOString().split('T')[0],
        type
      }

    default:
      return {
        startDate: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0],
        type: 'current-month'
      }
  }
}

const handlePeriodChange = () => {
  if (selectedPeriod.value !== 'custom') {
    const period = calculatePeriod(selectedPeriod.value)
    emit('periodChange', period)
  }
}

const applyCustomPeriod = () => {
  if (customStartDate.value && customEndDate.value) {
    emit('periodChange', {
      startDate: customStartDate.value,
      endDate: customEndDate.value,
      type: 'custom'
    })
  }
}

const formatPeriodDisplay = () => {
  if (selectedPeriod.value === 'custom' && customStartDate.value && customEndDate.value) {
    return `${customStartDate.value} 〜 ${customEndDate.value}`
  }

  const period = calculatePeriod(selectedPeriod.value)
  return `${period.startDate} 〜 ${period.endDate}`
}

// 初期化時に現在の期間を設定
const initializePeriod = () => {
  const period = calculatePeriod(selectedPeriod.value)
  emit('periodChange', period)
}

// コンポーネントマウント時に初期化
watch(() => selectedPeriod.value, handlePeriodChange, { immediate: true })
</script>
