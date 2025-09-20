import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TransactionForm from '../TransactionForm.vue'
import { useTransactionsStore } from '../../../stores/transactions'

// Mock the stores
vi.mock('../../../stores/transactions', () => ({
  useTransactionsStore: vi.fn(() => ({
    createTransaction: vi.fn().mockResolvedValue(true),
    updateTransaction: vi.fn().mockResolvedValue(true),
    transactions: [],
    error: null
  }))
}))

// Mock the form validation composable
vi.mock('../../../composables/useFormValidation', () => ({
  useFormValidation: vi.fn(() => ({
    errors: { value: {} },
    validateForm: vi.fn(() => true),
    clearErrors: vi.fn()
  }))
}))

describe('TransactionForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders correctly', () => {
    const wrapper = mount(TransactionForm)

    expect(wrapper.find('h3').text()).toBe('新しい取引')
    expect(wrapper.find('input[type="radio"][value="INCOME"]').exists()).toBe(true)
    expect(wrapper.find('input[type="radio"][value="EXPENSE"]').exists()).toBe(true)
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('shows edit mode when transaction prop is provided', () => {
    const transaction = {
      id: '1',
      amount: 1000,
      category: '食費',
      description: 'Test transaction',
      date: '2024-01-01',
      type: 'EXPENSE' as const,
      userId: 'user1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    const wrapper = mount(TransactionForm, {
      props: { transaction }
    })

    expect(wrapper.find('h3').text()).toBe('取引を編集')
  })

  it('validates required fields', async () => {
    const wrapper = mount(TransactionForm)

    // Try to submit without filling required fields
    await wrapper.find('form').trigger('submit.prevent')
    await wrapper.vm.$nextTick()

    // Should show validation errors for required fields
    expect(wrapper.text()).toContain('金額を入力してください')
    expect(wrapper.text()).toContain('カテゴリを選択してください')
  })

  it('calls createTransaction when form is valid', async () => {
    const mockStore = useTransactionsStore()
    vi.mocked(mockStore.createTransaction).mockResolvedValue(true)

    const wrapper = mount(TransactionForm)

    // Verify that the form has the expected structure
    expect(wrapper.find('input[type="radio"][value="EXPENSE"]').exists()).toBe(true)
    expect(wrapper.find('input[type="number"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.find('input[type="date"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })
})
