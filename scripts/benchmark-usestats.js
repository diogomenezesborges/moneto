/**
 * Benchmark for useStats Hook Optimization
 *
 * Measures performance improvement from Week 3 P2 optimization (Issue #124).
 * Simulates the calculation logic to measure computation time.
 *
 * Run with: node scripts/benchmark-usestats.js
 */

const { performance } = require('perf_hooks')

// Generate mock transaction data (simulating 5,000 transactions)
function generateMockTransactions(count) {
  const transactions = []
  const startDate = new Date('2023-01-01')

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    transactions.push({
      id: i,
      rawAmount: Math.random() > 0.3 ? -(Math.random() * 500) : Math.random() * 2000,
      rawDate: date.toISOString(),
      rawDescription: `Transaction ${i}`,
      origin: ['Personal', 'Joint', 'Family'][i % 3],
      majorCategory: ['Food', 'Transport', 'Housing', 'Entertainment'][i % 4],
    })
  }

  return transactions
}

// OLD APPROACH: Multiple redundant filters
function calculateStatsOld(transactions, dateRange, originFilter) {
  // Filter transactions (same as optimized)
  const now = new Date()
  const cutoffDate = new Date()
  cutoffDate.setFullYear(now.getFullYear() - 1)

  const filteredTransactions = transactions.filter(t => {
    const transDate = new Date(t.rawDate)
    const matchesDate = transDate >= cutoffDate
    const matchesOrigin = originFilter === 'all' || t.origin === originFilter
    return matchesDate && matchesOrigin
  })

  // Calculate metrics (with redundant filtering)
  const income = filteredTransactions.filter(t => t.rawAmount > 0)
  const expenses = filteredTransactions.filter(t => t.rawAmount < 0)
  const totalIncome = income.reduce((sum, t) => sum + t.rawAmount, 0)
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.rawAmount, 0))

  // Monthly chart data (with redundant filtering)
  const monthlyData = {}
  filteredTransactions.forEach(t => {
    const date = new Date(t.rawDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 }
    }
    if (t.rawAmount > 0) {
      monthlyData[monthKey].income += t.rawAmount
    } else {
      monthlyData[monthKey].expenses += Math.abs(t.rawAmount)
    }
  })

  // Category data (with redundant filtering)
  const byCategory = {}
  filteredTransactions
    .filter(t => t.rawAmount < 0)
    .forEach(t => {
      const cat = t.majorCategory || 'Uncategorized'
      byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.rawAmount)
    })
  const categoryData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Top transactions (with redundant filtering)
  const topExpenses = filteredTransactions
    .filter(t => t.rawAmount < 0)
    .sort((a, b) => a.rawAmount - b.rawAmount)
    .slice(0, 5)

  const topIncome = filteredTransactions
    .filter(t => t.rawAmount > 0)
    .sort((a, b) => b.rawAmount - a.rawAmount)
    .slice(0, 5)

  // Insights (with redundant filtering)
  const expensesForInsights = filteredTransactions.filter(t => t.rawAmount < 0)
  const expenseAmounts = expensesForInsights.map(t => Math.abs(t.rawAmount))
  const avgExpense = expenseAmounts.reduce((a, b) => a + b, 0) / (expenseAmounts.length || 1)

  return {
    totalIncome,
    totalExpenses,
    categoryData,
    chartData: Object.values(monthlyData),
    topTransactions: { expenses: topExpenses, income: topIncome },
  }
}

