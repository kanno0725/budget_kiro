<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
    <div class="card max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">新規登録</h1>
        <p class="text-gray-600">新しいアカウントを作成してください</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            お名前
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="form-input"
            placeholder="山田太郎"
          />
        </div>

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
            minlength="6"
            class="form-input"
            placeholder="6文字以上のパスワード"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
            パスワード確認
          </label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            class="form-input"
            placeholder="パスワードを再入力"
          />
        </div>

        <div v-if="passwordMismatch" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          パスワードが一致しません
        </div>

        <div v-if="authStore.error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading || passwordMismatch"
          class="btn-primary w-full"
        >
          <span v-if="authStore.isLoading">登録中...</span>
          <span v-else>アカウント作成</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <router-link to="/login" class="text-orange-600 hover:text-orange-700">
          既にアカウントをお持ちの方はこちら
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const passwordMismatch = computed(() => {
  return form.password !== form.confirmPassword && form.confirmPassword.length > 0
})

const handleRegister = async () => {
  if (passwordMismatch.value) {
    return
  }

  authStore.clearError()

  const success = await authStore.register({
    name: form.name,
    email: form.email,
    password: form.password,
  })

  if (success) {
    router.push('/dashboard')
  }
}
</script>
