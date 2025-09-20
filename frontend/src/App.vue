<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize authentication state
  authStore.initializeAuth()
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
/* Global styles are imported in main.ts */
</style>
