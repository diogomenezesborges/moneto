'use client'

import { X, Plus } from 'lucide-react'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { TagSelector } from '@/components/ui/TagSelector'
import { BankSelector } from '@/components/ui/BankSelector'
import { DateInput } from '@/components/ui/DateInput'

interface AddForm {
  rawDate?: Date | null
  rawDescription?: string
  rawAmount?: number
  rawBalance?: number | null
  notes?: string | null
  origin?: string
  bank?: string
  majorCategoryId?: string | null
  categoryId?: string | null
  majorCategory?: string | null
  category?: string | null
  tags?: string[]
  status?: string
}

interface TransactionAddDialogProps {
  isOpen: boolean
  addForm: AddForm
  saving: boolean
  validationErrors: string[]
  language: 'pt' | 'en'
  token: string
  onClose: () => void
  onSave: () => void
  onUpdateForm: (updates: Partial<AddForm>) => void
}

export function TransactionAddDialog({
  isOpen,
  addForm,
  saving,
  validationErrors,
  language,
  token,
  onClose,
  onSave,
  onUpdateForm,
}: TransactionAddDialogProps) {
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
        aria-labelledby="add-transaction-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div>
            <h2
              id="add-transaction-dialog-title"
              className="text-2xl font-bold text-indigo-900 dark:text-white"
            >
              {language === 'en' ? 'Add New Transaction' : 'Adicionar Nova Transação'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {language === 'en'
                ? 'Create a new transaction manually'
                : 'Criar nova transação manualmente'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={language === 'en' ? 'Close' : 'Fechar'}
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Body */}
          <div className="p-6 space-y-6 overflow-visible">
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

            {/* Bank Section - Moved to Top */}
            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800 space-y-4 overflow-visible">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {language === 'en' ? '🏦 Bank' : '🏦 Banco'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="overflow-visible">
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                    {language === 'en' ? 'Bank *' : 'Banco *'}
                  </label>
                  <BankSelector
                    value={addForm.bank || ''}
                    onChange={bank => onUpdateForm({ bank })}
                    token={token}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                    {language === 'en' ? 'Origin *' : 'Origem *'}
                  </label>
                  <select
                    value={addForm.origin || ''}
                    onChange={e => onUpdateForm({ origin: e.target.value })}
                    disabled={saving}
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
            </div>

            {/* Transaction Details Section */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 space-y-4">
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {language === 'en' ? '📋 Transaction Details' : '📋 Detalhes da Transação'}
              </h3>

              {/* Description & Amount - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                    {language === 'en' ? 'Description *' : 'Descrição *'}
                  </label>
                  <input
                    type="text"
                    value={addForm.rawDescription || ''}
                    onChange={e => onUpdateForm({ rawDescription: e.target.value })}
                    disabled={saving}
                    className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={
                      language === 'en' ? 'Transaction description' : 'Descrição da transação'
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                    {language === 'en' ? 'Amount (€) *' : 'Montante (€) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.rawAmount !== undefined ? addForm.rawAmount : ''}
                    onChange={e => onUpdateForm({ rawAmount: parseFloat(e.target.value) })}
                    disabled={saving}
                    className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {language === 'en' ? 'Date *' : 'Data *'}
                </label>
                <DateInput
                  value={addForm.rawDate || null}
                  onChange={date => onUpdateForm({ rawDate: date })}
                  placeholder={language === 'en' ? 'DD/MM/YYYY' : 'DD/MM/AAAA'}
                  className="w-full px-3 py-2.5 text-sm font-medium border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-slate-700 text-blue-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                  {language === 'en' ? 'Notes' : 'Notas'}
                </label>
                <textarea
                  value={addForm.notes || ''}
                  onChange={e => onUpdateForm({ notes: e.target.value })}
                  disabled={saving}
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

            {/* Categorization Section - Category & Tags Side by Side */}
            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 space-y-4 overflow-visible">
              <h3 className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {language === 'en' ? '📁 Categorization' : '📁 Categorização'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                {/* Category */}
                <div className="overflow-visible">
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 mb-2">
                    {language === 'en' ? 'Category' : 'Categoria'}
                  </label>
                  <CategorySelector
                    majorCategoryId={addForm.majorCategoryId || null}
                    categoryId={addForm.categoryId || null}
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

                {/* Tags */}
                <div className="overflow-visible">
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 mb-2">
                    Tags
                  </label>
                  <TagSelector
                    selectedTags={addForm.tags || []}
                    onChange={tags => onUpdateForm({ tags })}
                    token={token}
                    language={language}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {language === 'en' ? 'Creating...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {language === 'en' ? 'Create Transaction' : 'Criar Transação'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
