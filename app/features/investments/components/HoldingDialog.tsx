'use client'

/**
 * Holding Dialog Component
 *
 * Modal dialog for creating or editing a holding.
 * Issue #109: Investment Tracking - Holdings List UI
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCreateHolding, useUpdateHolding } from '@/lib/queries/investments'
import type { HoldingWithStats, HoldingType } from '../types'

interface HoldingDialogProps {
  holding: HoldingWithStats | null
  onClose: () => void
}

const HOLDING_TYPES: { value: HoldingType; label: string }[] = [
  { value: 'ETF', label: 'ETF' },
  { value: 'PPR', label: 'PPR' },
  { value: 'STOCK', label: 'Ação' },
  { value: 'BOND', label: 'Obrigação' },
  { value: 'CRYPTO', label: 'Criptomoeda' },
  { value: 'OTHER', label: 'Outro' },
]

export function HoldingDialog({ holding, onClose }: HoldingDialogProps) {
  const isEditing = !!holding

  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    type: 'ETF' as HoldingType,
    currency: 'EUR',
    notes: '',
  })

  const createHolding = useCreateHolding()
  const updateHolding = useUpdateHolding()

  useEffect(() => {
    if (holding) {
      setFormData({
        name: holding.name,
        ticker: holding.ticker || '',
        type: holding.type,
        currency: holding.currency,
        notes: holding.notes || '',
      })
    }
  }, [holding])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = {
        ...formData,
        ticker: formData.ticker.trim() || null,
        notes: formData.notes.trim() || null,
      }

      if (isEditing) {
        await updateHolding.mutateAsync({
          id: holding.id,
          ...data,
        })
      } else {
        await createHolding.mutateAsync(data)
      }

      onClose()
    } catch (error) {
      console.error('Failed to save holding:', error)
      alert('Erro ao guardar ativo')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="holding-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="holding-dialog-title" className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Editar Ativo' : 'Adicionar Ativo'}
          </h2>
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
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nome do Ativo *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              placeholder="ex: IWDA, Retirement Fund, Apple"
            />
          </div>

          {/* Ticker */}
          <div>
            <label
              htmlFor="ticker"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Ticker (opcional)
            </label>
            <input
              id="ticker"
              type="text"
              value={formData.ticker}
              onChange={e => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              placeholder="ex: IWDA.AS, AAPL"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Para ativos sem ticker (PPR, etc.), deixe em branco
            </p>
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Tipo de Ativo *
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as HoldingType })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              {HOLDING_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Moeda *
            </label>
            <select
              id="currency"
              required
              value={formData.currency}
              onChange={e => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </select>
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
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Detalhes adicionais sobre este ativo..."
            />
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
              disabled={createHolding.isPending || updateHolding.isPending}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createHolding.isPending || updateHolding.isPending
                ? 'A guardar...'
                : isEditing
                  ? 'Atualizar'
                  : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
