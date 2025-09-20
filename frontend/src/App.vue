<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import AppLayout from './components/layout/AppLayout.vue'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize authentication state
  authStore.initializeAuth()
})
</script>

<template>
  <v-app>
    <AppLayout>
      <router-view />
    </AppLayout>
  </v-app>
</template>

<style>
/* Global styles are imported in main.ts */
</style>
