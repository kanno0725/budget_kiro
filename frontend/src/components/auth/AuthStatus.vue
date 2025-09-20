<template>
  <div class="bg-white shadow rounded-lg p-4">
    <h3 class="text-lg font-medium text-gray-900 mb-4">認証状態</h3>

    <div v-if="authStore.isAuthenticated" class="space-y-2">
      <div class="flex items-center text-green-600">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        ログイン済み
      </div>

      <div class="text-sm text-gray-600">
        <p><strong>ユーザー:</strong> {{ authStore.user?.name }}</p>
        <p><strong>メール:</strong> {{ authStore.user?.email }}</p>
        <p><strong>最終アクティビティ:</strong> {{ formatLastActivity }}</p>
      </div>

      <button
        @click="handleLogout"
        class="btn-secondary text-sm"
        :disabled="authStore.isLoading"
      >
        ログアウト
      </button>
    </div>

    <div v-else class="space-y-2">
      <div class="flex items-center text-red-600">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        未ログイン
      </div>

      <div class="space-x-2">
        <router-link to="/login" class="btn-primary text-sm">
          ログイン
        </router-link>
        <router-link to="/register" class="btn-secondary text-sm">
          新規登録
        </router-link>
      </div>
    </div>

    <div v-if="authStore.error" class="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
      {{ authStore.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formatLastActivity = computed(() => {
  if (!authStore.lastActivity) return 'N/A'

  const now = Date.now()
  const diff = now - authStore.lastActivity
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return '1分未満前'
  if (minutes === 1) return '1分前'
  return `${minutes}分前`
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
