<template>
  <v-app-bar app color="surface" elevation="1">
    <!-- Logo/Brand -->
    <v-app-bar-title>
      <router-link to="/dashboard" class="text-decoration-none text-primary">
        <div class="d-flex align-center">
          <v-icon icon="mdi-currency-jpy" size="large" class="mr-2" />
          <span class="text-h5 font-weight-bold">家計簿</span>
        </div>
      </router-link>
    </v-app-bar-title>

    <v-spacer />

    <!-- Navigation Links (Desktop) -->
    <div class="d-none d-md-flex">
      <v-btn
        v-for="item in navigationItems"
        :key="item.name"
        :to="item.to"
        variant="text"
        :color="$route.name === item.name ? 'primary' : 'default'"
        class="mx-1"
      >
        <v-icon :icon="item.icon" class="mr-1" />
        {{ item.title }}
      </v-btn>
    </div>

    <!-- User Menu -->
    <div class="d-flex align-center ml-4">
      <span class="text-body-2 mr-3 d-none d-md-block">
        {{ authStore.user?.name }}さん
      </span>

      <!-- User Menu Button -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
          >
            <v-avatar color="primary" size="32">
              <span class="text-white font-weight-medium">
                {{ userInitials }}
              </span>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            <v-list-item-title class="font-weight-medium">
              {{ authStore.user?.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ authStore.user?.email }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider />

          <v-list-item @click="handleLogout">
            <template #prepend>
              <v-icon icon="mdi-logout" />
            </template>
            <v-list-item-title>ログアウト</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Mobile Navigation Drawer Toggle -->
    <v-app-bar-nav-icon
      class="d-md-none"
      @click="drawer = !drawer"
    />
  </v-app-bar>

  <!-- Mobile Navigation Drawer -->
  <v-navigation-drawer
    v-model="drawer"
    temporary
    location="right"
    class="d-md-none"
  >
    <v-list>
      <v-list-item
        v-for="item in navigationItems"
        :key="item.name"
        :to="item.to"
        @click="drawer = false"
      >
        <template #prepend>
          <v-icon :icon="item.icon" />
        </template>
        <v-list-item-title>{{ item.title }}</v-list-item-title>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-item @click="handleLogout">
        <template #prepend>
          <v-icon icon="mdi-logout" />
        </template>
        <v-list-item-title>ログアウト</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(false)

// Navigation items
const navigationItems = [
  {
    name: 'dashboard',
    title: 'ダッシュボード',
    to: '/dashboard',
    icon: 'mdi-view-dashboard'
  },
  {
    name: 'transactions',
    title: '取引管理',
    to: '/transactions',
    icon: 'mdi-currency-jpy'
  },
  {
    name: 'budget',
    title: '予算管理',
    to: '/budget',
    icon: 'mdi-chart-line'
  },
  {
    name: 'groups',
    title: 'グループ',
    to: '/groups',
    icon: 'mdi-account-group'
  }
]

const userInitials = computed(() => {
  if (!authStore.user?.name) return 'U'
  return authStore.user.name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
