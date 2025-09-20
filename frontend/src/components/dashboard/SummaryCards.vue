<template>
  <div class="grid md:grid-cols-3 gap-6 mb-8">
    <!-- 今月の収入 -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">今月の収入</h3>
          <p class="text-3xl font-bold text-green-600">{{ formatCurrency(monthlyIncome) }}</p>
        </div>
        <div class="text-green-600 text-4xl">📈</div>
      </div>
      <div class="mt-2 text-sm text-gray-600">
        前月比:
        <span :class="incomeChange >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ incomeChange >= 0 ? "+" : "" }}{{ incomeChange.toFixed(1) }}%
        </span>
      </div>
    </div>

    <!-- 今月の支出 -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">今月の支出</h3>
          <p class="text-3xl font-bold text-red-600">{{ formatCurrency(monthlyExpenses) }}</p>
        </div>
        <div class="text-red-600 text-4xl">📉</div>
      </div>
      <div class="mt-2 text-sm text-gray-600">
        前月比:
        <span :class="expenseChange >= 0 ? 'text-red-600' : 'text-green-600'">
          {{ expenseChange >= 0 ? "+" : "" }}{{ expenseChange.toFixed(1) }}%
        </span>
      </div>
    </div>

    <!-- 残高 -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">今月の残高</h3>
          <p class="text-3xl font-bold" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(balance) }}
          </p>
        </div>
        <div class="text-4xl" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ balance >= 0 ? "💰" : "⚠️" }}
        </div>
      </div>
      <div class="mt-2 text-sm text-gray-600">貯蓄率: {{ savingsRate.toFixed(1) }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCharts } from "../../composables/useCharts";

interface Props {
  monthlyIncome: number;
  monthlyExpenses: number;
  previousMonthIncome: number;
  previousMonthExpenses: number;
}

const props = defineProps<Props>();

const { formatCurrency } = useCharts();

const balance = computed(() => props.monthlyIncome - props.monthlyExpenses);

const incomeChange = computed(() => {
  if (props.previousMonthIncome === 0) return 0;
  return ((props.monthlyIncome - props.previousMonthIncome) / props.previousMonthIncome) * 100;
});

const expenseChange = computed(() => {
  if (props.previousMonthExpenses === 0) return 0;
  return (
    ((props.monthlyExpenses - props.previousMonthExpenses) / props.previousMonthExpenses) * 100
  );
});

const savingsRate = computed(() => {
  if (props.monthlyIncome === 0) return 0;
  return (balance.value / props.monthlyIncome) * 100;
});
</script>
