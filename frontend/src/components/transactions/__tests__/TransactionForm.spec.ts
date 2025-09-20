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

    // Should show validation errors
    expect(wrapper.text()).toContain('取引タイプを選択してください')
  })

  it('emits success event when form is submitted successfully', async () => {
    const mockStore = useTransactionsStore()
    vi.mocked(mockStore.createTransaction).mockResolvedValue(true)

    const wrapper = mount(TransactionForm)

    // Fill in the form
    await wrapper.find('input[type="radio"][value="EXPENSE"]').setChecked()
    await wrapper.find('input[type="number"]').setValue('1000')
    await wrapper.find('select').setValue('食費')
    await wrapper.find('input[type="date"]').setValue('2024-01-01')

    // Submit the form
    await wrapper.find('form').trigger('submit.prevent')

    // Wait for async operations
    await wrapper.vm.$nextTick()

    expect(mockStore.createTransaction).toHaveBeenCalledWith({
      amount: 1000,
      category: '食費',
      description: undefined,
      date: '2024-01-01',
      type: 'EXPENSE'
    })
  })
})
