<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
    <div class="card max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">ログイン</h1>
        <p class="text-gray-600">アカウントにサインインしてください</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="form-input"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="form-input"
            placeholder="パスワードを入力"
          />
        </div>

        <div class="flex items-center">
          <input
            id="remember"
            v-model="form.remember"
            type="checkbox"
            class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label for="remember" class="ml-2 block text-sm text-gray-700">
            ログイン状態を保持する
          </label>
        </div>

        <div v-if="authStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="btn-primary w-full"
        >
          <span v-if="authStore.isLoading">ログイン中...</span>
          <span v-else>ログイン</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <router-link to="/register" class="text-orange-600 hover:text-orange-700">
          アカウントをお持ちでない方はこちら
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  remember: true,
})

const handleLogin = async () => {
  authStore.clearError()

  const success = await authStore.login({
    email: form.email,
    password: form.password,
  })

  if (success) {
    router.push('/dashboard')
  }
}
</script>
