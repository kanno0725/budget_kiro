import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DashboardTable from '../DashboardTable.vue'

describe('DashboardTable', () => {
  const mockProps = {
    monthlyIncome: 300000,
    monthlyExpenses: 200000,
    previousMonthIncome: 280000,
    previousMonthExpenses: 220000,
    categoryData: [
      { category: '食費', amount: 80000 },
      { category: '交通費', amount: 30000 },
      { category: '娯楽', amount: 50000 }
    ],
    transactions: [
      { id: '1', category: '食費', amount: 2000, type: 'EXPENSE', date: '2024-01-15' },
      { id: '2', category: '食費', amount: 3000, type: 'EXPENSE', date: '2024-01-16' },
      { id: '3', category: '交通費', amount: 500, type: 'EXPENSE', date: '2024-01-17' }
    ]
  }

  it('renders summary table correctly', () => {
    const wrapper = mount(DashboardTable, {
      props: mockProps
    })

    expect(wrapper.text()).toContain('ダッシュボード概要')
    expect(wrapper.text()).toContain('収入')
    expect(wrapper.text()).toContain('支出')
    expect(wrapper.text()).toContain('残高')
    expect(wrapper.text()).toContain('¥300,000')
    expect(wrapper.text()).toContain('¥200,000')
    expect(wrapper.text()).toContain('¥100,000')
  })

  it('calculates percentage changes correctly', () => {
    const wrapper = mount(DashboardTable, {
      props: mockProps
    })

    // 収入の変化率: (300000 - 280000) / 280000 * 100 = 7.1%
    expect(wrapper.text()).toContain('7.1%')

    // 支出の変化率: (200000 - 220000) / 220000 * 100 = -9.1%
    expect(wrapper.text()).toContain('-9.1%')
  })

  it('toggles between summary and detail view', async () => {
    const wrapper = mount(DashboardTable, {
      props: mockProps
    })

    // 初期状態はサマリー表示
    expect(wrapper.text()).toContain('詳細表示')

    // 詳細表示に切り替え
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('サマリー表示')
    expect(wrapper.text()).toContain('食費')
    expect(wrapper.text()).toContain('交通費')
    expect(wrapper.text()).toContain('娯楽')
  })

  it('shows no data message when no data available', () => {
    const wrapper = mount(DashboardTable, {
      props: {
        monthlyIncome: 0,
        monthlyExpenses: 0,
        previousMonthIncome: 0,
        previousMonthExpenses: 0,
        categoryData: [],
        transactions: []
      }
    })

    expect(wrapper.text()).toContain('表示するデータがありません')
  })
})
