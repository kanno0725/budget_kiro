import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '../services/api'

export interface Group {
  id: string
  name: string
  inviteCode: string
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  userId: string
  groupId: string
  role: 'ADMIN' | 'MEMBER'
  user: {
    id: string
    name: string
    email: string
  }
}

export interface SharedExpense {
  id: string
  amount: number
  description: string
  date: string
  payerId: string
  groupId: string
  createdAt: string
  payer: {
    id: string
    name: string
    email: string
  }
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
  from: {
    id: string
    name: string
  }
  to: {
    id: string
    name: string
  }
}

export const useGroupsStore = defineStore('groups', () => {
  // State
  const groups = ref<Group[]>([])
  const currentGroup = ref<Group | null>(null)
  const groupMembers = ref<GroupMember[]>([])
  const sharedExpenses = ref<SharedExpense[]>([])
  const groupBalances = ref<GroupBalance[]>([])
  const settlements = ref<Settlement[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const currentGroupExpenses = computed(() =>
    sharedExpenses.value.filter(expense => expense.groupId === currentGroup.value?.id)
  )

  const totalGroupExpenses = computed(() =>
    currentGroupExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  )

  // Actions
  const fetchGroups = async () => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.getAll()

      if (response.data.success && response.data.data) {
        groups.value = response.data.data
      } else {
        error.value = response.data.error?.message || 'Failed to fetch groups'
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch groups'
    } finally {
      isLoading.value = false
    }
  }

  const createGroup = async (groupData: { name: string }) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.create(groupData)

      if (response.data.success && response.data.data) {
        groups.value.push(response.data.data)
        return response.data.data
      } else {
        error.value = response.data.error?.message || 'Failed to create group'
        return null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create group'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const joinGroup = async (groupId: string, inviteCode: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.join(groupId, inviteCode)

      if (response.data.success) {
        await fetchGroups() // Refresh groups list
        return true
      } else {
        error.value = response.data.error?.message || 'Failed to join group'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to join group'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const fetchGroupExpenses = async (groupId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.getExpenses(groupId)

      if (response.data.success && response.data.data) {
        sharedExpenses.value = response.data.data
      } else {
        error.value = response.data.error?.message || 'Failed to fetch group expenses'
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch group expenses'
    } finally {
      isLoading.value = false
    }
  }

  const createSharedExpense = async (groupId: string, expenseData: any) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.createExpense(groupId, expenseData)

      if (response.data.success && response.data.data) {
        sharedExpenses.value.unshift(response.data.data)
        return true
      } else {
        error.value = response.data.error?.message || 'Failed to create shared expense'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create shared expense'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const fetchGroupBalances = async (groupId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.getBalances(groupId)

      if (response.data.success && response.data.data) {
        groupBalances.value = response.data.data
      } else {
        error.value = response.data.error?.message || 'Failed to fetch group balances'
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch group balances'
    } finally {
      isLoading.value = false
    }
  }

  const splitEqually = async (groupId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.splitEqually(groupId)

      if (response.data.success) {
        await fetchGroupBalances(groupId) // Refresh balances
        await fetchSettlements(groupId) // Refresh settlements
        return true
      } else {
        error.value = response.data.error?.message || 'Failed to split equally'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to split equally'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const fetchSettlements = async (groupId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await apiService.groups.getSettlements(groupId)

      if (response.data.success && response.data.data) {
        settlements.value = response.data.data
      } else {
        error.value = response.data.error?.message || 'Failed to fetch settlements'
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch settlements'
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentGroup = (group: Group | null) => {
    currentGroup.value = group
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    groups,
    currentGroup,
    groupMembers,
    sharedExpenses,
    groupBalances,
    settlements,
    isLoading,
    error,
    // Getters
    currentGroupExpenses,
    totalGroupExpenses,
    // Actions
    fetchGroups,
    createGroup,
    joinGroup,
    fetchGroupExpenses,
    createSharedExpense,
    fetchGroupBalances,
    splitEqually,
    fetchSettlements,
    setCurrentGroup,
    clearError,
  }
})
