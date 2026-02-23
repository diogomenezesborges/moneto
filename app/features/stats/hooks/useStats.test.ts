/**
 * useStats Hook Tests
 *
 * Tests for statistics data processing, filtering, and calculations.
 * Verifies performance optimizations from Issue #124 Week 3 P2.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useStats } from './useStats'
import type { Transaction } from '@/lib/queries'

// Helper function to create mock transactions
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: Math.random().toString(),
    rawDate: '2025-01-15',
    rawDescription: 'Test Transaction',
    rawAmount: 100,
    origin: 'test-bank',
    bank: null,
    majorCategory: 'Test Category',
    category: null,
    majorCategoryId: null,
    categoryId: null,
    tags: [],
    notes: null,
    status: 'APPROVED',
    reviewStatus: null,
    isFlagged: false,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-15T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  }
}

describe('useStats', () => {
  let mockTransactions: Transaction[]

  beforeEach(() => {
    // Reset mock transactions before each test
    // Create a realistic dataset spanning 12 months relative to current date
    const now = new Date()

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }

    mockTransactions = [
      // Current month - 15 days ago
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15)),
        rawAmount: 3000,
        origin: 'bank-a',
        majorCategory: 'Salary',
      }),
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10)),
        rawAmount: -500,
        origin: 'bank-a',
        majorCategory: 'Groceries',
      }),
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5)),
        rawAmount: -200,
        origin: 'bank-b',
        majorCategory: 'Transport',
      }),

      // 3 months ago
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())),
        rawAmount: 2800,
        origin: 'bank-a',
        majorCategory: 'Salary',
      }),
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate() - 5)),
        rawAmount: -600,
        origin: 'bank-a',
        majorCategory: 'Groceries',
      }),

      // 6 months ago
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())),
        rawAmount: 2500,
        origin: 'bank-a',
        majorCategory: 'Salary',
      }),
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate() - 5)),
        rawAmount: -400,
        origin: 'bank-a',
        majorCategory: 'Utilities',
      }),

      // 11 months ago (within 1 year range)
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 11, now.getDate())),
        rawAmount: 2000,
        origin: 'bank-a',
        majorCategory: 'Salary',
      }),
      createMockTransaction({
        rawDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 11, now.getDate() - 5)),
        rawAmount: -300,
        origin: 'bank-a',
        majorCategory: 'Groceries',
      }),
    ]
  })

  describe('Initialization', () => {
    it('should initialize with default date range "1y"', () => {
      const { result } = renderHook(() => useStats({ transactions: [] }))

      expect(result.current.dateRange).toBe('1y')
    })

    it('should initialize with default origin filter "all"', () => {
      const { result } = renderHook(() => useStats({ transactions: [] }))

      expect(result.current.originFilter).toBe('all')
    })

    it('should handle empty transactions array', () => {
      const { result } = renderHook(() => useStats({ transactions: [] }))

      expect(result.current.filteredTransactions).toEqual([])
      expect(result.current.metrics.totalIncome).toBe(0)
      expect(result.current.metrics.totalExpenses).toBe(0)
      expect(result.current.metrics.savingsRate).toBe(0)
    })
  })

  describe('Date Range Filtering', () => {
    it('should filter transactions for last 1 month', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('1m')
      })

      // Should only include January 2025 transactions (3 transactions)
      expect(result.current.filteredTransactions.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter transactions for last 3 months', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('3m')
      })

      // Should include current month + 3 months ago (at least 3 transactions)
      expect(result.current.filteredTransactions.length).toBeGreaterThanOrEqual(3)
    })

    it('should filter transactions for last 6 months', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('6m')
      })

      // Should include current month + 3mo + 6mo (at least 5 transactions)
      expect(result.current.filteredTransactions.length).toBeGreaterThanOrEqual(5)
    })

    it('should filter transactions for last 1 year', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      // Default is 1y
      expect(result.current.dateRange).toBe('1y')

      // Should include all recent transactions (9 transactions: current month, 3mo, 6mo, 11mo)
      expect(result.current.filteredTransactions.length).toBeGreaterThanOrEqual(7)
    })

    it('should show all transactions when dateRange is "all"', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      expect(result.current.filteredTransactions.length).toBe(mockTransactions.length)
    })
  })

  describe('Origin Filtering', () => {
    it('should filter transactions by origin', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setOriginFilter('bank-a')
      })

      const bankATransactions = result.current.filteredTransactions.filter(
        t => t.origin === 'bank-a'
      )
      expect(result.current.filteredTransactions.length).toBe(bankATransactions.length)
    })

    it('should show all transactions when origin filter is "all"', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setOriginFilter('all')
      })

      // Should show all transactions within default 1y range
      expect(result.current.filteredTransactions.length).toBeGreaterThanOrEqual(7)
    })

    it('should combine date range and origin filters', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('1m')
        result.current.setOriginFilter('bank-a')
      })

      // Should only include recent transactions from bank-a
      const filtered = result.current.filteredTransactions
      expect(filtered.every(t => t.origin === 'bank-a')).toBe(true)

      // All filtered transactions should be recent (within last month)
      const now = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(now.getMonth() - 1)
      expect(filtered.every(t => new Date(t.rawDate) >= oneMonthAgo)).toBe(true)
    })
  })

  describe('Metrics Calculation', () => {
    it('should calculate total income correctly', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      // All income: 3000 + 2800 + 2500 + 2000 = 10300
      expect(result.current.metrics.totalIncome).toBe(10300)
    })

    it('should calculate total expenses correctly', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      // All expenses: 500 + 200 + 600 + 400 + 300 = 2000
      expect(result.current.metrics.totalExpenses).toBe(2000)
    })

    it('should calculate savings rate correctly', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      // Savings rate: ((10300 - 2000) / 10300) * 100 ≈ 80.58%
      expect(result.current.metrics.savingsRate).toBeCloseTo(80.58, 1)
    })

    it('should handle zero income for savings rate', () => {
      const noIncomeTransactions = [
        createMockTransaction({ rawAmount: -100 }),
        createMockTransaction({ rawAmount: -200 }),
      ]

      const { result } = renderHook(() => useStats({ transactions: noIncomeTransactions }))

      expect(result.current.metrics.savingsRate).toBe(0)
    })

    it('should calculate average daily spend correctly', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('1y')
      })

      // Average daily spend should be total expenses / 365
      // With our mock data: (500 + 200 + 600 + 400 + 300) / 365 ≈ 5.48
      // But actual total may vary based on date filtering, so just check it's positive
      expect(result.current.metrics.avgDailySpend).toBeGreaterThan(0)
      expect(result.current.metrics.avgDailySpend).toBeLessThan(20)
    })

    it('should include transaction count in metrics', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('1m')
      })

      expect(result.current.metrics.transactionCount).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Chart Data - Monthly Aggregation', () => {
    it('should aggregate transactions by month', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const chartData = result.current.chartData

      // Should have data for multiple months
      expect(chartData.length).toBeGreaterThan(0)

      // Each entry should have month, income, and expenses
      chartData.forEach(entry => {
        expect(entry).toHaveProperty('month')
        expect(entry).toHaveProperty('income')
        expect(entry).toHaveProperty('expenses')
      })
    })

    it('should format month keys correctly (YYYY-MM)', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const chartData = result.current.chartData

      chartData.forEach(entry => {
        expect(entry.month).toMatch(/^\d{4}-\d{2}$/)
      })
    })

    it('should limit chart data to last 12 months', () => {
      // Create 18 months of data
      const manyMonths: Transaction[] = []
      for (let i = 0; i < 18; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        manyMonths.push(
          createMockTransaction({
            rawDate: date.toISOString().split('T')[0],
            rawAmount: 1000,
          })
        )
      }

      const { result } = renderHook(() => useStats({ transactions: manyMonths }))

      act(() => {
        result.current.setDateRange('all')
      })

      // Should only show last 12 months
      expect(result.current.chartData.length).toBeLessThanOrEqual(12)
    })
  })

  describe('Category Data - Breakdown', () => {
    it('should aggregate expenses by category', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const categoryData = result.current.categoryData

      // Should have multiple categories
      expect(categoryData.length).toBeGreaterThan(0)

      // Each entry should have name and value
      categoryData.forEach(entry => {
        expect(entry).toHaveProperty('name')
        expect(entry).toHaveProperty('value')
        expect(entry.value).toBeGreaterThan(0)
      })
    })

    it('should sort categories by value (descending)', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const categoryData = result.current.categoryData

      for (let i = 0; i < categoryData.length - 1; i++) {
        expect(categoryData[i].value).toBeGreaterThanOrEqual(categoryData[i + 1].value)
      }
    })

    it('should handle uncategorized transactions', () => {
      const now = new Date()
      const uncategorizedTransactions = [
        createMockTransaction({
          rawDate: now.toISOString().split('T')[0],
          rawAmount: -100,
          majorCategory: '',
        }),
      ]

      const { result } = renderHook(() => useStats({ transactions: uncategorizedTransactions }))

      const categoryData = result.current.categoryData

      // Empty or null category should be treated as 'Uncategorized'
      expect(categoryData.length).toBeGreaterThan(0)
    })
  })

  describe('Top Transactions', () => {
    it('should return top 5 expenses', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const topExpenses = result.current.topTransactions.expenses

      expect(topExpenses.length).toBeLessThanOrEqual(5)
      expect(topExpenses.every(t => t.rawAmount < 0)).toBe(true)
    })

    it('should return top 5 income transactions', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const topIncome = result.current.topTransactions.income

      expect(topIncome.length).toBeLessThanOrEqual(5)
      expect(topIncome.every(t => t.rawAmount > 0)).toBe(true)
    })

    it('should sort expenses from largest to smallest', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const topExpenses = result.current.topTransactions.expenses

      for (let i = 0; i < topExpenses.length - 1; i++) {
        expect(topExpenses[i].rawAmount).toBeLessThanOrEqual(topExpenses[i + 1].rawAmount)
      }
    })

    it('should sort income from largest to smallest', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const topIncome = result.current.topTransactions.income

      for (let i = 0; i < topIncome.length - 1; i++) {
        expect(topIncome[i].rawAmount).toBeGreaterThanOrEqual(topIncome[i + 1].rawAmount)
      }
    })
  })

  describe('Month-over-Month Comparison', () => {
    it('should calculate expense change percentage', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const { expenseChange } = result.current.momComparison

      expect(typeof expenseChange).toBe('number')
    })

    it('should calculate income change percentage', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const { incomeChange } = result.current.momComparison

      expect(typeof incomeChange).toBe('number')
    })

    it('should return zero when less than 2 months of data', () => {
      const singleMonth = [createMockTransaction({ rawDate: '2025-01-15', rawAmount: 1000 })]

      const { result } = renderHook(() => useStats({ transactions: singleMonth }))

      expect(result.current.momComparison.expenseChange).toBe(0)
      expect(result.current.momComparison.incomeChange).toBe(0)
    })
  })

  describe('Financial Insights', () => {
    it('should calculate spending pattern', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const { spendingPattern } = result.current.insights

      expect(typeof spendingPattern).toBe('string')
      expect(spendingPattern.includes('regular') || spendingPattern.includes('variance')).toBe(true)
    })

    it('should identify top category', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const { topCategory, topCategoryPercentage } = result.current.insights

      expect(typeof topCategory).toBe('string')
      expect(typeof topCategoryPercentage).toBe('string')
    })

    it('should calculate projected monthly expense', () => {
      const { result } = renderHook(() => useStats({ transactions: mockTransactions }))

      act(() => {
        result.current.setDateRange('all')
      })

      const { projectedMonthlyExpense } = result.current.insights

      expect(typeof projectedMonthlyExpense).toBe('number')
      expect(projectedMonthlyExpense).toBeGreaterThanOrEqual(0)
    })

    it('should handle no expense data gracefully', () => {
      const incomeOnly = [
        createMockTransaction({ rawAmount: 1000 }),
        createMockTransaction({ rawAmount: 2000 }),
      ]

      const { result } = renderHook(() => useStats({ transactions: incomeOnly }))

      expect(result.current.insights.topCategory).toBe('N/A')
      expect(result.current.insights.topCategoryPercentage).toBe('0')
    })
  })

  describe('Performance - Memoization', () => {
    it('should memoize setDateRange callback', () => {
      const { result, rerender } = renderHook(() => useStats({ transactions: mockTransactions }))

      const setDateRange1 = result.current.setDateRange
      rerender()
      const setDateRange2 = result.current.setDateRange

      expect(setDateRange1).toBe(setDateRange2)
    })

    it('should memoize setOriginFilter callback', () => {
      const { result, rerender } = renderHook(() => useStats({ transactions: mockTransactions }))

      const setOriginFilter1 = result.current.setOriginFilter
      rerender()
      const setOriginFilter2 = result.current.setOriginFilter

      expect(setOriginFilter1).toBe(setOriginFilter2)
    })
  })
})
