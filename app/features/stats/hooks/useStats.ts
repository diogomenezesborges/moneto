/**
 * useStats Hook
 *
 * Manages statistics data processing, filtering, and calculations.
 * Updated to work with Transaction type from TanStack Query (Issue #36).
 * PERFORMANCE OPTIMIZED: Issue #124 Week 3 P2 - Reduced redundant calculations
 */

import { useState, useMemo, useCallback } from 'react'
import type { Transaction } from '@/lib/queries'

type DateRange = 'all' | '1y' | '6m' | '3m' | '1m'

interface UseStatsProps {
  transactions: Transaction[]
}

export function useStats({ transactions }: UseStatsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('1y')
  const [originFilter, setOriginFilter] = useState<string>('all')

  // PERFORMANCE: Memoize setters to prevent parent re-renders
  const handleSetDateRange = useCallback((range: DateRange) => {
    setDateRange(range)
  }, [])

  const handleSetOriginFilter = useCallback((origin: string) => {
    setOriginFilter(origin)
  }, [])

  // Filter transactions based on date range and origin
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (dateRange) {
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        cutoffDate.setFullYear(1970)
    }

    return transactions.filter(t => {
      const transDate = new Date(t.rawDate)
      const matchesDate = transDate >= cutoffDate
      const matchesOrigin = originFilter === 'all' || t.origin === originFilter
      return matchesDate && matchesOrigin
    })
  }, [transactions, dateRange, originFilter])

  // PERFORMANCE: Separate income/expenses to avoid redundant filtering
  const { income, expenses } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.rawAmount > 0)
    const expenses = filteredTransactions.filter(t => t.rawAmount < 0)
    return { income, expenses }
  }, [filteredTransactions])

  // PERFORMANCE: Calculate key metrics using pre-filtered income/expenses
  const metrics = useMemo(() => {
    const totalIncome = income.reduce((sum, t) => sum + t.rawAmount, 0)
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.rawAmount, 0))

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    const daysInPeriod = {
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      all: 365,
    }[dateRange]

    const avgDailySpend = totalExpenses / daysInPeriod

    return {
      totalIncome,
      totalExpenses,
      savingsRate,
      avgDailySpend,
      transactionCount: filteredTransactions.length,
    }
  }, [income, expenses, dateRange, filteredTransactions.length])

  // PERFORMANCE: Monthly chart data using pre-filtered income/expenses
  const chartData = useMemo(() => {
    const monthlyData: Record<string, { month: string; income: number; expenses: number }> = {}

    // Process income transactions
    income.forEach(t => {
      const date = new Date(t.rawDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 }
      }
      monthlyData[monthKey].income += t.rawAmount
    })

    // Process expense transactions
    expenses.forEach(t => {
      const date = new Date(t.rawDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 }
      }
      monthlyData[monthKey].expenses += Math.abs(t.rawAmount)
    })

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
  }, [income, expenses])

  // PERFORMANCE: Category breakdown using pre-filtered expenses
  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {}

    expenses.forEach(t => {
      const cat = t.majorCategory || 'Uncategorized'
      byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.rawAmount)
    })

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [expenses])

  // PERFORMANCE: Top transactions using pre-filtered income/expenses
  const topTransactions = useMemo(() => {
    const topExpenses = [...expenses].sort((a, b) => a.rawAmount - b.rawAmount).slice(0, 5)
    const topIncome = [...income].sort((a, b) => b.rawAmount - a.rawAmount).slice(0, 5)

    return { expenses: topExpenses, income: topIncome }
  }, [income, expenses])

  // Month-over-month comparison
  const momComparison = useMemo(() => {
    if (chartData.length < 2) {
      return { expenseChange: 0, incomeChange: 0 }
    }

    const lastMonth = chartData[chartData.length - 1]
    const previousMonth = chartData[chartData.length - 2]

    const expenseChange =
      previousMonth.expenses > 0
        ? ((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
        : 0

    const incomeChange =
      previousMonth.income > 0
        ? ((lastMonth.income - previousMonth.income) / previousMonth.income) * 100
        : 0

    return { expenseChange, incomeChange }
  }, [chartData])

  // PERFORMANCE: Financial insights - flattened dependencies to avoid cascading recalculations
  const insights = useMemo(() => {
    // Calculate average expense for pattern detection
    const expenseAmounts = expenses.map(t => Math.abs(t.rawAmount))
    const avgExpense = expenseAmounts.reduce((a, b) => a + b, 0) / (expenseAmounts.length || 1)

    const regularExpenses = expenses.filter(t => Math.abs(t.rawAmount) <= avgExpense * 2)
    const largeExpenses = expenses.filter(t => Math.abs(t.rawAmount) > avgExpense * 2)

    // Calculate days elapsed for projection
    const daysElapsed =
      filteredTransactions.length > 0
        ? Math.ceil(
            (new Date().getTime() - new Date(filteredTransactions[0].rawDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 30

    // Calculate total expenses directly here instead of depending on metrics
    const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.rawAmount, 0))
    const projectedMonthlyExpense =
      totalExpenses > 0 ? (totalExpenses / Math.max(daysElapsed, 1)) * 30 : 0

    // Calculate spending pattern
    const spendingPattern =
      regularExpenses.length > largeExpenses.length
        ? `${((regularExpenses.length / expenses.length) * 100).toFixed(0)}% regular purchases`
        : 'High variance detected'

    // Get top category directly instead of depending on categoryData memo
    const topCategory = categoryData[0]
    const topCategoryPercentage = topCategory
      ? ((topCategory.value / totalExpenses) * 100).toFixed(0)
      : '0'

    return {
      spendingPattern,
      topCategory: topCategory?.name || 'N/A',
      topCategoryPercentage,
      projectedMonthlyExpense,
    }
  }, [expenses, filteredTransactions, categoryData])

  return {
    // Filters (memoized setters to prevent parent re-renders)
    dateRange,
    setDateRange: handleSetDateRange,
    originFilter,
    setOriginFilter: handleSetOriginFilter,

    // Data
    filteredTransactions,
    metrics,
    chartData,
    categoryData,
    topTransactions,
    momComparison,
    insights,
  }
}
