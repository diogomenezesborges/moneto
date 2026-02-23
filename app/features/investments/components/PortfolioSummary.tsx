'use client'

/**
 * Portfolio Summary Component
 *
 * Displays aggregate portfolio metrics (total invested, current value, gain/loss).
 * Issue #111: Investment Tracking - Portfolio Summary
 */

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Wallet, DollarSign } from 'lucide-react'
import type { HoldingWithStats } from '../types'

interface PortfolioSummaryProps {
  holdings: HoldingWithStats[]
}

export function PortfolioSummary({ holdings }: PortfolioSummaryProps) {
  const summary = useMemo(() => {
    let totalInvested = 0
    let currentValue = 0
    let hasCurrentValue = false

    holdings.forEach(holding => {
      totalInvested += holding.totalCost
      if (holding.currentValue !== null) {
        currentValue += holding.currentValue
        hasCurrentValue = true
      }
    })

    const totalGainLoss = hasCurrentValue ? currentValue - totalInvested : null
    const totalGainLossPercent =
      totalGainLoss !== null && totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : null

    return {
      totalInvested,
      currentValue: hasCurrentValue ? currentValue : null,
      totalGainLoss,
      totalGainLossPercent,
      holdingsCount: holdings.length,
    }
  }, [holdings])

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—'
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return '—'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Invested */}
      <div className="rounded-lg shadow p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Investido</h3>
          <Wallet size={20} className="text-gray-400" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(summary.totalInvested)}
        </p>
      </div>

      {/* Current Value */}
      <div className="rounded-lg shadow p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Atual</h3>
          <DollarSign size={20} className="text-gray-400" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(summary.currentValue)}
        </p>
        {summary.currentValue === null && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Atualize os preços dos ativos
          </p>
        )}
      </div>

      {/* Gain/Loss (Amount) */}
      <div className="rounded-lg shadow p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ganho/Perda</h3>
          {summary.totalGainLoss !== null &&
            (summary.totalGainLoss >= 0 ? (
              <TrendingUp size={20} className="text-success" />
            ) : (
              <TrendingDown size={20} className="text-danger" />
            ))}
        </div>
        <p
          className={`text-2xl font-bold ${
            summary.totalGainLoss === null
              ? 'text-gray-900 dark:text-white'
              : summary.totalGainLoss >= 0
                ? 'text-success'
                : 'text-danger'
          }`}
        >
          {formatCurrency(summary.totalGainLoss)}
        </p>
      </div>

      {/* Gain/Loss (Percentage) */}
      <div className="rounded-lg shadow p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Rentabilidade</h3>
          {summary.totalGainLossPercent !== null &&
            (summary.totalGainLossPercent >= 0 ? (
              <TrendingUp size={20} className="text-success" />
            ) : (
              <TrendingDown size={20} className="text-danger" />
            ))}
        </div>
        <p
          className={`text-2xl font-bold ${
            summary.totalGainLossPercent === null
              ? 'text-gray-900 dark:text-white'
              : summary.totalGainLossPercent >= 0
                ? 'text-success'
                : 'text-danger'
          }`}
        >
          {formatPercent(summary.totalGainLossPercent)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {summary.holdingsCount} {summary.holdingsCount === 1 ? 'ativo' : 'ativos'}
        </p>
      </div>
    </div>
  )
}
