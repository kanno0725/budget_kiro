<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">
              ← ダッシュボード
            </router-link>
            <h1 class="text-xl font-semibold text-gray-900">予算管理</h1>
          </div>
          <button class="btn-primary">
            予算設定
          </button>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">予算 vs 実績</h2>
          <div class="h-64 flex items-center justify-center text-gray-500">
            予算比較チャート（実装予定）
          </div>
        </div>

        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">予算進捗</h2>
          <div class="space-y-4">
            <div class="text-center py-8 text-gray-500">
              予算が設定されていません
              <br />
              <span class="text-sm">予算を設定してください</span>
            </div>
          </div>
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
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
