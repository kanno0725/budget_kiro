<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-xl font-semibold text-gray-900">ダッシュボード</h1>
          <div class="flex items-center space-x-4">
            <span class="text-gray-600">{{ authStore.user?.name }}さん</span>
            <button @click="handleLogout" class="btn-secondary">
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <div class="grid md:grid-cols-3 gap-6 mb-8">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">今月の収入</h3>
          <p class="text-3xl font-bold text-green-600">¥0</p>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">今月の支出</h3>
          <p class="text-3xl font-bold text-red-600">¥0</p>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">残高</h3>
          <p class="text-3xl font-bold text-gray-900">¥0</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">カテゴリ別支出</h3>
          <div class="h-64 flex items-center justify-center text-gray-500">
            チャートコンポーネント（実装予定）
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">月次推移</h3>
          <div class="h-64 flex items-center justify-center text-gray-500">
            チャートコンポーネント（実装予定）
          </div>
        </div>
      </div>

      <div class="mt-8 grid md:grid-cols-4 gap-4">
        <router-link to="/transactions" class="card hover:shadow-lg transition-shadow text-center">
          <div class="text-orange-600 text-3xl mb-2">💰</div>
          <h4 class="font-semibold">取引管理</h4>
        </router-link>

        <router-link to="/budget" class="card hover:shadow-lg transition-shadow text-center">
          <div class="text-orange-600 text-3xl mb-2">📊</div>
          <h4 class="font-semibold">予算管理</h4>
        </router-link>

        <router-link to="/groups" class="card hover:shadow-lg transition-shadow text-center">
          <div class="text-orange-600 text-3xl mb-2">👥</div>
          <h4 class="font-semibold">グループ</h4>
        </router-link>

        <div class="card hover:shadow-lg transition-shadow text-center cursor-pointer">
          <div class="text-orange-600 text-3xl mb-2">📤</div>
          <h4 class="font-semibold">エクスポート</h4>
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

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // Redirect to login if not authenticated
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
