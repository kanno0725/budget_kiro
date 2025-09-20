<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">グループ管理</h1>
        <button class="btn-primary">
          <span class="mr-2">+</span>
          新しいグループ
        </button>
      </div>

      <!-- Coming Soon Message -->
      <div class="card text-center py-12">
        <div class="text-6xl mb-4">👥</div>
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">グループ管理機能</h2>
        <p class="text-gray-600 mb-6">
          家族やルームメイトとの共同出費管理機能を準備中です
        </p>
        <div class="text-sm text-gray-500">
          実装予定の機能：
          <ul class="mt-2 space-y-1">
            <li>• グループ作成・招待</li>
            <li>• 共同出費の記録</li>
            <li>• 費用分担の計算</li>
            <li>• 精算機能</li>
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
