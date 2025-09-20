<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
    <div class="container mx-auto px-4 py-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          家計簿アプリ
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          個人と家族の財務管理を簡単に
        </p>

        <div class="max-w-md mx-auto space-y-4">
          <router-link
            to="/login"
            class="btn-primary block w-full text-center"
          >
            ログイン
          </router-link>

          <router-link
            to="/register"
            class="btn-secondary block w-full text-center"
          >
            新規登録
          </router-link>
        </div>
      </div>

      <div class="mt-16 grid md:grid-cols-3 gap-8">
        <div class="card text-center">
          <div class="text-orange-600 text-4xl mb-4">📊</div>
          <h3 class="text-lg font-semibold mb-2">収支管理</h3>
          <p class="text-gray-600">日々の収入と支出を簡単に記録・管理</p>
        </div>

        <div class="card text-center">
          <div class="text-orange-600 text-4xl mb-4">📈</div>
          <h3 class="text-lg font-semibold mb-2">データ可視化</h3>
          <p class="text-gray-600">グラフとチャートで支出パターンを分析</p>
        </div>

        <div class="card text-center">
          <div class="text-orange-600 text-4xl mb-4">👥</div>
          <h3 class="text-lg font-semibold mb-2">共同管理</h3>
          <p class="text-gray-600">家族やルームメイトと費用を共有・分担</p>
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
  // Redirect to dashboard if already authenticated
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>
