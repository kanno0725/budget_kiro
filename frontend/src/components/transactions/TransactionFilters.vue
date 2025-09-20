<template>
  <div class="bg-white rounded-lg shadow-sm border p-4 mb-6">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Date range filters -->
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium text-gray-700">期間:</label>
        <input
          v-model="localFilters.startDate"
          type="date"
          class="form-input text-sm"
          @change="handleFilterChange"
        />
        <span class="text-gray-500">〜</span>
        <input
          v-model="localFilters.endDate"
          type="date"
          class="form-input text-sm"
          @change="handleFilterChange"
        />
      </div>

      <!-- Category filter -->
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium text-gray-700">カテゴリ:</label>
        <select
          v-model="localFilters.category"
          class="form-input text-sm"
          @change="handleFilterChange"
        >
          <option value="">すべてのカテゴリ</option>
          <optgroup label="収入カテゴリ">
            <option v-for="category in incomeCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </optgroup>
          <optgroup label="支出カテゴリ">
            <option v-for="category in expenseCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Type filter -->
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium text-gray-700">タイプ:</label>
        <select
          v-model="localFilters.type"
          class="form-input text-sm"
          @change="handleFilterChange"
        >
          <option value="">すべて</option>
          <option value="INCOME">収入</option>
          <option value="EXPENSE">支出</option>
        </select>
      </div>

      <!-- Quick date filters -->
      <div class="flex items-center space-x-2">
        <label class="text-sm font-medium text-gray-700">クイック選択:</label>
        <button
          @click="setQuickFilter('today')"
          class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          今日
        </button>
        <button
          @click="setQuickFilter('thisWeek')"
          class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          今週
        </button>
        <button
          @click="setQuickFilter('thisMonth')"
          class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          今月
        </button>
        <button
          @click="setQuickFilter('lastMonth')"
          class="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          先月
        </button>
      </div>

      <!-- Clear filters -->
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="px-3 py-1 text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-md transition-colors"
      >
        フィルタをクリア
      </button>
    </div>

    <!-- Active filters summary -->
    <div v-if="hasActiveFilters" class="mt-3 pt-3 border-t border-gray-200">
      <div class="flex items-center space-x-2 text-sm text-gray-600">
        <span>適用中のフィルタ:</span>
        <div class="flex flex-wrap gap-2">
          <span v-if="localFilters.startDate || localFilters.endDate" class="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
            期間: {{ formatDateRange() }}
          </span>
          <span v-if="localFilters.category" class="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
            カテゴリ: {{ localFilters.category }}
          </span>
          <span v-if="localFilters.type" class="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
            タイプ: {{ localFilters.type === 'INCOME' ? '収入' : '支出' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { TransactionFilters } from '../../types'
import { TRANSACTION_CATEGORIES, INCOME_CATEGORIES } from '../../types'

interface Props {
  filters: TransactionFilters
}

interface Emits {
  (e: 'update:filters', filters: TransactionFilters): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local filters state
const localFilters = reactive<TransactionFilters>({
  startDate: props.filters.startDate || '',
  endDate: props.filters.endDate || '',
  category: props.filters.category || '',
  type: props.filters.type || undefined
})

// Categories
const expenseCategories = TRANSACTION_CATEGORIES
const incomeCategories = INCOME_CATEGORIES

// Computed properties
const hasActiveFilters = computed(() => {
  return !!(localFilters.startDate || localFilters.endDate || localFilters.category || localFilters.type)
})

// Watch for external filter changes
watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, {
    startDate: newFilters.startDate || '',
    endDate: newFilters.endDate || '',
    category: newFilters.category || '',
    type: newFilters.type || undefined
  })
}, { deep: true })

// Methods
const handleFilterChange = () => {
  const filters: TransactionFilters = {}

  if (localFilters.startDate) filters.startDate = localFilters.startDate
  if (localFilters.endDate) filters.endDate = localFilters.endDate
  if (localFilters.category) filters.category = localFilters.category
  if (localFilters.type) filters.type = localFilters.type

  emit('update:filters', filters)
}

const setQuickFilter = (period: string) => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const date = today.getDate()

  switch (period) {
    case 'today':
      localFilters.startDate = today.toISOString().split('T')[0]
      localFilters.endDate = today.toISOString().split('T')[0]
      break
    case 'thisWeek':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(date - today.getDay())
      const endOfWeek = new Date(today)
      endOfWeek.setDate(date - today.getDay() + 6)
      localFilters.startDate = startOfWeek.toISOString().split('T')[0]
      localFilters.endDate = endOfWeek.toISOString().split('T')[0]
      break
    case 'thisMonth':
      localFilters.startDate = new Date(year, month, 1).toISOString().split('T')[0]
      localFilters.endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      break
    case 'lastMonth':
      localFilters.startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      localFilters.endDate = new Date(year, month, 0).toISOString().split('T')[0]
      break
  }

  handleFilterChange()
}

const clearFilters = () => {
  localFilters.startDate = ''
  localFilters.endDate = ''
  localFilters.category = ''
  localFilters.type = undefined

  emit('update:filters', {})
}

const formatDateRange = (): string => {
  if (localFilters.startDate && localFilters.endDate) {
    const start = new Date(localFilters.startDate).toLocaleDateString('ja-JP')
    const end = new Date(localFilters.endDate).toLocaleDateString('ja-JP')
    return `${start} 〜 ${end}`
  } else if (localFilters.startDate) {
    return `${new Date(localFilters.startDate).toLocaleDateString('ja-JP')} 以降`
  } else if (localFilters.endDate) {
    return `${new Date(localFilters.endDate).toLocaleDateString('ja-JP')} 以前`
  }
  return ''
}
</script>
