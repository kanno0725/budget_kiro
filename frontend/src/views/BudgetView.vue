<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">予算管理</h1>
        <button class="btn-primary">
          <span class="mr-2">+</span>
          新しい予算
        </button>
      </div>

      <!-- Coming Soon Message -->
      <div class="card text-center py-12">
        <div class="text-6xl mb-4">📊</div>
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">予算管理機能</h2>
        <p class="text-gray-600 mb-6">
          カテゴリ別の予算設定と実績比較機能を準備中です
        </p>
        <div class="text-sm text-gray-500">
          実装予定の機能：
          <ul class="mt-2 space-y-1">
            <li>• カテゴリ別予算設定</li>
            <li>• 予算vs実績の比較</li>
            <li>• 予算超過アラート</li>
            <li>• 月次・年次予算計画</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
