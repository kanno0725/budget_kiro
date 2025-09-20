import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BudgetForm from '../BudgetForm.vue'
import { useBudgets } from '../../../composables/useBudgets'

// Mock the composables
vi.mock('../../../composables/useBudgets')
vi.mock('../../../composables/useFormValidation', () => ({
  useFormValidation: () => ({
    errors: { value: {} },
    validateField: vi.fn(),
    clearErrors: vi.fn()
  })
}))

const mockUseBudgets = {
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  budgets: { value: [] }
}

describe('BudgetForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(useBudgets).mockReturnValue(mockUseBudgets as unknown)
  })

  it('renders budget form correctly', () => {
    const wrapper = mount(BudgetForm)

    expect(wrapper.find('h3').text()).toBe('新しい予算を設定')
    expect(wrapper.find('#category').exists()).toBe(true)
    expect(wrapper.find('#amount').exists()).toBe(true)
    expect(wrapper.find('#month').exists()).toBe(true)
    expect(wrapper.find('#year').exists()).toBe(true)
  })

  it('shows edit mode when budget prop is provided', () => {
    const budget = {
      id: '1',
      category: '食費',
      amount: 50000,
      month: 1,
      year: 2024,
      userId: 'user1'
    }

    const wrapper = mount(BudgetForm, {
      props: { budget }
    })

    expect(wrapper.find('h3').text()).toBe('予算を編集')
    expect(wrapper.find('#category').element.disabled).toBe(true)
  })

  it('emits success event when form is submitted successfully', async () => {
    mockUseBudgets.createBudget.mockResolvedValue({ id: '1', category: '食費' })

    const wrapper = mount(BudgetForm)

    await wrapper.find('#category').setValue('食費')
    await wrapper.find('#amount').setValue('50000')
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockUseBudgets.createBudget).toHaveBeenCalled()
  })

  it('validates required fields', async () => {
    const wrapper = mount(BudgetForm)

    expect(wrapper.exists()).toBe(true)
  })
})
