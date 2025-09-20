<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">取引管理</h1>
        <button @click="showCreateForm = true" class="btn-primary">
          <span class="mr-2">+</span>
          新しい取引
        </button>
      </div>
      <!-- Transaction Form Modal -->
      <div
        v-if="showCreateForm || editingTransaction"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        @click="closeForm"
      >
        <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" @click.stop>
          <TransactionForm
            :transaction="editingTransaction || undefined"
            :show-close-button="true"
            @success="handleTransactionSuccess"
            @close="closeForm"
          />
        </div>
      </div>

      <!-- Filters -->
      <TransactionFilters
        :filters="filters"
        @update:filters="handleFiltersUpdate"
      />

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">総収入</p>
              <p class="text-2xl font-semibold text-green-600">
                ¥{{ formatAmount(transactionsStore.totalIncome) }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">総支出</p>
              <p class="text-2xl font-semibold text-red-600">
                ¥{{ formatAmount(transactionsStore.totalExpenses) }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">残高</p>
              <p
                class="text-2xl font-semibold"
                :class="transactionsStore.balance >= 0 ? 'text-blue-600' : 'text-red-600'"
              >
                ¥{{ formatAmount(transactionsStore.balance) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction List -->
      <TransactionList
        :transactions="filteredTransactions"
        :is-loading="transactionsStore.isLoading"
        @edit="handleEdit"
        @refresh="fetchTransactions"
      />

      <!-- Error message -->
      <div v-if="transactionsStore.error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">{{ transactionsStore.error }}</p>
        <button
          @click="transactionsStore.clearError"
          class="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          エラーを閉じる
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTransactionsStore } from '../stores/transactions'
import TransactionForm from '../components/transactions/TransactionForm.vue'
import TransactionList from '../components/transactions/TransactionList.vue'
import TransactionFilters from '../components/transactions/TransactionFilters.vue'
import type { Transaction, TransactionFilters as FilterType } from '../types'

const router = useRouter()
const authStore = useAuthStore()
const transactionsStore = useTransactionsStore()

// Component state
const showCreateForm = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const filters = ref<FilterType>({})

// Computed properties
const filteredTransactions = computed(() => {
  let transactions = [...transactionsStore.transactions]

  // Apply filters
  if (filters.value.startDate) {
    transactions = transactions.filter(t => t.date >= filters.value.startDate!)
  }

  if (filters.value.endDate) {
    transactions = transactions.filter(t => t.date <= filters.value.endDate!)
  }

  if (filters.value.category) {
    transactions = transactions.filter(t => t.category === filters.value.category)
  }

  if (filters.value.type) {
    transactions = transactions.filter(t => t.type === filters.value.type)
  }

  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Methods
const fetchTransactions = async () => {
  await transactionsStore.fetchTransactions(filters.value)
}

const handleFiltersUpdate = (newFilters: FilterType) => {
  filters.value = newFilters
  fetchTransactions()
}

const handleEdit = (transaction: Transaction) => {
  editingTransaction.value = transaction
  showCreateForm.value = false
}

const handleTransactionSuccess = () => {
  closeForm()
  fetchTransactions()
}

const closeForm = () => {
  showCreateForm.value = false
  editingTransaction.value = null
}

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP').format(amount)
}

// Lifecycle
onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  await fetchTransactions()
})
</script>
