<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-600 hover:text-gray-900">
              ← ダッシュボード
            </router-link>
            <h1 class="text-xl font-semibold text-gray-900">グループ管理</h1>
          </div>
          <div class="flex space-x-2">
            <button class="btn-secondary">
              グループに参加
            </button>
            <button class="btn-primary">
              新しいグループ
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">参加中のグループ</h2>
          <div class="text-center py-8 text-gray-500">
            参加中のグループがありません
            <br />
            <span class="text-sm">新しいグループを作成するか、招待リンクで参加してください</span>
          </div>
        </div>

        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">共同出費</h2>
          <div class="text-center py-8 text-gray-500">
            共同出費がありません
            <br />
            <span class="text-sm">グループに参加して共同出費を記録してください</span>
          </div>
        </div>
      </div>

      <div class="mt-6 card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">メンバー残高</h2>
        <div class="text-center py-8 text-gray-500">
          残高情報がありません
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
