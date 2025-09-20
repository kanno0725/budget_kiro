<template>
  <nav class="bg-white shadow-sm border-b">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Logo/Brand -->
        <div class="flex items-center space-x-4">
          <router-link to="/dashboard" class="flex items-center space-x-2">
            <div class="text-orange-600 text-2xl">💰</div>
            <span class="text-xl font-semibold text-gray-900">家計簿</span>
          </router-link>
        </div>

        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-6">
          <router-link
            to="/dashboard"
            class="nav-link"
            :class="{ 'nav-link-active': $route.name === 'dashboard' }"
          >
            <span class="text-lg mr-1">📊</span>
            ダッシュボード
          </router-link>

          <router-link
            to="/transactions"
            class="nav-link"
            :class="{ 'nav-link-active': $route.name === 'transactions' }"
          >
            <span class="text-lg mr-1">💰</span>
            取引管理
          </router-link>

          <router-link
            to="/budget"
            class="nav-link"
            :class="{ 'nav-link-active': $route.name === 'budget' }"
          >
            <span class="text-lg mr-1">📈</span>
            予算管理
          </router-link>

          <router-link
            to="/groups"
            class="nav-link"
            :class="{ 'nav-link-active': $route.name === 'groups' }"
          >
            <span class="text-lg mr-1">👥</span>
            グループ
          </router-link>
        </div>

        <!-- User Menu -->
        <div class="flex items-center space-x-4">
          <div class="hidden md:block text-gray-600">
            {{ authStore.user?.name }}さん
          </div>

          <!-- User Dropdown -->
          <div class="relative" ref="dropdownRef">
            <button
              @click="toggleDropdown"
              class="flex items-center space-x-1 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span class="text-orange-600 font-medium">
                  {{ userInitials }}
                </span>
              </div>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-show="showDropdown"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border"
            >
              <div class="px-4 py-2 text-sm text-gray-700 border-b">
                <div class="font-medium">{{ authStore.user?.name }}</div>
                <div class="text-gray-500">{{ authStore.user?.email }}</div>
              </div>

              <router-link
                to="/profile"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="closeDropdown"
              >
                <span class="mr-2">👤</span>
                プロフィール
              </router-link>

              <router-link
                to="/settings"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                @click="closeDropdown"
              >
                <span class="mr-2">⚙️</span>
                設定
              </router-link>

              <div class="border-t">
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <span class="mr-2">🚪</span>
                  ログアウト
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <button
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!showMobileMenu"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-show="showMobileMenu" class="md:hidden border-t bg-white">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <router-link
            to="/dashboard"
            class="mobile-nav-link"
            :class="{ 'mobile-nav-link-active': $route.name === 'dashboard' }"
            @click="closeMobileMenu"
          >
            <span class="text-lg mr-2">📊</span>
            ダッシュボード
          </router-link>

          <router-link
            to="/transactions"
            class="mobile-nav-link"
            :class="{ 'mobile-nav-link-active': $route.name === 'transactions' }"
            @click="closeMobileMenu"
          >
            <span class="text-lg mr-2">💰</span>
            取引管理
          </router-link>

          <router-link
            to="/budget"
            class="mobile-nav-link"
            :class="{ 'mobile-nav-link-active': $route.name === 'budget' }"
            @click="closeMobileMenu"
          >
            <span class="text-lg mr-2">📈</span>
            予算管理
          </router-link>

          <router-link
            to="/groups"
            class="mobile-nav-link"
            :class="{ 'mobile-nav-link-active': $route.name === 'groups' }"
            @click="closeMobileMenu"
          >
            <span class="text-lg mr-2">👥</span>
            グループ
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const showDropdown = ref(false)
const showMobileMenu = ref(false)
const dropdownRef = ref<HTMLElement>()

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'U'
  return authStore.user.name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  showMobileMenu.value = false
}

const closeDropdown = () => {
  showDropdown.value = false
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  showDropdown.value = false
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const handleLogout = async () => {
  closeDropdown()
  await authStore.logout()
  router.push('/login')
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #111827;
  background-color: #f9fafb;
}

.nav-link-active {
  color: #ea580c;
  background-color: #fed7aa;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.mobile-nav-link:hover {
  color: #111827;
  background-color: #f9fafb;
}

.mobile-nav-link-active {
  color: #ea580c;
  background-color: #fed7aa;
}
</style>
