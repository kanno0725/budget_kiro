<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">
              ← ダッシュボード
            </router-link>
            <h1 class="text-xl font-semibold text-gray-900">取引管理</h1>
          </div>
          <button class="btn-primary">
            新しい取引
          </button>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <div class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-semibold text-gray-900">取引履歴</h2>
          <div class="flex space-x-2">
            <select class="form-input">
              <option>すべてのカテゴリ</option>
              <option>食費</option>
              <option>交通費</option>
              <option>娯楽</option>
            </select>
            <input type="date" class="form-input" />
          </div>
        </div>

        <div class="text-center py-12 text-gray-500">
          取引データがありません
          <br />
          <span class="text-sm">新しい取引を追加してください</span>
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
