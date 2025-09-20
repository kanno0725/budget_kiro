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
            :class="{ 'border-red-500 focus:border-red-500': hasFieldError('email') }"
            placeholder="your@email.com"
            @blur="handleFieldBlur('email')"
          />
          <div v-if="hasFieldError('email')" class="mt-1 text-sm text-red-600">
            <div v-for="error in getFieldErrors('email')" :key="error">
              {{ error }}
            </div>
          </div>
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
            :class="{ 'border-red-500 focus:border-red-500': hasFieldError('password') }"
            placeholder="パスワードを入力"
            @blur="handleFieldBlur('password')"
          />
          <div v-if="hasFieldError('password')" class="mt-1 text-sm text-red-600">
            <div v-for="error in getFieldErrors('password')" :key="error">
              {{ error }}
            </div>
          </div>
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
          :disabled="authStore.isLoading || !isFormValid"
          class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          :class="{ 'bg-green-600 hover:bg-green-700': loginSuccess }"
        >
          <span v-if="authStore.isLoading">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ログイン中...
          </span>
          <span v-else-if="loginSuccess">
            ✓ ログイン成功！
          </span>
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
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useFormValidation, validationRules } from '../../composables/useFormValidation'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  remember: true,
})

const loginSuccess = ref(false)
const immediateRedirect = ref(false) // Option for immediate redirect

// Form validation rules
const rules = {
  email: [
    validationRules.required('メールアドレスを入力してください'),
    validationRules.email()
  ],
  password: [
    validationRules.required('パスワードを入力してください'),
    validationRules.minLength(6, 'パスワードは6文字以上で入力してください')
  ]
}

const {
  validateForm,
  validateField,
  touchField,
  getFieldErrors,
  hasFieldError,
  isFormValid
} = useFormValidation(form, rules)

const handleLogin = async () => {
  // Validate form before submission
  if (!validateForm()) {
    return
  }

  const redirectPath = (route.query.redirect as string) || '/dashboard'
  const immediate = route.query.immediate === 'true' || immediateRedirect.value

  const success = await authStore.login({
    email: form.value.email,
    password: form.value.password,
  })

  if (success) {
    // Show success message briefly
    loginSuccess.value = true
    authStore.clearError()

    // Perform navigation
    const performNavigation = () => {
      router.push(redirectPath).catch((error) => {
        console.error('Navigation error:', error)
        // Fallback to dashboard if redirect fails
        router.push('/dashboard')
      })
    }

    // Check if immediate redirect is requested or add delay for UX
    if (immediate) {
      performNavigation()
    } else {
      // Add a small delay to show success state
      setTimeout(performNavigation, 1000)
    }
  } else {
    loginSuccess.value = false
  }
}

const handleFieldBlur = (fieldName: string) => {
  touchField(fieldName)
  validateField(fieldName)
}
</script>
