<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-semibold text-gray-900">
        {{ isEditing ? '取引を編集' : '新しい取引' }}
      </h3>
      <button
        v-if="showCloseButton"
        @click="$emit('close')"
        class="text-gray-400 hover:text-gray-600"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- 取引タイプ -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          取引タイプ <span class="text-red-500">*</span>
        </label>
        <div class="flex space-x-4">
          <label class="flex items-center">
            <input
              v-model="form.type"
              type="radio"
              value="INCOME"
              class="form-radio text-primary-600"
            />
            <span class="ml-2 text-sm text-gray-700">収入</span>
          </label>
          <label class="flex items-center">
            <input
              v-model="form.type"
              type="radio"
              value="EXPENSE"
              class="form-radio text-primary-600"
            />
            <span class="ml-2 text-sm text-gray-700">支出</span>
          </label>
        </div>
        <p v-if="errors.type && errors.type.length > 0" class="mt-1 text-sm text-red-600">{{ errors.type[0] }}</p>
      </div>

      <!-- 金額 -->
      <div>
        <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
          金額 <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
          <input
            id="amount"
            v-model="form.amount"
            type="number"
            step="1"
            min="0"
            class="form-input pl-8"
            :class="{ 'border-red-300': errors.amount && errors.amount.length > 0 }"
            placeholder="0"
          />
        </div>
        <p v-if="errors.amount && errors.amount.length > 0" class="mt-1 text-sm text-red-600">{{ errors.amount[0] }}</p>
      </div>

      <!-- カテゴリ -->
      <div>
        <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
          カテゴリ <span class="text-red-500">*</span>
        </label>
        <select
          id="category"
          v-model="form.category"
          class="form-input"
          :class="{ 'border-red-300': errors.category && errors.category.length > 0 }"
        >
          <option value="">カテゴリを選択</option>
          <optgroup v-if="form.type === 'INCOME'" label="収入カテゴリ">
            <option v-for="category in incomeCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </optgroup>
          <optgroup v-if="form.type === 'EXPENSE'" label="支出カテゴリ">
            <option v-for="category in expenseCategories" :key="category" :value="category">
              {{ category }}
            </option>
          </optgroup>
        </select>
        <p v-if="errors.category && errors.category.length > 0" class="mt-1 text-sm text-red-600">{{ errors.category[0] }}</p>
      </div>

      <!-- 日付 -->
      <div>
        <label for="date" class="block text-sm font-medium text-gray-700 mb-2">
          日付 <span class="text-red-500">*</span>
        </label>
        <input
          id="date"
          v-model="form.date"
          type="date"
          class="form-input"
          :class="{ 'border-red-300': errors.date && errors.date.length > 0 }"
        />
        <p v-if="errors.date && errors.date.length > 0" class="mt-1 text-sm text-red-600">{{ errors.date[0] }}</p>
      </div>

      <!-- メモ -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          メモ
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="form-input"
          placeholder="取引の詳細を入力（任意）"
        />
      </div>

      <!-- エラーメッセージ -->
      <div v-if="submitError" class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">{{ submitError }}</p>
      </div>

      <!-- ボタン -->
      <div class="flex justify-end space-x-3 pt-4">
        <button
          v-if="showCancelButton"
          type="button"
          @click="$emit('cancel')"
          class="btn-secondary"
          :disabled="isSubmitting"
        >
          キャンセル
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            保存中...
          </span>
          <span v-else>
            {{ isEditing ? '更新' : '保存' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useFormValidation } from '../../composables/useFormValidation'
import { useTransactionsStore } from '../../stores/transactions'
import type { Transaction, TransactionForm } from '../../types'
import { TRANSACTION_CATEGORIES, INCOME_CATEGORIES } from '../../types'

interface Props {
  transaction?: Transaction
  showCloseButton?: boolean
  showCancelButton?: boolean
}

interface Emits {
  (e: 'success', transaction: Transaction): void
  (e: 'close'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  showCloseButton: false,
  showCancelButton: true
})

const emit = defineEmits<Emits>()

const transactionsStore = useTransactionsStore()

// Form state
const form = reactive<TransactionForm>({
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  type: 'EXPENSE'
})

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

// Computed properties
const isEditing = computed(() => !!props.transaction)

const expenseCategories = TRANSACTION_CATEGORIES
const incomeCategories = INCOME_CATEGORIES

// Form validation
const validationRules = {
  type: [
    {
      message: '取引タイプを選択してください',
      validator: (value: string) => !!value
    }
  ],
  amount: [
    {
      message: '金額を入力してください',
      validator: (value: string | number) => {
        const num = Number(value)
        return !isNaN(num) && num > 0
      }
    }
  ],
  category: [
    {
      message: 'カテゴリを選択してください',
      validator: (value: string) => !!value
    }
  ],
  date: [
    {
      message: '日付を選択してください',
      validator: (value: string) => !!value
    }
  ]
}

const formRef = ref(form)
const { errors, validateField, validateForm, clearErrors } = useFormValidation(formRef, validationRules)

// Watch for type changes to reset category
watch(() => form.type, () => {
  form.category = ''
  clearErrors()
})

// Initialize form with transaction data if editing
onMounted(() => {
  if (props.transaction) {
    form.amount = props.transaction.amount.toString()
    form.category = props.transaction.category
    form.description = props.transaction.description || ''
    form.date = props.transaction.date.split('T')[0]
    form.type = props.transaction.type
  }
})

// Form submission
const handleSubmit = async () => {
  clearErrors()
  submitError.value = null

  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const transactionData = {
      amount: parseFloat(form.amount.toString()),
      category: form.category,
      description: form.description || undefined,
      date: form.date,
      type: form.type
    }

    let success = false

    if (isEditing.value && props.transaction) {
      success = await transactionsStore.updateTransaction(props.transaction.id, transactionData)
    } else {
      success = await transactionsStore.createTransaction(transactionData)
    }

    if (success) {
      // Reset form if creating new transaction
      if (!isEditing.value) {
        Object.assign(form, {
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          type: 'EXPENSE'
        })
      }

      emit('success', transactionsStore.transactions[0])
    } else {
      submitError.value = transactionsStore.error || '取引の保存に失敗しました'
    }
  } catch (error) {
    submitError.value = '取引の保存中にエラーが発生しました'
  } finally {
    isSubmitting.value = false
  }
}
</script>
