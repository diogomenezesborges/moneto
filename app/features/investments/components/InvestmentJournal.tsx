'use client'

/**
 * Investment Decision Journal Component
 *
 * Tracks investment decisions and quarterly/annual reviews.
 * Helps users remember "Why did I buy this?" and document decision-making context.
 *
 * Issue #114: Investment Tracking - Enhanced with Decision Journal
 */

import { useState } from 'react'
import { BookOpen, Plus, Trash2, Calendar, FileText } from 'lucide-react'
import {
  useInvestmentReviews,
  useCreateInvestmentReview,
  useDeleteInvestmentReview,
  useHoldings,
} from '@/lib/queries/investments'
import type { InvestmentReview, ReviewType } from '../types'

const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  QUARTERLY: 'Revisão Trimestral',
  ANNUAL: 'Revisão Anual',
  AD_HOC: 'Revisão Ad-Hoc',
}

const REVIEW_TYPE_COLORS: Record<ReviewType, string> = {
  QUARTERLY: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  ANNUAL: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  AD_HOC: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
}

export function InvestmentJournal() {
  const { data: reviews, isLoading } = useInvestmentReviews()
  const { data: holdings } = useHoldings()
  const createReview = useCreateInvestmentReview()
  const deleteReview = useDeleteInvestmentReview()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state for new review
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reviewType: 'QUARTERLY' as ReviewType,
    notes: '',
    decisions: [''],
    attachedHoldings: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty decisions
    const decisions = formData.decisions.filter(d => d.trim() !== '')

    if (formData.notes.trim() === '') {
      alert('Por favor, adicione notas sobre esta revisão')
      return
    }

    if (decisions.length === 0) {
      alert('Por favor, adicione pelo menos uma decisão')
      return
    }

    try {
      await createReview.mutateAsync({
        date: new Date(formData.date),
        reviewType: formData.reviewType,
        notes: formData.notes.trim(),
        decisions,
        attachedHoldings: formData.attachedHoldings,
      })

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reviewType: 'QUARTERLY',
        notes: '',
        decisions: [''],
        attachedHoldings: [],
      })
      setShowAddDialog(false)
    } catch (error) {
      console.error('Failed to create review:', error)
      alert('Erro ao guardar revisão')
    }
  }

  const handleDelete = async (review: InvestmentReview) => {
    if (
      confirm(
        `Eliminar revisão de ${new Date(review.date).toLocaleDateString('pt-PT')}? Esta ação não pode ser revertida.`
      )
    ) {
      try {
        await deleteReview.mutateAsync(review.id)
      } catch (error) {
        alert('Erro ao eliminar revisão')
      }
    }
  }

  const addDecisionField = () => {
    setFormData({
      ...formData,
      decisions: [...formData.decisions, ''],
    })
  }

  const updateDecision = (index: number, value: string) => {
    const newDecisions = [...formData.decisions]
    newDecisions[index] = value
    setFormData({ ...formData, decisions: newDecisions })
  }

  const removeDecision = (index: number) => {
    const newDecisions = formData.decisions.filter((_, i) => i !== index)
    setFormData({ ...formData, decisions: newDecisions })
  }

  const getHoldingName = (holdingId: string) => {
    const holding = holdings?.find(h => h.id === holdingId)
    return holding ? holding.name : holdingId
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-gray-500 dark:text-gray-400">A carregar diário...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={24} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Diário de Investimentos
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Documente decisões e revisões periódicas do seu portfólio
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Nova Revisão</span>
        </button>
      </div>

      {/* Reviews List */}
      {!reviews || reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>Sem revisões registadas</p>
            <p className="text-sm mt-2">
              Comece a documentar as suas decisões de investimento e revisões trimestrais
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
            >
              {/* Review Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(review.date).toLocaleDateString('pt-PT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${REVIEW_TYPE_COLORS[review.reviewType]}`}
                        >
                          {REVIEW_TYPE_LABELS[review.reviewType]}
                        </span>
                      </div>
                      {review.attachedHoldings.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {review.attachedHoldings.length === 1
                            ? '1 ativo'
                            : `${review.attachedHoldings.length} ativos`}{' '}
                          revisado
                          {review.attachedHoldings.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                      className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {expandedId === review.id ? 'Ocultar' : 'Ver Detalhes'}
                    </button>
                    <button
                      onClick={() => handleDelete(review)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Review Content (Expandable) */}
              {expandedId === review.id && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                  {/* Notes */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText size={16} />
                      Notas
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {review.notes}
                    </p>
                  </div>

                  {/* Decisions */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Decisões Tomadas
                    </h4>
                    <ul className="space-y-1">
                      {review.decisions.map((decision, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                        >
                          <span className="text-blue-600 dark:text-blue-400">•</span>
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Attached Holdings */}
                  {review.attachedHoldings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Ativos Revisados
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {review.attachedHoldings.map(holdingId => (
                          <span
                            key={holdingId}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                          >
                            {getHoldingName(holdingId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Review Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nova Revisão</h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Dialog Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Date and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Revisão *
                  </label>
                  <select
                    value={formData.reviewType}
                    onChange={e =>
                      setFormData({ ...formData, reviewType: e.target.value as ReviewType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="QUARTERLY">Trimestral</option>
                    <option value="ANNUAL">Anual</option>
                    <option value="AD_HOC">Ad-Hoc</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas *
                </label>
                <textarea
                  required
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Contexto da revisão, análise de mercado, sentimentos..."
                />
              </div>

              {/* Decisions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Decisões Tomadas *
                  </label>
                  <button
                    type="button"
                    onClick={addDecisionField}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Adicionar Decisão
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.decisions.map((decision, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={decision}
                        onChange={e => updateDecision(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="ex: Hold IWDA, Sell retirement fund"
                      />
                      {formData.decisions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDecision(index)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createReview.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createReview.isPending ? 'A guardar...' : 'Guardar Revisão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
