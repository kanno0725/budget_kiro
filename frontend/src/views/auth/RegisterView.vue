<template>
  <div
    class="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center"
  >
    <div class="card max-w-md w-full mx-4">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">新規登録</h1>
        <p class="text-gray-600">新しいアカウントを作成してください</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1"> お名前 </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="form-input"
            :class="{ 'border-red-500 focus:border-red-500': hasFieldError('name') }"
            placeholder="山田太郎"
            @blur="handleFieldBlur('name')"
          />
          <div v-if="hasFieldError('name')" class="mt-1 text-sm text-red-600">
            <div v-for="error in getFieldErrors('name')" :key="error">
              {{ error }}
            </div>
          </div>
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
            placeholder="6文字以上のパスワード"
            @blur="handleFieldBlur('password')"
          />
          <div v-if="hasFieldError('password')" class="mt-1 text-sm text-red-600">
            <div v-for="error in getFieldErrors('password')" :key="error">
              {{ error }}
            </div>
          </div>
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
            :class="{ 'border-red-500 focus:border-red-500': hasFieldError('confirmPassword') }"
            placeholder="パスワードを再入力"
            @blur="handleFieldBlur('confirmPassword')"
          />
          <div v-if="hasFieldError('confirmPassword')" class="mt-1 text-sm text-red-600">
            <div v-for="error in getFieldErrors('confirmPassword')" :key="error">
              {{ error }}
            </div>
          </div>
        </div>

        <div
          v-if="authStore.error"
          class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
        >
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading || !isFormValid"
          class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          :class="{ 'bg-green-600 hover:bg-green-700': registerSuccess }"
        >
          <span v-if="authStore.isLoading">
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            登録中...
          </span>
          <span v-else-if="registerSuccess"> ✓ 登録成功！ </span>
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
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { useFormValidation, validationRules } from "../../composables/useFormValidation";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const registerSuccess = ref(false);

// Form validation rules
const rules = {
  name: [
    validationRules.required("お名前を入力してください"),
    validationRules.minLength(2, "お名前は2文字以上で入力してください"),
  ],
  email: [validationRules.required("メールアドレスを入力してください"), validationRules.email()],
  password: [
    validationRules.required("パスワードを入力してください"),
    validationRules.minLength(6, "パスワードは6文字以上で入力してください"),
  ],
  confirmPassword: [
    validationRules.required("パスワード確認を入力してください"),
    validationRules.match(
      computed(() => form.value.password),
      "パスワードが一致しません"
    ),
  ],
};

const { validateForm, validateField, touchField, getFieldErrors, hasFieldError, isFormValid } =
  useFormValidation(form, rules);

const handleRegister = async () => {
  // Validate form before submission
  if (!validateForm()) {
    return;
  }

  authStore.clearError();

  const success = await authStore.register({
    name: form.value.name,
    email: form.value.email,
    password: form.value.password,
  });

  if (success) {
    registerSuccess.value = true;
    authStore.clearError();

    // Add a small delay to show success state
    setTimeout(() => {
      router.push("/dashboard").catch((error) => {
        console.error("Navigation error:", error);
        // Retry navigation to dashboard
        window.location.href = "/dashboard";
      });
    }, 1000);
  } else {
    registerSuccess.value = false;
  }
};

const handleFieldBlur = (fieldName: string) => {
  touchField(fieldName);
  validateField(fieldName);
};
</script>
