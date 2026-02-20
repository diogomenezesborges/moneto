'use client'

/**
 * Net Worth Card Component
 *
 * Displays current net worth prominently with trend indicator.
 * Follows the project design system: bg-gray-50 dark:bg-gray-900, borders: border-gray-200 dark:border-gray-700
 * Portuguese-first UI.
 *
 * Issue #198: Net Worth Calculation and Tracking
 */

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Landmark, PiggyBank, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import type { NetWorthData, NetWorthHistoryPoint } from '@/lib/queries/net-worth'
import { calculateTrend } from '@/lib/queries/net-worth'

interface NetWorthCardProps {
  data: NetWorthData
  isLoading?: boolean
}

export function NetWorthCard({ data, isLoading }: NetWorthCardProps) {
  const trend = useMemo(() => calculateTrend(data.history), [data.history])

  const formatPercent = (value: number): string => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  if (isLoading) {
    return (
      <div className="rounded-lg shadow p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Net Worth Card */}
      <div className="rounded-lg shadow p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Patrimonio Liquido
          </h2>
          <Wallet size={24} className="text-gray-400" />
        </div>

        {/* Net Worth Value */}
        <p
          className={`text-3xl font-bold mb-2 ${
            data.netWorth >= 0 ? 'text-gray-900 dark:text-white' : 'text-danger'
          }`}
        >
          {formatCurrency(data.netWorth)}
        </p>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-2">
            {trend.direction === 'up' && <TrendingUp size={16} className="text-success" />}
            {trend.direction === 'down' && <TrendingDown size={16} className="text-danger" />}
            {trend.direction === 'neutral' && <Minus size={16} className="text-gray-400" />}
            <span
              className={`text-sm font-medium ${
                trend.direction === 'up'
                  ? 'text-success'
                  : trend.direction === 'down'
                    ? 'text-danger'
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {formatCurrency(trend.change)} ({formatPercent(trend.changePercent)})
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">vs. mes anterior</span>
          </div>
        )}

        {!trend && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Dados historicos insuficientes para tendencia
          </p>
        )}
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Balances */}
        <div className="rounded-lg shadow p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Saldo em Contas
            </h3>
            <Landmark size={18} className="text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.accountBalances)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.accounts.length} {data.accounts.length === 1 ? 'conta' : 'contas'}
          </p>
        </div>

        {/* Investment Value */}
        <div className="rounded-lg shadow p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Valor dos Investimentos
            </h3>
            <PiggyBank size={18} className="text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.investmentValue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.holdings.length} {data.holdings.length === 1 ? 'ativo' : 'ativos'}
          </p>
        </div>
      </div>
    </div>
  )
}
