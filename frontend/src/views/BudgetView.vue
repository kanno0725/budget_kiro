<template>
  <v-container fluid class="pa-6">
    <!-- Page Header -->
    <v-row class="mb-6">
      <v-col>
        <div class="d-flex justify-space-between align-center">
          <h1 class="text-h3 font-weight-bold">予算管理</h1>
          <v-btn
            @click="showBudgetForm = true"
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
          >
            新しい予算
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Budget Alerts -->
    <v-row class="mb-6">
      <v-col>
        <BudgetAlertsVuetify
          @view-category="handleViewCategory"
          @edit-budget="handleEditBudget"
        />
      </v-col>
    </v-row>

    <!-- Budget Form Dialog -->
    <v-dialog
      v-model="showBudgetForm"
      max-width="600px"
      persistent
    >
      <BudgetForm
        :budget="editingBudget"
        :show-close-button="true"
        @close="closeBudgetForm"
        @cancel="closeBudgetForm"
        @success="handleBudgetSuccess"
      />
    </v-dialog>

    <!-- Main Content Grid -->
    <v-row>
      <!-- Budget Progress -->
      <v-col cols="12" lg="6">
        <BudgetProgress
          @create-budget="showBudgetForm = true"
          @edit-budget="handleEditBudget"
        />
      </v-col>

      <!-- Budget Comparison Chart -->
      <v-col cols="12" lg="6">
        <BudgetComparisonChart
          @create-budget="showBudgetForm = true"
        />
      </v-col>
    </v-row>

    <!-- Error Message -->
    <v-row v-if="error" class="mt-6">
      <v-col>
        <v-alert
          type="error"
          variant="tonal"
          closable
          @click:close="clearError"
        >
          <template #title>エラーが発生しました</template>
          {{ error }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useBudgets } from '../composables/useBudgets'
import BudgetForm from '../components/budget/BudgetForm.vue'
import BudgetProgress from '../components/budget/BudgetProgress.vue'
import BudgetAlertsVuetify from '../components/budget/BudgetAlertsVuetify.vue'
import BudgetComparisonChart from '../components/budget/BudgetComparisonChart.vue'
import type { Budget } from '../types'

const router = useRouter()
const authStore = useAuthStore()
const { error, clearError, budgets } = useBudgets()

// Local state
const showBudgetForm = ref(false)
const editingBudget = ref<Budget | undefined>(undefined)

// Handle budget form actions
const closeBudgetForm = () => {
  showBudgetForm.value = false
  editingBudget.value = undefined
}

const handleBudgetSuccess = (budget: Budget) => {
  closeBudgetForm()
  // The budget store will automatically update the budgets list
}

const handleEditBudget = (category: string) => {
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const budget = budgets.value.find(b =>
    b.category === category &&
    b.month === currentMonth &&
    b.year === currentYear
  )

  if (budget) {
    editingBudget.value = budget
    showBudgetForm.value = true
  }
}

const handleViewCategory = (category: string) => {
  // Navigate to transactions view with category filter
  router.push({
    name: 'transactions',
    query: { category }
  })
}

onMounted(() => {
  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
