import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import './assets/main.css'

// Import routes and guards
import { routes } from './router/index'
import { authGuard } from './router/guards'
import { useAuthStore } from './stores/auth'

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Create pinia store
const pinia = createPinia()

// Create and mount app
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify)

// Initialize auth store and set up router guards
const authStore = useAuthStore()

// Initialize authentication state from localStorage
authStore.initializeAuth()

// Start session timeout checker
authStore.startSessionChecker()

// Add global navigation guard
router.beforeEach(authGuard)

app.mount('#app')