// NEW APPROACH: Pre-filter income/expenses once, reuse everywhere
function calculateStatsNew(transactions, dateRange, originFilter) {
  // Filter transactions (same as old)
  const now = new Date()
  const cutoffDate = new Date()
  cutoffDate.setFullYear(now.getFullYear() - 1)

  const filteredTransactions = transactions.filter(t => {
    const transDate = new Date(t.rawDate)
    const matchesDate = transDate >= cutoffDate
    const matchesOrigin = originFilter === 'all' || t.origin === originFilter
    return matchesDate && matchesOrigin
  })

  // OPTIMIZATION: Filter income/expenses ONCE
  const income = filteredTransactions.filter(t => t.rawAmount > 0)
  const expenses = filteredTransactions.filter(t => t.rawAmount < 0)

  // Calculate metrics (using pre-filtered arrays)
  const totalIncome = income.reduce((sum, t) => sum + t.rawAmount, 0)
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.rawAmount, 0))

  // Monthly chart data (using pre-filtered arrays)
  const monthlyData = {}
  income.forEach(t => {
    const date = new Date(t.rawDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 }
    }
    monthlyData[monthKey].income += t.rawAmount
  })
  expenses.forEach(t => {
    const date = new Date(t.rawDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0 }
    }
    monthlyData[monthKey].expenses += Math.abs(t.rawAmount)
  })

  // Category data (using pre-filtered expenses)
  const byCategory = {}
  expenses.forEach(t => {
    const cat = t.majorCategory || 'Uncategorized'
    byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.rawAmount)
  })
  const categoryData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Top transactions (using pre-filtered arrays)
  const topExpenses = [...expenses].sort((a, b) => a.rawAmount - b.rawAmount).slice(0, 5)
  const topIncome = [...income].sort((a, b) => b.rawAmount - a.rawAmount).slice(0, 5)

  // Insights (using pre-filtered expenses)
  const expenseAmounts = expenses.map(t => Math.abs(t.rawAmount))
  const avgExpense = expenseAmounts.reduce((a, b) => a + b, 0) / (expenseAmounts.length || 1)

  return {
    totalIncome,
    totalExpenses,
    categoryData,
    chartData: Object.values(monthlyData),
    topTransactions: { expenses: topExpenses, income: topIncome },
  }
}

// Run benchmark
async function runBenchmark() {
  console.log('📊 useStats Hook Performance Benchmark')
  console.log('─'.repeat(60))
  console.log()

  const transactionCounts = [1000, 2500, 5000]

  for (const count of transactionCounts) {
    console.log(`\n🔍 Testing with ${count.toLocaleString()} transactions:`)
    console.log('─'.repeat(60))

    const transactions = generateMockTransactions(count)

    // Warm up
    calculateStatsOld(transactions, '1y', 'all')
    calculateStatsNew(transactions, '1y', 'all')

    // Benchmark OLD approach
    const oldIterations = 100
    const oldStart = performance.now()
    for (let i = 0; i < oldIterations; i++) {
      calculateStatsOld(transactions, '1y', 'all')
    }
    const oldEnd = performance.now()
    const oldAvg = (oldEnd - oldStart) / oldIterations

    // Benchmark NEW approach
    const newIterations = 100
    const newStart = performance.now()
    for (let i = 0; i < newIterations; i++) {
      calculateStatsNew(transactions, '1y', 'all')
    }
    const newEnd = performance.now()
    const newAvg = (newEnd - newStart) / newIterations

    // Calculate improvement
    const improvement = (((oldAvg - newAvg) / oldAvg) * 100).toFixed(1)
    const speedup = (oldAvg / newAvg).toFixed(2)

    console.log(`   OLD approach: ${oldAvg.toFixed(2)}ms (avg of ${oldIterations} runs)`)
    console.log(`   NEW approach: ${newAvg.toFixed(2)}ms (avg of ${newIterations} runs)`)
    console.log()
    console.log(`   ✅ Improvement: ${improvement}% faster`)
    console.log(`   ✅ Speedup: ${speedup}x`)
  }

  console.log()
  console.log('─'.repeat(60))
  console.log('✅ Benchmark complete!')
  console.log()
  console.log('📝 Optimization Summary:')
  console.log('   - Pre-filter income/expenses once instead of multiple times')
  console.log('   - Reuse filtered arrays across all calculations')
  console.log('   - Memoize setters with useCallback to prevent parent re-renders')
  console.log('   - Flatten dependency chains to reduce cascading recalculations')
}

runBenchmark().catch(console.error)
