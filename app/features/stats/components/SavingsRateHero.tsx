'use client'

import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'
import { useSavingsTrend } from '@/lib/queries/stats'

interface SavingsRateHeroProps {
  savingsRate: number
  language: 'pt' | 'en'
  className?: string
}

const TARGET_RATE = 25

function getSavingsRateColor(rate: number) {
  if (rate < 0) return 'text-red-600 dark:text-red-400'
  if (rate < 15) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getChartColor(rate: number) {
  if (rate < 0) return '#dc2626'
  if (rate < 15) return '#d97706'
  return '#059669'
}

function getSavingsRateMessage(rate: number, language: 'pt' | 'en') {
  if (rate < 0) {
    return language === 'pt' ? 'Gastando mais que ganha' : 'Spending more than earning'
  }
  if (rate < 15) {
    return language === 'pt' ? 'Pode melhorar' : 'Can improve'
  }
  return language === 'pt' ? 'Excelente!' : 'Excellent!'
}

export function SavingsRateHero({ savingsRate, language, className = '' }: SavingsRateHeroProps) {
  const { data: trendData, isLoading: isTrendLoading } = useSavingsTrend()

  // Calculate delta vs previous month
  const delta =
    trendData && trendData.length >= 2
      ? trendData[trendData.length - 1].savingsRate - trendData[trendData.length - 2].savingsRate
      : null

  const chartColor = getChartColor(savingsRate)

  return (
    <div
      className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {language === 'pt' ? 'Taxa de Poupan\u00e7a' : 'Savings Rate'}
        </h3>
      </div>

      {/* Main rate display */}
      <p className={`text-2xl font-bold ${getSavingsRateColor(savingsRate)}`}>
        {savingsRate.toFixed(1)}%
      </p>

      {/* Delta indicator */}
      {delta !== null && (
        <div className="flex items-center gap-1 mt-1">
          {delta > 0.1 && (
            <TrendingUp size={12} className="text-emerald-600 dark:text-emerald-400" />
          )}
          {delta < -0.1 && <TrendingDown size={12} className="text-red-600 dark:text-red-400" />}
          {Math.abs(delta) <= 0.1 && <Minus size={12} className="text-gray-400" />}
          <span
            className={`text-xs font-medium ${
              delta > 0.1
                ? 'text-emerald-600 dark:text-emerald-400'
                : delta < -0.1
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)}% {language === 'pt' ? 'vs. m\u00eas ant.' : 'vs. last mo.'}
          </span>
        </div>
      )}

      {/* Status message */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {getSavingsRateMessage(savingsRate, language)}
      </p>

      {/* Target reference */}
      <div className="flex items-center gap-1 mt-2">
        <Target size={10} className="text-gray-400" />
        <span className="text-xs text-gray-400">
          {language === 'pt' ? 'Meta' : 'Target'}: {TARGET_RATE}%
        </span>
      </div>

      {/* Sparkline trend chart */}
      {isTrendLoading ? (
        <div className="mt-3 h-[48px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      ) : trendData && trendData.length > 1 ? (
        <div className="mt-3 h-[48px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#1f2937',
                  border: 'none',
                  color: '#fff',
                }}
                formatter={(value: number | undefined) => [
                  value !== undefined ? `${value.toFixed(1)}%` : '',
                  '',
                ]}
                labelFormatter={(label: string) => label}
              />
              <ReferenceLine
                y={TARGET_RATE}
                stroke="#9ca3af"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="savingsRate"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#savingsGradient)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  )
}
