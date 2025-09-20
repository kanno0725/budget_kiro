import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TransactionList from '../TransactionList.vue'
import TransactionItem from '../TransactionItem.vue'

// Mock TransactionItem component
vi.mock('../TransactionItem.vue', () => ({
  default: {
    name: 'TransactionItem',
    props: ['transaction'],
    emits: ['edit', 'delete'],
    template: '<div class="transaction-item">{{ transaction.category }}</div>'
  }
}))

describe('TransactionList', () => {
  const mockTransactions = [
    {
      id: '1',
      amount: 1000,
      category: '食費',
      description: 'Lunch',
      date: '2024-01-01',
      type: 'EXPENSE' as const,
      userId: 'user1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      amount: 5000,
      category: '給与',
      description: 'Salary',
      date: '2024-01-01',
      type: 'INCOME' as const,
      userId: 'user1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ]

  it('renders transaction list correctly', () => {
    const wrapper = mount(TransactionList, {
      props: {
        transactions: mockTransactions,
        isLoading: false
      }
    })

    expect(wrapper.find('h3').text()).toBe('取引履歴')
    expect(wrapper.text()).toContain('2件の取引')
    expect(wrapper.findAllComponents(TransactionItem)).toHaveLength(2)
  })

  it('shows loading state', () => {
    const wrapper = mount(TransactionList, {
      props: {
        transactions: [],
        isLoading: true
      }
    })

    expect(wrapper.text()).toContain('読み込み中...')
  })

  it('shows empty state when no transactions', () => {
    const wrapper = mount(TransactionList, {
      props: {
        transactions: [],
        isLoading: false
      }
    })

    expect(wrapper.text()).toContain('取引データがありません')
    expect(wrapper.text()).toContain('新しい取引を追加してください')
  })

  it('emits edit event when transaction item emits edit', async () => {
    const wrapper = mount(TransactionList, {
      props: {
        transactions: mockTransactions,
        isLoading: false
      }
    })

    const transactionItem = wrapper.findComponent(TransactionItem)
    await transactionItem.vm.$emit('edit', mockTransactions[0])

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([mockTransactions[0]])
  })
})
