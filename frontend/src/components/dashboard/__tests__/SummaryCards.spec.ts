import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SummaryCards from '../SummaryCards.vue'

describe('SummaryCards', () => {
  it('renders correctly with data', () => {
    const wrapper = mount(SummaryCards, {
      props: {
        monthlyIncome: 100000,
        monthlyExpenses: 80000,
        previousMonthIncome: 90000,
        previousMonthExpenses: 85000
      }
    })

    expect(wrapper.text()).toContain('今月の収入')
    expect(wrapper.text()).toContain('今月の支出')
    expect(wrapper.text()).toContain('今月の残高')
    expect(wrapper.text()).toContain('¥100,000')
    expect(wrapper.text()).toContain('¥80,000')
    expect(wrapper.text()).toContain('¥20,000')
  })

  it('calculates percentage changes correctly', () => {
    const wrapper = mount(SummaryCards, {
      props: {
        monthlyIncome: 110000, // +10% from 100000
        monthlyExpenses: 90000, // +12.5% from 80000
        previousMonthIncome: 100000,
        previousMonthExpenses: 80000
      }
    })

    expect(wrapper.text()).toContain('+10.0%')
    expect(wrapper.text()).toContain('+12.5%')
  })

  it('shows negative balance correctly', () => {
    const wrapper = mount(SummaryCards, {
      props: {
        monthlyIncome: 50000,
        monthlyExpenses: 80000,
        previousMonthIncome: 60000,
        previousMonthExpenses: 70000
      }
    })

    expect(wrapper.text()).toContain('¥-30,000')
  })
})
