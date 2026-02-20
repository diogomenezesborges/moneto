'use client'

/**
 * Holdings List Component
 *
 * Displays list of holdings with metrics in table (desktop) and card (mobile) views.
 * Issue #109: Investment Tracking - Holdings List UI
 */

import { Fragment, useState, useMemo } from 'react'
import { Edit, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useDeleteHolding } from '@/lib/queries/investments'
import { TransactionDialog } from './TransactionDialog'
import { TransactionsList } from './TransactionsList'
import type { HoldingWithStats, SortBy, SortOrder } from '../types'

interface HoldingsListProps {
  holdings: HoldingWithStats[]
  onEdit: (holding: HoldingWithStats) => void
}

export function HoldingsList({ holdings, onEdit }: HoldingsListProps) {
  const [sortBy, setSortBy] = useState<SortBy>('value')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [transactionHolding, setTransactionHolding] = useState<HoldingWithStats | null>(null)

  const deleteHolding = useDeleteHolding()

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'value':
          comparison = (a.currentValue || 0) - (b.currentValue || 0)
          break
        case 'gain':
          comparison = (a.gainLossPercent || 0) - (b.gainLossPercent || 0)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [holdings, sortBy, sortOrder])

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleDelete = async (holding: HoldingWithStats) => {
    if (
      confirm(
        `Tem a certeza que deseja eliminar "${holding.name}"? Esta ação não pode ser revertida.`
      )
    ) {
      try {
        await deleteHolding.mutateAsync(holding.id)
      } catch (error) {
        alert('Erro ao eliminar ativo')
      }
    }
  }

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

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-1">
                  Ativo
                  <SortIcon column="name" />
                </div>
              </th>
              <th
                onClick={() => handleSort('type')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center gap-1">
                  Tipo
                  <SortIcon column="type" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Unidades
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Custo Médio
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Preço Atual
              </th>
              <th
                onClick={() => handleSort('value')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center justify-end gap-1">
                  Valor Atual
                  <SortIcon column="value" />
                </div>
              </th>
              <th
                onClick={() => handleSort('gain')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center justify-end gap-1">
                  Ganho/Perda
                  <SortIcon column="gain" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedHoldings.map(holding => (
              <Fragment key={holding.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {holding.name}
                      </div>
                      {holding.ticker && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {holding.ticker}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {holding.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {holding.totalUnits.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(holding.averageCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(holding.currentValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div
                      className={`text-sm font-medium ${
                        holding.gainLoss === null
                          ? 'text-gray-900 dark:text-white'
                          : holding.gainLoss >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(holding.gainLoss)}
                    </div>
                    <div
                      className={`text-xs ${
                        holding.gainLossPercent === null
                          ? 'text-gray-500 dark:text-gray-400'
                          : holding.gainLossPercent >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatPercent(holding.gainLossPercent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-0">
                      <button
                        onClick={() => setTransactionHolding(holding)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                        title="Adicionar Transação"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => onEdit(holding)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(holding)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === holding.id ? null : holding.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
                        title="Ver Transações"
                      >
                        {expandedId === holding.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === holding.id && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                      <TransactionsList holdingId={holding.id} holdingName={holding.name} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {sortedHoldings.map(holding => (
          <div key={holding.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {holding.name}
                </h3>
                {holding.ticker && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{holding.ticker}</p>
                )}
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  {holding.type}
                </span>
              </div>
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setTransactionHolding(holding)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-green-600 dark:text-green-400"
                  title="Adicionar Transação"
                >
                  <Plus size={18} />
                </button>
                <button
                  onClick={() => onEdit(holding)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 dark:text-blue-400"
                  title="Editar"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(holding)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 dark:text-red-400"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Unidades</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {holding.totalUnits.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Custo Médio</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(holding.averageCost)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Valor Atual</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(holding.currentValue)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Ganho/Perda</p>
                <div>
                  <p
                    className={`font-medium ${
                      holding.gainLoss === null
                        ? 'text-gray-900 dark:text-white'
                        : holding.gainLoss >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(holding.gainLoss)}
                  </p>
                  <p
                    className={`text-xs ${
                      holding.gainLossPercent === null
                        ? 'text-gray-500 dark:text-gray-400'
                        : holding.gainLossPercent >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatPercent(holding.gainLossPercent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Transactions List */}
            <TransactionsList holdingId={holding.id} holdingName={holding.name} />
          </div>
        ))}
      </div>

      {/* Transaction Dialog */}
      {transactionHolding && (
        <TransactionDialog
          holding={transactionHolding}
          onClose={() => setTransactionHolding(null)}
        />
      )}
    </div>
  )
}
