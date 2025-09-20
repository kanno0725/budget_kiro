<template>
  <v-card class="pa-6">
    <v-card-title class="d-flex justify-space-between align-center pa-0 mb-6">
      <h3 class="text-h5">
        {{ isEditing ? '予算を編集' : '新しい予算を設定' }}
      </h3>
      <v-btn
        v-if="showCloseButton"
        @click="$emit('close')"
        icon="mdi-close"
        variant="text"
        size="small"
      />
    </v-card-title>

    <v-form @submit.prevent="handleSubmit">
      <v-container class="pa-0">
        <v-row>
          <!-- Category Selection -->
          <v-col cols="12">
            <v-select
              v-model="form.category"
              :items="categoryItems"
              label="カテゴリ"
              :disabled="isEditing"
              :error-messages="errors.category && errors.category.length > 0 ? errors.category[0] : ''"
              required
              variant="outlined"
              prepend-inner-icon="mdi-tag"
            />
          </v-col>

          <!-- Amount Input -->
          <v-col cols="12">
            <v-text-field
              v-model="form.amount"
              label="予算金額"
              type="number"
              min="0"
              step="1"
              :error-messages="errors.amount && errors.amount.length > 0 ? errors.amount[0] : ''"
              required
              variant="outlined"
              prepend-inner-icon="mdi-currency-jpy"
              suffix="円"
            />
          </v-col>

          <!-- Month and Year Selection -->
          <v-col cols="6">
            <v-select
              v-model="form.month"
              :items="monthItems"
              label="月"
              :error-messages="errors.month && errors.month.length > 0 ? errors.month[0] : ''"
              required
              variant="outlined"
              prepend-inner-icon="mdi-calendar-month"
            />
          </v-col>

          <v-col cols="6">
            <v-select
              v-model="form.year"
              :items="yearItems"
              label="年"
              :error-messages="errors.year && errors.year.length > 0 ? errors.year[0] : ''"
              required
              variant="outlined"
              prepend-inner-icon="mdi-calendar"
            />
          </v-col>
        </v-row>

        <!-- Existing Budget Warning -->
        <v-alert
          v-if="existingBudget && !isEditing"
          type="warning"
          variant="tonal"
          class="mb-4"
          icon="mdi-alert"
        >
          {{ form.category }}の{{ form.year }}年{{ form.month }}月の予算は既に設定されています（¥{{ existingBudget.amount.toLocaleString() }}）。
          新しい予算を設定すると上書きされます。
        </v-alert>

        <!-- Action Buttons -->
        <v-row class="mt-4">
          <v-col class="d-flex justify-end ga-3">
            <v-btn
              v-if="showCancelButton"
              @click="$emit('cancel')"
              variant="outlined"
              :disabled="isSubmitting"
            >
              キャンセル
            </v-btn>
            <v-btn
              type="submit"
              color="primary"
              :loading="isSubmitting"
              :disabled="!isFormValid"
            >
              {{ isEditing ? '更新' : '作成' }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBudgets } from '../../composables/useBudgets'
import { useFormValidation, validationRules } from '../../composables/useFormValidation'
import { TRANSACTION_CATEGORIES } from '../../types'
import type { Budget, BudgetForm } from '../../types'

interface Props {
  budget?: Budget
  showCloseButton?: boolean
  showCancelButton?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'cancel'): void
  (e: 'success', budget: Budget): void
}

const props = withDefaults(defineProps<Props>(), {
  showCloseButton: false,
  showCancelButton: true
})

const emit = defineEmits<Emits>()

const { createBudget, updateBudget, budgets } = useBudgets()

// Form state
const form = ref<BudgetForm>({
  category: '',
  amount: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear()
})

const isSubmitting = ref(false)
const isEditing = computed(() => !!props.budget)

// Form validation rules
const validationRulesConfig = {
  category: [validationRules.required('カテゴリを選択してください')],
  amount: [
    validationRules.required('予算金額を入力してください'),
    validationRules.positive('有効な金額を入力してください')
  ],
  month: [validationRules.required('月を選択してください')],
  year: [validationRules.required('年を選択してください')]
}

// Form validation
const { errors, validateField, validateForm, clearErrors, isFormValid } = useFormValidation(form, validationRulesConfig)

// Categories for Vuetify select
const categoryItems = TRANSACTION_CATEGORIES.map(category => ({
  title: category,
  value: category
}))

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

// Year options for Vuetify select (current year and next 2 years)
const currentYear = new Date().getFullYear()
const yearItems = Array.from({ length: 3 }, (_, i) => ({
  title: `${currentYear + i}年`,
  value: currentYear + i
}))

// Check for existing budget
const existingBudget = computed(() => {
  if (isEditing.value) return null

  return budgets.value.find(budget =>
    budget.category === form.value.category &&
    budget.month === form.value.month &&
    budget.year === form.value.year
  )
})

// Form validation is now handled by the composable

// Validation is handled by the composable

// Watch form changes for validation
watch(() => form.value.category, () => {
  if (errors.value.category) {
    validateField('category')
  }
})

watch(() => form.value.amount, () => {
  if (errors.value.amount) {
    validateField('amount')
  }
})

// Handle form submission
const handleSubmit = async () => {
  validateForm()

  if (!isFormValid.value) {
    return
  }

  try {
    isSubmitting.value = true

    let result: Budget

    if (isEditing.value && props.budget) {
      result = await updateBudget(props.budget.id, form.value)
    } else {
      result = await createBudget(form.value)
    }

    emit('success', result)

    // Reset form if creating new budget
    if (!isEditing.value) {
      form.value = {
        category: '',
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
      clearErrors()
    }
  } catch (error) {
    console.error('Failed to save budget:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Initialize form with budget data if editing
onMounted(() => {
  if (props.budget) {
    form.value = {
      category: props.budget.category,
      amount: props.budget.amount.toString(),
      month: props.budget.month,
      year: props.budget.year
    }
  }
})
</script>
