'use client'

import { X, Save, Flag } from 'lucide-react'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { TagSelector } from '@/components/ui/TagSelector'
import { BankSelector } from '@/components/ui/BankSelector'
import { DateInput } from '@/components/ui/DateInput'
import type { EditForm } from '../../shared/types'

interface TransactionEditDialogProps {
  isOpen: boolean
  editForm: EditForm
  savingEdit: boolean
  validationErrors: string[]
  language: 'pt' | 'en'
  token: string
  onClose: () => void
  onSave: () => void
  onUpdateForm: (updates: Partial<EditForm>) => void
}

export function TransactionEditDialog({
  isOpen,
  editForm,
  savingEdit,
  validationErrors,
  language,
  token,
  onClose,
  onSave,
  onUpdateForm,
}: TransactionEditDialogProps) {
  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transaction-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div>
            <h2
              id="edit-transaction-dialog-title"
              className="text-2xl font-bold text-indigo-900 dark:text-white"
            >
              {language === 'en' ? 'Edit Transaction' : 'Editar Transação'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {language === 'en' ? 'Update transaction details' : 'Atualizar detalhes da transação'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={savingEdit}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={language === 'en' ? 'Close' : 'Fechar'}
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
                className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl"
                role="alert"
                aria-live="polite"
              >
                <h3 className="text-sm font-bold text-red-700 dark:text-red-300 mb-2">
                  {language === 'en' ? 'Validation Errors:' : 'Erros de Validação:'}
                </h3>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Core Fields Section */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 space-y-4">
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {language === 'en' ? '📋 Transaction Details' : '📋 Detalhes da Transação'}
              </h3>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {language === 'en' ? 'Date *' : 'Data *'}
                </label>
                <DateInput
                  value={editForm.rawDate || null}
                  onChange={date => onUpdateForm({ rawDate: date })}
                  placeholder={language === 'en' ? 'DD/MM/YYYY' : 'DD/MM/AAAA'}
                  className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {language === 'en' ? 'Description *' : 'Descrição *'}
                </label>
                <input
                  type="text"
                  value={editForm.rawDescription || ''}
                  onChange={e => onUpdateForm({ rawDescription: e.target.value })}
                  disabled={savingEdit}
                  className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={
                    language === 'en' ? 'Transaction description' : 'Descrição da transação'
                  }
                />
              </div>

              {/* Amount & Balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                    {language === 'en' ? 'Amount (€) *' : 'Montante (€) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.rawAmount !== undefined ? editForm.rawAmount : ''}
                    onChange={e => onUpdateForm({ rawAmount: parseFloat(e.target.value) })}
                    disabled={savingEdit}
                    className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                    {language === 'en' ? 'Balance (€)' : 'Saldo (€)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      editForm.rawBalance !== undefined && editForm.rawBalance !== null
                        ? editForm.rawBalance
                        : ''
                    }
                    onChange={e =>
                      onUpdateForm({
                        rawBalance: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    disabled={savingEdit}
                    className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {language === 'en' ? 'Notes' : 'Notas'}
                </label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={e => onUpdateForm({ notes: e.target.value })}
                  disabled={savingEdit}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  placeholder={
                    language === 'en'
                      ? 'Additional notes or comments...'
                      : 'Notas ou comentários adicionais...'
                  }
                />
              </div>
            </div>

            {/* Category Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">
                <span className="text-lg">📁</span>
                {language === 'en' ? 'Category' : 'Categoria'}
              </label>
              <CategorySelector
                majorCategoryId={editForm.majorCategoryId || null}
                categoryId={editForm.categoryId || null}
                onChange={selection => {
                  onUpdateForm({
                    majorCategoryId: selection.majorCategoryId,
                    categoryId: selection.categoryId,
                    majorCategory: selection.majorCategory,
                    category: selection.category,
                  })
                }}
                token={token}
                language={language}
              />
            </div>

            {/* Tags Section */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
              <label className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-300 mb-3">
                <span className="text-lg">🏷️</span>
                Tags
              </label>
              <TagSelector
                selectedTags={editForm.tags || []}
                onChange={tags => onUpdateForm({ tags })}
                token={token}
                language={language}
                disabled={savingEdit}
              />
            </div>

            {/* Metadata Section */}
            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800 space-y-4">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {language === 'en' ? '🏦 Banking & Status' : '🏦 Banco & Estado'}
              </h3>

              {/* Bank & Origin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                    {language === 'en' ? 'Bank *' : 'Banco *'}
                  </label>
                  <BankSelector
                    value={editForm.bank || ''}
                    onChange={bank => onUpdateForm({ bank })}
                    token={token}
                    disabled={savingEdit}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                    {language === 'en' ? 'Origin *' : 'Origem *'}
                  </label>
                  <select
                    value={editForm.origin || ''}
                    onChange={e => onUpdateForm({ origin: e.target.value })}
                    disabled={savingEdit}
                    className="w-full px-3 py-2.5 text-sm font-medium border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-white dark:bg-slate-800 text-amber-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white dark:[&>option]:bg-slate-800 [&>option]:text-gray-900 dark:[&>option]:text-white"
                  >
                    <option
                      value=""
                      className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      -- {language === 'en' ? 'Select' : 'Selecionar'} --
                    </option>
                    <option
                      value="Personal"
                      className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      Personal
                    </option>
                    <option
                      value="Joint"
                      className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      Joint
                    </option>
                    <option
                      value="Family"
                      className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      Family
                    </option>
                    <option
                      value="Other"
                      className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      Other
                    </option>
                  </select>
                </div>
              </div>

              {/* Status & Flagged */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                    {language === 'en' ? 'Status' : 'Estado'}
                  </label>
                  <select
                    value={editForm.status || 'pending'}
                    onChange={e => onUpdateForm({ status: e.target.value })}
                    disabled={savingEdit}
                    className="w-full px-3 py-2.5 text-sm font-medium border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-white dark:bg-slate-800 text-amber-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-white dark:[&>option]:bg-slate-800 [&>option]:text-gray-900 dark:[&>option]:text-white"
                  >
                    <option
                      value="categorized"
                      className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      {language === 'en' ? '✅ Categorized' : '✅ Categorizado'}
                    </option>
                    <option
                      value="pending"
                      className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    >
                      {language === 'en'
                        ? '⏳ Pending categorization'
                        : '⏳ Pendente de categorização'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                    {language === 'en' ? 'Flagged' : 'Marcado'}
                  </label>
                  <button
                    type="button"
                    onClick={() => onUpdateForm({ flagged: !editForm.flagged })}
                    disabled={savingEdit}
                    className={`w-full px-3 py-2.5 text-sm font-medium border-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      editForm.flagged
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-slate-700 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Flag size={16} className={editForm.flagged ? 'fill-current' : ''} />
                    {editForm.flagged
                      ? language === 'en'
                        ? 'Flagged'
                        : 'Marcado'
                      : language === 'en'
                        ? 'Not Flagged'
                        : 'Não Marcado'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={savingEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingEdit ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {language === 'en' ? 'Saving...' : 'Salvando...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {language === 'en' ? 'Save Changes' : 'Salvar Alterações'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
