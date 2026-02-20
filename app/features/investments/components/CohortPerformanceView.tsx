'use client'

/**
 * Cohort Performance View Component
 *
 * Tracks each purchase as a separate investment cohort, showing performance from entry point.
 * Answers the question: "If I bought today at x price, x units, how does it evolve from that point onwards?"
 *
 * Issue #114: Investment Tracking - Enhanced with Cohort-Based Tracking
 */

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { useHoldings } from '@/lib/queries/investments'
import type { PurchaseCohort, HoldingWithStats } from '../types'

interface CohortPerformanceViewProps {
  holdingId?: string // If provided, show only this holding's cohorts
}

export function CohortPerformanceView({ holdingId }: CohortPerformanceViewProps) {
  const { data: holdings, isLoading } = useHoldings()

  const cohorts = useMemo(() => {
    if (!holdings) return []

    // Filter holdings if specific holdingId provided
    const targetHoldings = holdingId ? holdings.filter(h => h.id === holdingId) : holdings

    const allCohorts: PurchaseCohort[] = []

    targetHoldings.forEach((holding: HoldingWithStats) => {
      if (!holding.transactions) return

      // Only process BUY transactions
      const buyTransactions = holding.transactions.filter(tx => tx.type === 'BUY')

      buyTransactions.forEach(tx => {
        const totalInvested = tx.units * tx.pricePerUnit + tx.fees
        const currentPrice = holding.currentPrice
        const currentValue = currentPrice !== null ? tx.units * currentPrice : null
        const gainLoss = currentValue !== null ? currentValue - totalInvested : null
        const gainLossPercent =
          gainLoss !== null && totalInvested > 0 ? (gainLoss / totalInvested) * 100 : null

        const daysHeld = Math.floor(
          (new Date().getTime() - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24)
        )

        // Annualized return = (1 + totalReturn) ^ (365 / daysHeld) - 1
        const annualizedReturn =
          gainLossPercent !== null && daysHeld > 0
            ? (Math.pow(1 + gainLossPercent / 100, 365 / daysHeld) - 1) * 100
            : null

        allCohorts.push({
          transactionId: tx.id,
          holdingId: holding.id,
          holdingName: holding.name,
          ticker: holding.ticker,
          purchaseDate: tx.date,
          units: tx.units,
          pricePerUnit: tx.pricePerUnit,
          fees: tx.fees,
          totalInvested,
          currentPrice,
          currentValue,
          gainLoss,
          gainLossPercent,
          daysHeld,
          annualizedReturn,
        })
      })
    })

    // Sort by purchase date (newest first)
    return allCohorts.sort(
      (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    )
  }, [holdings, holdingId])

  const formatCurrency = (value: number | null, currency = 'EUR') => {
    if (value === null) return '—'
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency,
    }).format(value)
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return '—'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-gray-500 dark:text-gray-400">A carregar cohorts...</div>
      </div>
    )
  }

  if (cohorts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-gray-500 dark:text-gray-400">
          Sem compras registadas. Adicione transações para ver o desempenho de cada compra.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Desempenho por Compra</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Cada compra é rastreada desde o seu ponto de entrada
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ativo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Data de Compra
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Unidades
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Preço de Entrada
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Investido
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Valor Atual
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ganho/Perda
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Retorno Anual
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {cohorts.map(cohort => (
              <tr
                key={cohort.transactionId}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {cohort.holdingName}
                    </div>
                    {cohort.ticker && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {cohort.ticker}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(cohort.purchaseDate)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {cohort.daysHeld} dias
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  {Number(cohort.units).toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                  {formatCurrency(cohort.pricePerUnit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(cohort.totalInvested)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(cohort.currentValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div
                    className={`text-sm font-medium ${
                      cohort.gainLoss === null
                        ? 'text-gray-900 dark:text-white'
                        : cohort.gainLoss >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {cohort.gainLoss !== null && cohort.gainLoss >= 0 ? (
                        <TrendingUp size={16} />
                      ) : cohort.gainLoss !== null ? (
                        <TrendingDown size={16} />
                      ) : null}
                      <span>{formatCurrency(cohort.gainLoss)}</span>
                    </div>
                  </div>
                  <div
                    className={`text-xs ${
                      cohort.gainLossPercent === null
                        ? 'text-gray-500 dark:text-gray-400'
                        : cohort.gainLossPercent >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatPercent(cohort.gainLossPercent)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div
                    className={`text-sm font-medium ${
                      cohort.annualizedReturn === null
                        ? 'text-gray-900 dark:text-white'
                        : cohort.annualizedReturn >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatPercent(cohort.annualizedReturn)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {cohorts.map(cohort => (
          <div key={cohort.transactionId} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {cohort.holdingName}
                </h3>
                {cohort.ticker && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cohort.ticker}</p>
                )}
              </div>
              <div
                className={`text-sm font-medium ${
                  cohort.gainLoss === null
                    ? 'text-gray-900 dark:text-white'
                    : cohort.gainLoss >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPercent(cohort.gainLossPercent)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-2">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Data de Compra</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatDate(cohort.purchaseDate)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cohort.daysHeld} dias</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Unidades</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {Number(cohort.units).toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Investido</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(cohort.totalInvested)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Valor Atual</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(cohort.currentValue)}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Ganho/Perda</p>
                  <p
                    className={`font-medium ${
                      cohort.gainLoss === null
                        ? 'text-gray-900 dark:text-white'
                        : cohort.gainLoss >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(cohort.gainLoss)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Retorno Anual</p>
                  <p
                    className={`font-medium ${
                      cohort.annualizedReturn === null
                        ? 'text-gray-900 dark:text-white'
                        : cohort.annualizedReturn >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatPercent(cohort.annualizedReturn)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
