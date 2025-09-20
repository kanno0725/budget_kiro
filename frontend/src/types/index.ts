// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

// User Types
export interface User {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

// Transaction Types
export interface Transaction {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionDto {
  amount: number
  category: string
  description?: string
  date: string
  type: 'INCOME' | 'EXPENSE'
}

// Budget Types
export interface Budget {
  id: string
  category: string
  amount: number
  month: number
  year: number
  userId: string
}

export interface CreateBudgetDto {
  category: string
  amount: number
  month: number
  year: number
}

// Group Types
export interface Group {
  id: string
  name: string
  inviteCode: string
  createdAt: string
  updatedAt: string
  members?: GroupMember[]
}

export interface GroupMember {
  id: string
  userId: string
  groupId: string
  role: 'ADMIN' | 'MEMBER'
  user: User
}

export interface SharedExpense {
  id: string
  amount: number
  description: string
  date: string
  payerId: string
  groupId: string
  createdAt: string
  payer: User
  splits: ExpenseSplit[]
}

export interface ExpenseSplit {
  id: string
  expenseId: string
  userId: string
  amount: number
}

export interface GroupBalance {
  userId: string
  userName: string
  balance: number
}

export interface Settlement {
  id: string
  fromId: string
  toId: string
  amount: number
  groupId: string
  createdAt: string
  from: User
  to: User
}

// Dashboard Types
export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
}

export interface CategoryData {
  category: string
  amount: number
  percentage: number
  color?: string
}

export interface MonthlyTrendData {
  month: string
  income: number
  expenses: number
  balance: number
}

// Form Types
export interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword?: string
}

export interface TransactionForm {
  amount: number | string
  category: string
  description: string
  date: string
  type: 'INCOME' | 'EXPENSE'
}

export interface BudgetForm {
  category: string
  amount: number | string
  month: number
  year: number
}

export interface GroupForm {
  name: string
}

export interface SharedExpenseForm {
  amount: number | string
  description: string
  date: string
  splits: {
    userId: string
    amount: number
  }[]
}

// Filter Types
export interface TransactionFilters {
  startDate?: string
  endDate?: string
  category?: string
  type?: 'INCOME' | 'EXPENSE'
}

export interface DashboardFilters {
  month?: number
  year?: number
  months?: number
}

// Chart Types
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

// Theme Types
export type ThemeColor = 'orange' | 'blue' | 'green'

export interface ThemeConfig {
  primary: string
  primaryLight: string
  primaryDark: string
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// Constants
export const TRANSACTION_CATEGORIES = [
  '食費',
  '交通費',
  '娯楽',
  '光熱費',
  '通信費',
  '医療費',
  '教育費',
  '衣服',
  '住居費',
  'その他'
] as const

export const INCOME_CATEGORIES = [
  '給与',
  'ボーナス',
  '副業',
  '投資',
  'その他'
] as const

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number]
export type IncomeCategory = typeof INCOME_CATEGORIES[number]
