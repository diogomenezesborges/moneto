/**
 * StatsFeature Component
 *
 * Financial dashboard with interactive charts and key metrics.
 * Displays income/expense trends, category breakdown, and financial insights.
 * Migrated to TanStack Query (Issue #36).
 */

'use client'

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTransactions } from '@/lib/queries'
import { useStats } from '../hooks/useStats'

interface StatsFeatureProps {
  token?: string // Not used - auth comes from Zustand store
  isAuthenticated?: boolean // Not used - auth comes from Zustand store
}

const COLORS = [
  '#10B981', // emerald
  '#6366F1', // indigo
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#3B82F6', // blue
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
]

export function StatsFeature() {
  // PERFORMANCE: Fetch transactions with staleTime to prevent unnecessary refetches
  // Stats page doesn't need real-time data - cache for 5 minutes
  const {
    data: transactions,
    isLoading: loading,
    error: queryError,
  } = useTransactions(
    {},
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    }
  )

  // Query now returns transactions directly as an array
  const error = queryError?.message || null

  // Calculate stats using local hook (provide empty array while loading)
  const stats = useStats({ transactions: transactions || [] })

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl p-8 text-center border border-white/60 dark:border-white/20">
        <BarChart3 className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-indigo-950 dark:text-white mb-2">
          No Transaction Data
        </h3>
        <p className="text-indigo-700 dark:text-indigo-300">
          Import transactions to see your financial dashboard
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-indigo-950 dark:text-white mb-1">
              Financial Dashboard
            </h2>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              {stats.filteredTransactions.length} transactions analyzed
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Date Range Filter */}
            <select
              value={stats.dateRange}
              onChange={e => stats.setDateRange(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded-xl text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </select>

            {/* Origin Filter */}
            <select
              value={stats.originFilter}
              onChange={e => stats.setOriginFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded-xl text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Origins</option>
              <option value="Personal">Personal</option>
              <option value="Joint">Joint</option>
              <option value="Family">Family</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <span
              className={`text-sm font-semibold ${stats.momComparison.incomeChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {formatPercentage(stats.momComparison.incomeChange)}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-indigo-950 dark:text-white">
            {formatCurrency(stats.metrics.totalIncome)}
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 text-red-600" />
            <span
              className={`text-sm font-semibold ${stats.momComparison.expenseChange <= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {formatPercentage(stats.momComparison.expenseChange)}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-indigo-950 dark:text-white">
            {formatCurrency(stats.metrics.totalExpenses)}
          </p>
        </div>

        {/* Savings Rate */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <PieChart className="w-8 h-8 text-indigo-600" />
            <span
              className={`text-sm font-semibold ${stats.metrics.savingsRate >= 20 ? 'text-emerald-600' : stats.metrics.savingsRate >= 10 ? 'text-amber-600' : 'text-red-600'}`}
            >
              {stats.metrics.savingsRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Savings Rate</p>
          <p className="text-2xl font-bold text-indigo-950 dark:text-white">
            {formatCurrency(stats.metrics.totalIncome - stats.metrics.totalExpenses)}
          </p>
        </div>

        {/* Avg Daily Spend */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Avg Daily Spend</p>
          <p className="text-2xl font-bold text-indigo-950 dark:text-white">
            {formatCurrency(stats.metrics.avgDailySpend)}
          </p>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-indigo-950 dark:text-white">
            Financial Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Spending Pattern</p>
            <p className="text-lg font-semibold text-indigo-950 dark:text-white">
              {stats.insights.spendingPattern}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Top Category</p>
            <p className="text-lg font-semibold text-indigo-950 dark:text-white">
              {stats.insights.topCategory} ({stats.insights.topCategoryPercentage}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Projected Monthly</p>
            <p className="text-lg font-semibold text-indigo-950 dark:text-white">
              {formatCurrency(stats.insights.projectedMonthlyExpense)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Transactions</p>
            <p className="text-lg font-semibold text-indigo-950 dark:text-white">
              {stats.metrics.transactionCount}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-950 dark:text-white">
              Income vs Expenses
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="month" stroke="#6366F1" style={{ fontSize: '12px' }} />
              <YAxis
                stroke="#6366F1"
                style={{ fontSize: '12px' }}
                tickFormatter={value => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #E0E7FF',
                  borderRadius: '12px',
                }}
                formatter={value => formatCurrency(value as number)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ fill: '#EF4444', r: 4 }}
                name="Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-950 dark:text-white">
              Category Breakdown
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={stats.categoryData.slice(0, 8)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry =>
                  `${entry.name}: ${((entry.value / stats.metrics.totalExpenses) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.categoryData.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #E0E7FF',
                  borderRadius: '12px',
                }}
                formatter={value => formatCurrency(value as number)}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expenses */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-indigo-950 dark:text-white">Top Expenses</h3>
          </div>
          <div className="space-y-3">
            {stats.topTransactions.expenses.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-950 dark:text-white truncate">
                    {transaction.rawDescription}
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    {new Date(transaction.rawDate).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-600 ml-4">
                  {formatCurrency(Math.abs(transaction.rawAmount))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Income */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <h3 className="text-lg font-semibold text-indigo-950 dark:text-white">Top Income</h3>
          </div>
          <div className="space-y-3">
            {stats.topTransactions.income.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-950 dark:text-white truncate">
                    {transaction.rawDescription}
                  </p>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    {new Date(transaction.rawDate).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-600 ml-4">
                  {formatCurrency(transaction.rawAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
