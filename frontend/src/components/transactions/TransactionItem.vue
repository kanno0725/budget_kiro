<template>
  <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
    <div class="flex items-center justify-between">
      <!-- Transaction info -->
      <div class="flex items-center space-x-4 flex-1">
        <!-- Type indicator -->
        <div class="flex-shrink-0">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="transaction.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'"
          >
            <svg
              v-if="transaction.type === 'INCOME'"
              class="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </div>
        </div>

        <!-- Transaction details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ transaction.category }}
              </p>
              <p v-if="transaction.description" class="text-sm text-gray-500 truncate">
                {{ transaction.description }}
              </p>
              <p class="text-xs text-gray-400">
                {{ formatDate(transaction.date) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Amount -->
        <div class="text-right">
          <p
            class="text-lg font-semibold"
            :class="transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'"
          >
            {{ transaction.type === 'INCOME' ? '+' : '-' }}¥{{ formatAmount(Math.abs(transaction.amount)) }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center space-x-2 ml-4">
        <button
          @click="$emit('edit', transaction)"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          title="編集"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="$emit('delete', transaction)"
          class="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
          title="削除"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transaction } from '../../types'

interface Props {
  transaction: Transaction
}

interface Emits {
  (e: 'edit', transaction: Transaction): void
  (e: 'delete', transaction: Transaction): void
}

defineProps<Props>()
defineEmits<Emits>()

// Utility functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP').format(amount)
}
</script>
