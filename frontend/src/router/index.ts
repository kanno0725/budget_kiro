import type { RouteRecordRaw } from 'vue-router'

// Import views
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import BudgetView from '../views/BudgetView.vue'
import GroupsView from '../views/GroupsView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/budget',
    name: 'budget',
    component: BudgetView,
    meta: { requiresAuth: true }
  },
  {
    path: '/groups',
    name: 'groups',
    component: GroupsView,
    meta: { requiresAuth: true }
  }
]
