import { ref, computed, type Ref } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export interface CategoryData {
  category: string
  amount: number
  color?: string
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
}

export const useCharts = () => {
  // Default colors for charts
  const defaultColors = [
    '#ea580c', // Orange
    '#2563eb', // Blue
    '#16a34a', // Green
    '#dc2626', // Red
    '#7c3aed', // Purple
    '#059669', // Emerald
    '#d97706', // Amber
    '#be185d', // Pink
    '#0891b2', // Cyan
    '#65a30d', // Lime
  ]

  // Create pie chart data for categories
  const createCategoryPieChart = (data: CategoryData[]): ChartData<'pie'> => {
    return {
      labels: data.map(item => item.category),
      datasets: [
        {
          data: data.map(item => item.amount),
          backgroundColor: data.map((item, index) =>
            item.color || defaultColors[index % defaultColors.length]
          ),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    }
  }

  // Create doughnut chart data for categories
  const createCategoryDoughnutChart = (data: CategoryData[]): ChartData<'doughnut'> => {
    return {
      labels: data.map(item => item.category),
      datasets: [
        {
          data: data.map(item => item.amount),
          backgroundColor: data.map((item, index) =>
            item.color || defaultColors[index % defaultColors.length]
          ),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    }
  }

  // Create line chart data for monthly trends
  const createMonthlyTrendChart = (data: MonthlyData[]): ChartData<'line'> => {
    return {
      labels: data.map(item => item.month),
      datasets: [
        {
          label: '収入',
          data: data.map(item => item.income),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: '支出',
          data: data.map(item => item.expenses),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    }
  }

  // Create bar chart data for budget comparison
  const createBudgetComparisonChart = (data: { category: string; budget: number; actual: number }[]): ChartData<'bar'> => {
    return {
      labels: data.map(item => item.category),
      datasets: [
        {
          label: '予算',
          data: data.map(item => item.budget),
          backgroundColor: 'rgba(37, 99, 235, 0.6)',
          borderColor: '#2563eb',
          borderWidth: 1,
        },
        {
          label: '実績',
          data: data.map(item => item.actual),
          backgroundColor: 'rgba(234, 88, 12, 0.6)',
          borderColor: '#ea580c',
          borderWidth: 1,
        },
      ],
    }
  }

  // Default chart options
  const defaultPieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`
          },
        },
      },
    },
  }

  const defaultLineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ¥${value.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '月',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '金額 (¥)',
        },
        ticks: {
          callback: (value) => `¥${Number(value).toLocaleString()}`,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  }

  const defaultBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ¥${value.toLocaleString()}`
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'カテゴリ',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '金額 (¥)',
        },
        ticks: {
          callback: (value) => `¥${Number(value).toLocaleString()}`,
        },
      },
    },
  }

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return `¥${amount.toLocaleString()}`
  }

  const generateColors = (count: number): string[] => {
    const colors = []
    for (let i = 0; i < count; i++) {
      colors.push(defaultColors[i % defaultColors.length])
    }
    return colors
  }

  return {
    // Chart creation functions
    createCategoryPieChart,
    createCategoryDoughnutChart,
    createMonthlyTrendChart,
    createBudgetComparisonChart,

    // Default options
    defaultPieOptions,
    defaultLineOptions,
    defaultBarOptions,

    // Utility functions
    formatCurrency,
    generateColors,
    defaultColors,
  }
}
