<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <AppNavigation v-if="showNavigation" />

    <!-- Main Content -->
    <main :class="{ 'pt-0': !showNavigation }">
      <slot />
    </main>

    <!-- Footer (optional) -->
    <footer v-if="showNavigation" class="bg-white border-t mt-auto">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-gray-600 text-sm">
          © 2024 家計簿アプリ. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AppNavigation from './AppNavigation.vue'

const route = useRoute()
const authStore = useAuthStore()

// Show navigation only for authenticated users and not on auth pages
const showNavigation = computed(() => {
  const authPages = ['login', 'register', 'home']
  return authStore.isAuthenticated && !authPages.includes(route.name as string)
})
</script>
