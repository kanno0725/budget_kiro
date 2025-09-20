import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/main.css'

// Import routes
import { routes } from './router/index'

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

app.mount('#app')
