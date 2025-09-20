<template>
  <v-layout>
    <!-- Navigation -->
    <AppNavigationVuetify v-if="showNavigation" />

    <!-- Main Content -->
    <v-main>
      <slot />
    </v-main>

    <!-- Footer (optional) -->
    <v-footer v-if="showNavigation" app class="bg-surface">
      <div class="text-center w-100">
        <span class="text-body-2 text-medium-emphasis">
          © 2024 家計簿アプリ. All rights reserved.
        </span>
      </div>
    </v-footer>
  </v-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AppNavigationVuetify from './AppNavigationVuetify.vue'

const route = useRoute()
const authStore = useAuthStore()

// Show navigation only for authenticated users and not on auth pages
const showNavigation = computed(() => {
  const authPages = ['login', 'register', 'home']
  return authStore.isAuthenticated && !authPages.includes(route.name as string)
})
</script>
