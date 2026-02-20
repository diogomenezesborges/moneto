'use client'

/**
 * Add Recurring Cost Dialog Component
 *
 * Allows users to create new recurring costs (platform fees, management fees, etc.)
 * for their investment portfolio.
 *
 * Issue #114: Investment Tracking - Cost Transparency Dashboard
 */

import { useState } from 'react'
import { X, Plus, AlertTriangle } from 'lucide-react'
import { useCreateRecurringCost } from '@/lib/queries/investments'
import type { RecurringCostType, RecurringCostFrequency } from '../types'

interface AddCostDialogProps {
  isOpen: boolean
  onClose: () => void
}

const COST_TYPES = [
  { value: 'PLATFORM_FEE', label: 'Taxa da Plataforma' },
  { value: 'MANAGEMENT_FEE', label: 'Taxa de Gestão' },
  { value: 'CUSTODY_FEE', label: 'Taxa de Custódia' },
  { value: 'FX_CONVERSION', label: 'Conversão de Moeda' },
  { value: 'MARKET_FEE', label: 'Taxa de Mercado' },
]

const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'ANNUAL', label: 'Anual' },
]

export function AddCostDialog({ isOpen, onClose }: AddCostDialogProps) {
  const createCost = useCreateRecurringCost()

  const [formData, setFormData] = useState({
    type: 'PLATFORM_FEE' as RecurringCostType,
    amount: '',
    frequency: 'MONTHLY' as RecurringCostFrequency,
    notes: '',
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const errors: string[] = []
    if (!formData.type) errors.push('Tipo de custo é obrigatório')
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.push('Valor deve ser maior que zero')
    }
    if (!formData.frequency) errors.push('Frequência é obrigatória')

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      await createCost.mutateAsync({
        type: formData.type,
        amount: Number(formData.amount),
        frequency: formData.frequency,
        startDate: new Date(),
        notes: formData.notes || null,
      })

      // Reset form and close
      setFormData({
        type: 'PLATFORM_FEE',
        amount: '',
        frequency: 'MONTHLY',
        notes: '',
      })
      setValidationErrors([])
      onClose()
    } catch (error) {
      setValidationErrors(['Erro ao criar custo. Tente novamente.'])
    }
  }

  const handleClose = () => {
    setFormData({
      type: 'PLATFORM_FEE',
      amount: '',
      frequency: 'MONTHLY',
      notes: '',
    })
    setValidationErrors([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-cost-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div>
            <h2
              id="add-cost-dialog-title"
              className="text-2xl font-bold text-primary dark:text-white flex items-center gap-2"
            >
              <Plus className="w-6 h-6" aria-hidden="true" />
              Adicionar Custo Recorrente
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Registar uma taxa ou custo associado aos seus investimentos
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={createCost.isPending}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label="Fechar"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div
                className="bg-danger/10 dark:bg-danger/20 border-2 border-danger/30 dark:border-danger/40 rounded-lg p-4"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm font-semibold text-danger dark:text-danger mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Erros de Validação:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-danger dark:text-danger">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cost Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Tipo de Custo *
              </label>
              <select
                value={formData.type}
                onChange={e =>
                  setFormData({ ...formData, type: e.target.value as RecurringCostType })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
                required
              >
                {COST_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Valor (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Valor cobrado por período (ex: €2.50/mês)
              </p>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Frequência *
              </label>
              <select
                value={formData.frequency}
                onChange={e =>
                  setFormData({ ...formData, frequency: e.target.value as RecurringCostFrequency })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white"
                required
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais sobre este custo..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={handleClose}
              disabled={createCost.isPending}
              className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createCost.isPending}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createCost.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  A guardar...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Adicionar Custo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
