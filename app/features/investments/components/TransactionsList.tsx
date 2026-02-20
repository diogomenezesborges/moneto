'use client'

/**
 * Transactions List Component
 *
 * Displays list of transactions for a holding with delete functionality.
 * Issue #110: Investment Tracking - Transaction Recording UI
 */

import { useState } from 'react'
import { Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react'
import { useTransactions, useDeleteTransaction } from '@/lib/queries/investments'

interface TransactionsListProps {
  holdingId: string
  holdingName: string
}

export function TransactionsList({ holdingId, holdingName }: TransactionsListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: transactions, isLoading } = useTransactions(holdingId)
  const deleteTransaction = useDeleteTransaction()

  const handleDelete = async (id: string, type: string, units: number, date: Date) => {
    if (
      confirm(
        `Eliminar transação de ${type} de ${units} unidades em ${new Date(date).toLocaleDateString('pt-PT')}?`
      )
    ) {
      try {
        await deleteTransaction.mutateAsync(id)
      } catch (error) {
        alert('Erro ao eliminar transação')
      }
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">A carregar transações...</div>
  }

  if (!transactions || transactions.length === 0) {
    return <div className="text-sm text-gray-500 dark:text-gray-400">Sem transações registadas</div>
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span>
          {transactions.length} {transactions.length === 1 ? 'transação' : 'transações'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {transactions.map(tx => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {/* Type Icon */}
                <div
                  className={`p-2 rounded-full ${
                    tx.type === 'BUY'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  {tx.type === 'BUY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>

                {/* Transaction Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tx.type === 'BUY' ? 'Compra' : 'Venda'} de {Number(tx.units).toFixed(4)}{' '}
                      unidades
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>{new Date(tx.date).toLocaleDateString('pt-PT')}</span>
                    <span>•</span>
                    <span>
                      {new Intl.NumberFormat('pt-PT', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(Number(tx.pricePerUnit))}{' '}
                      / unidade
                    </span>
                    {Number(tx.fees) > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          Comissões:{' '}
                          {new Intl.NumberFormat('pt-PT', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(Number(tx.fees))}
                        </span>
                      </>
                    )}
                  </div>
                  {tx.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tx.notes}</p>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(tx.id, tx.type, Number(tx.units), tx.date)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2"
                title="Eliminar transação"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
