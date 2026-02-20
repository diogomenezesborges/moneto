'use client'

/**
 * Cost Transparency Dashboard Component
 *
 * Displays all hidden costs (platform fees, management fees, custody fees, FX conversion, market fees)
 * and their impact on portfolio returns. Provides "real truth" for better decision-making.
 *
 * Issue #114: Investment Tracking - Enhanced with Cost Transparency
 */

import { useState, useMemo } from 'react'
import { DollarSign, TrendingDown, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useRecurringCosts, useDeleteRecurringCost } from '@/lib/queries/investments'
import type { RecurringCost, CostImpactAnalysis } from '../types'
import { AddCostDialog } from './AddCostDialog'

const COST_TYPE_LABELS: Record<string, string> = {
  PLATFORM_FEE: 'Taxa da Plataforma',
  MANAGEMENT_FEE: 'Taxa de Gestão',
  CUSTODY_FEE: 'Taxa de Custódia',
  FX_CONVERSION: 'Conversão de Moeda',
  MARKET_FEE: 'Taxa de Mercado',
}

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
}

export function CostTransparencyDashboard() {
  const { data: costs, isLoading } = useRecurringCosts()
  const deleteCost = useDeleteRecurringCost()

  const [showAddDialog, setShowAddDialog] = useState(false)

  // Calculate total annualized costs
  const totalAnnualCost = useMemo(() => {
    if (!costs) return 0

    return costs.reduce((total, cost) => {
      const amount = Number(cost.amount)

      // Annualize based on frequency
      let annualizedAmount = 0
      switch (cost.frequency) {
        case 'MONTHLY':
          annualizedAmount = amount * 12
          break
        case 'QUARTERLY':
          annualizedAmount = amount * 4
          break
        case 'ANNUAL':
          annualizedAmount = amount
          break
      }

      return total + annualizedAmount
    }, 0)
  }, [costs])

  // Group costs by type
  const costsByType = useMemo(() => {
    if (!costs) return {}

    return costs.reduce(
      (acc, cost) => {
        const type = cost.type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(cost)
        return acc
      },
      {} as Record<string, RecurringCost[]>
    )
  }, [costs])

  const handleDelete = async (cost: RecurringCost) => {
    if (
      confirm(
        `Eliminar custo "${COST_TYPE_LABELS[cost.type]}" de ${formatCurrency(Number(cost.amount))} (${FREQUENCY_LABELS[cost.frequency]})?`
      )
    ) {
      try {
        await deleteCost.mutateAsync(cost.id)
      } catch (error) {
        alert('Erro ao eliminar custo')
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const getAnnualizedAmount = (cost: RecurringCost) => {
    const amount = Number(cost.amount)
    switch (cost.frequency) {
      case 'MONTHLY':
        return amount * 12
      case 'QUARTERLY':
        return amount * 4
      case 'ANNUAL':
        return amount
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-gray-500 dark:text-gray-400">A carregar custos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Total Annual Cost */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Transparência de Custos
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Custos recorrentes que afetam o retorno real dos seus investimentos
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Custo Anual Total</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalAnnualCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Cost Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white">Custos Registados</h3>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Adicionar Custo</span>
        </button>
      </div>

      {/* Costs List */}
      {!costs || costs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>Sem custos registados</p>
            <p className="text-sm mt-2">
              Adicione taxas de plataforma, gestão, custódia e outros custos para ver o impacto real
              no seu portfólio
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo de Custo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ativo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Frequência
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Custo Anual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {costs.map(cost => (
                <tr
                  key={cost.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {COST_TYPE_LABELS[cost.type]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {cost.holdingId ? 'Específico' : 'Portfólio'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(Number(cost.amount))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                    {FREQUENCY_LABELS[cost.frequency]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(getAnnualizedAmount(cost))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(cost)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Impact Analysis */}
      {totalAnnualCost > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                Impacto nos Retornos
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Custos anuais de <strong>{formatCurrency(totalAnnualCost)}</strong> reduzem o seu
                retorno real. Por exemplo, um investimento com 5% de retorno bruto e custos de 1,2%
                resulta em apenas <strong>3,8% de retorno líquido</strong>.
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Dica: Compare sempre o retorno líquido (após custos) quando avaliar alternativas de
                investimento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Cost Dialog */}
      <AddCostDialog isOpen={showAddDialog} onClose={() => setShowAddDialog(false)} />
    </div>
  )
}
