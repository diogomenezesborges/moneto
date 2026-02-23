'use client'

/**
 * Transaction Dialog Component
 *
 * Modal dialog for recording BUY or SELL transactions.
 * Issue #110: Investment Tracking - Transaction Recording UI
 */

import { useState, useMemo } from 'react'
import { X, TrendingUp, TrendingDown } from 'lucide-react'
import { useCreateTransaction } from '@/lib/queries/investments'
import type { HoldingWithStats, InvestmentTransactionType } from '../types'

interface TransactionDialogProps {
  holding: HoldingWithStats
  onClose: () => void
}

export function TransactionDialog({ holding, onClose }: TransactionDialogProps) {
  const [type, setType] = useState<InvestmentTransactionType>('BUY')
  const [units, setUnits] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [fees, setFees] = useState('0')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const createTransaction = useCreateTransaction()

  const totalCost = useMemo(() => {
    const u = parseFloat(units) || 0
    const p = parseFloat(pricePerUnit) || 0
    const f = parseFloat(fees) || 0
    return u * p + f
  }, [units, pricePerUnit, fees])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: SELL cannot exceed current units
    if (type === 'SELL' && parseFloat(units) > holding.totalUnits) {
      alert(
        `Não pode vender ${units} unidades. Possui apenas ${holding.totalUnits.toFixed(4)} unidades.`
      )
      return
    }

    try {
      await createTransaction.mutateAsync({
        holdingId: holding.id,
        type,
        units: parseFloat(units),
        pricePerUnit: parseFloat(pricePerUnit),
        fees: parseFloat(fees),
        date: new Date(date),
        notes: notes.trim() || null,
      })

      onClose()
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Erro ao registar transação')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2
              id="transaction-dialog-title"
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Registar Transação
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{holding.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Transação *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  type === 'BUY'
                    ? 'border-success bg-success/10 dark:bg-success/20 text-success dark:text-success'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TrendingUp size={20} />
                <span className="font-medium">Compra</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  type === 'SELL'
                    ? 'border-danger bg-danger/10 dark:bg-danger/20 text-danger dark:text-danger'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TrendingDown size={20} />
                <span className="font-medium">Venda</span>
              </button>
            </div>
          </div>

          {/* Units */}
          <div>
            <label
              htmlFor="units"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Unidades *
            </label>
            <input
              id="units"
              type="number"
              step="0.0001"
              min="0.0001"
              required
              value={units}
              onChange={e => setUnits(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              placeholder="ex: 12.5"
            />
            {type === 'SELL' && holding.totalUnits > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Possui {holding.totalUnits.toFixed(4)} unidades
              </p>
            )}
          </div>

          {/* Price Per Unit */}
          <div>
            <label
              htmlFor="pricePerUnit"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Preço por Unidade *
            </label>
            <div className="relative">
              <input
                id="pricePerUnit"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={pricePerUnit}
                onChange={e => setPricePerUnit(e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                placeholder="ex: 82.15"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {holding.currency}
              </span>
            </div>
          </div>

          {/* Fees */}
          <div>
            <label
              htmlFor="fees"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Comissões
            </label>
            <div className="relative">
              <input
                id="fees"
                type="number"
                step="0.01"
                min="0"
                value={fees}
                onChange={e => setFees(e.target.value)}
                className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                {holding.currency}
              </span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Data da Transação *
            </label>
            <input
              id="date"
              type="date"
              required
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              rows={2}
              placeholder="Detalhes sobre esta transação..."
            />
          </div>

          {/* Total Cost Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Total {type === 'BUY' ? 'Investido' : 'Recebido'}:
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {totalCost.toFixed(2)} {holding.currency}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTransaction.isPending}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'BUY' ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90'
              }`}
            >
              {createTransaction.isPending
                ? 'A registar...'
                : type === 'BUY'
                  ? 'Confirmar Compra'
                  : 'Confirmar Venda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
