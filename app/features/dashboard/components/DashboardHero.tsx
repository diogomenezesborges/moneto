/**
 * DashboardHero Component
 *
 * Landing dashboard with KPI cards and quick actions.
 * Issue #232: Add dashboard landing with KPI cards
 * Issue #198: Real net worth from account balances + investments
 */

'use client'

import { useState } from 'react'
import { ChevronDown, Eye, TrendingUp, TrendingDown, Wallet, Target, Minus } from 'lucide-react'
import { useNetWorth, calculateTrend } from '@/lib/queries/net-worth'
import { SavingsRateHero } from '@/app/features/stats/components/SavingsRateHero'

interface DashboardHeroProps {
  stats: {
    metrics: {
      totalIncome: number
      totalExpenses: number
      savingsRate: number
    }
  }
  reviewCount: number
  language: 'pt' | 'en'
  onNavigateToReview?: () => void
}

export function DashboardHero({
  stats,
  reviewCount,
  language,
  onNavigateToReview,
}: DashboardHeroProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const { totalExpenses, savingsRate } = stats.metrics

  // Real net worth from account balances + investment holdings (Issue #198)
  const { data: netWorthData, isLoading: isNetWorthLoading } = useNetWorth()
  const netWorth = netWorthData?.netWorth ?? 0
  const netWorthTrend = netWorthData ? calculateTrend(netWorthData.history) : null

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Budget target (placeholder - could be from settings in future)
  const budgetTarget = 2000
  const budgetProgress = (totalExpenses / budgetTarget) * 100

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {language === 'pt' ? 'Visão Geral' : 'Overview'}
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <ChevronDown
            size={20}
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isExpanded && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Net Worth Card — real data from /api/net-worth (Issue #198) */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {language === 'pt' ? 'Patrimônio Líquido' : 'Net Worth'}
                </h3>
              </div>
              {isNetWorthLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              ) : (
                <>
                  <p
                    className={`text-2xl font-bold ${
                      netWorth >= 0
                        ? 'text-gray-900 dark:text-white'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(netWorth)}
                  </p>
                  {netWorthTrend ? (
                    <div className="flex items-center gap-1 mt-1">
                      {netWorthTrend.direction === 'up' && (
                        <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                      {netWorthTrend.direction === 'down' && (
                        <TrendingDown size={12} className="text-red-600 dark:text-red-400" />
                      )}
                      {netWorthTrend.direction === 'neutral' && (
                        <Minus size={12} className="text-gray-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          netWorthTrend.direction === 'up'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : netWorthTrend.direction === 'down'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {netWorthTrend.changePercent >= 0 ? '+' : ''}
                        {netWorthTrend.changePercent.toFixed(1)}%{' '}
                        {language === 'pt' ? 'vs. mês ant.' : 'vs. last mo.'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === 'pt'
                        ? `${netWorthData?.accounts.length ?? 0} contas + ${netWorthData?.holdings.length ?? 0} ativos`
                        : `${netWorthData?.accounts.length ?? 0} accounts + ${netWorthData?.holdings.length ?? 0} assets`}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Savings Rate Hero Card (Issue #199) */}
            <SavingsRateHero savingsRate={savingsRate} language={language} />

            {/* Monthly Budget Card */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {language === 'pt' ? 'Orçamento Mensal' : 'Monthly Budget'}
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalExpenses)}
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>
                    {language === 'pt' ? 'Meta' : 'Target'}: {formatCurrency(budgetTarget)}
                  </span>
                  <span>{budgetProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      budgetProgress > 100
                        ? 'bg-red-500'
                        : budgetProgress > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {reviewCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-lg">
                    <Eye size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      {language === 'pt'
                        ? `${reviewCount} ${reviewCount === 1 ? 'item' : 'itens'} para revisar`
                        : `${reviewCount} ${reviewCount === 1 ? 'item' : 'items'} to review`}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {language === 'pt'
                        ? 'Transações importadas aguardando aprovação'
                        : 'Imported transactions awaiting approval'}
                    </p>
                  </div>
                </div>
                {onNavigateToReview && (
                  <button
                    onClick={onNavigateToReview}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
                  >
                    {language === 'pt' ? 'Revisar' : 'Review'}
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
