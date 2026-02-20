'use client'

import { X } from 'lucide-react'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { TagSelector } from '@/components/ui/TagSelector'
import { BankSelector } from '@/components/ui/BankSelector'

interface BulkEditForm {
  majorCategoryId?: string | null
  categoryId?: string | null
  majorCategory?: string | null
  category?: string | null
  tags?: string[]
  status?: string
  bank?: string
  origin?: string
  month?: number | null
  year?: number | null
}

interface BulkEditDialogProps {
  isOpen: boolean
  selectedCount: number
  bulkEditForm: BulkEditForm
  isProcessing: boolean
  language: 'pt' | 'en'
  token: string
  onClose: () => void
  onSave: () => void
  onUpdateForm: (updates: Partial<BulkEditForm>) => void
}

export function BulkEditDialog({
  isOpen,
  selectedCount,
  bulkEditForm,
  isProcessing,
  language,
  token,
  onClose,
  onSave,
  onUpdateForm,
}: BulkEditDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2
              id="bulk-edit-dialog-title"
              className="text-2xl font-bold text-indigo-900 dark:text-white"
            >
              {language === 'en' ? 'Bulk Edit Transactions' : 'Editar Transações em Lote'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {language === 'en'
                ? `Editing ${selectedCount} transaction${selectedCount > 1 ? 's' : ''}`
                : `Editando ${selectedCount} transaçõ${selectedCount > 1 ? 'es' : 'ão'}`}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            aria-label={language === 'en' ? 'Close' : 'Fechar'}
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info Message */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {language === 'en'
                ? 'Only filled fields will be updated. Leave fields empty to keep existing values.'
                : 'Apenas os campos preenchidos serão atualizados. Deixe campos vazios para manter valores existentes.'}
            </p>
          </div>

          {/* Category Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">
              <span className="text-lg">📁</span>
              {language === 'en' ? 'Category' : 'Categoria'}
            </label>
            <CategorySelector
              majorCategoryId={bulkEditForm.majorCategoryId || null}
              categoryId={bulkEditForm.categoryId || null}
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
              selectedTags={bulkEditForm.tags || []}
              onChange={tags => onUpdateForm({ tags })}
              token={token}
              language={language}
              disabled={isProcessing}
            />
          </div>

          {/* Bank & Origin Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank */}
            <div>
              <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2">
                {language === 'en' ? 'Bank' : 'Banco'}
              </label>
              <BankSelector
                value={bulkEditForm.bank || ''}
                onChange={bank => onUpdateForm({ bank })}
                token={token}
                disabled={isProcessing}
              />
            </div>

            {/* Origin */}
            <div>
              <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2">
                {language === 'en' ? 'Origin' : 'Origem'}
              </label>
              <select
                value={bulkEditForm.origin || ''}
                onChange={e => onUpdateForm({ origin: e.target.value })}
                disabled={isProcessing}
                className="w-full px-3 py-2.5 text-sm font-medium border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-white dark:bg-slate-700 text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- {language === 'en' ? 'No change' : 'Sem alteração'} --</option>
                <option value="Personal">Personal</option>
                <option value="Joint">Joint</option>
                <option value="Family">Family</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Status Section */}
          <div>
            <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2">
              {language === 'en' ? 'Status' : 'Estado'}
            </label>
            <select
              value={bulkEditForm.status || ''}
              onChange={e => onUpdateForm({ status: e.target.value })}
              disabled={isProcessing}
              className="w-full px-3 py-2.5 text-sm font-medium border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-white dark:bg-slate-700 text-indigo-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- {language === 'en' ? 'No change' : 'Sem alteração'} --</option>
              <option value="categorized">
                {language === 'en' ? 'Categorized' : 'Categorizado'}
              </option>
              <option value="pending">
                {language === 'en' ? 'Pending categorization' : 'Pendente de categorização'}
              </option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {language === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
          <button
            onClick={onSave}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing && (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            {language === 'en' ? 'Apply Changes' : 'Aplicar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
