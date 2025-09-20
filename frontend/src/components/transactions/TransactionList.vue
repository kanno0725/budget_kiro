<template>
  <div class="bg-white rounded-lg shadow-sm border">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">取引履歴</h3>
        <div class="text-sm text-gray-500">
          {{ transactions.length }}件の取引
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="p-8 text-center">
      <div class="inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        読み込み中...
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="transactions.length === 0" class="p-8 text-center text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-lg font-medium text-gray-900 mb-2">取引データがありません</p>
      <p class="text-sm text-gray-500">新しい取引を追加してください</p>
    </div>

    <!-- Transaction list -->
    <div v-else class="divide-y divide-gray-200">
      <TransactionItem
        v-for="transaction in transactions"
        :key="transaction.id"
        :transaction="transaction"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- Delete confirmation modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="cancelDelete"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">取引を削除</h3>
          <p class="text-sm text-gray-500 mb-4">
            この取引を削除してもよろしいですか？<br>
            この操作は元に戻せません。
          </p>
          <div class="flex justify-center space-x-3">
            <button
              @click="cancelDelete"
              class="btn-secondary"
              :disabled="isDeleting"
            >
              キャンセル
            </button>
            <button
              @click="confirmDelete"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              :disabled="isDeleting"
            >
              <span v-if="isDeleting" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                削除中...
              </span>
              <span v-else>削除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTransactionsStore } from '../../stores/transactions'
import TransactionItem from './TransactionItem.vue'
import type { Transaction } from '../../types'

interface Props {
  transactions: Transaction[]
  isLoading?: boolean
}

interface Emits {
  (e: 'edit', transaction: Transaction): void
  (e: 'refresh'): void
}

withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const transactionsStore = useTransactionsStore()

// Delete modal state
const showDeleteModal = ref(false)
const transactionToDelete = ref<Transaction | null>(null)
const isDeleting = ref(false)

// Event handlers
const handleEdit = (transaction: Transaction) => {
  emit('edit', transaction)
}

const handleDelete = (transaction: Transaction) => {
  transactionToDelete.value = transaction
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
  transactionToDelete.value = null
}

const confirmDelete = async () => {
  if (!transactionToDelete.value) return

  isDeleting.value = true

  try {
    const success = await transactionsStore.deleteTransaction(transactionToDelete.value.id)

    if (success) {
      showDeleteModal.value = false
      transactionToDelete.value = null
      emit('refresh')
    }
  } catch (error) {
    console.error('Failed to delete transaction:', error)
  } finally {
    isDeleting.value = false
  }
}
</script>
