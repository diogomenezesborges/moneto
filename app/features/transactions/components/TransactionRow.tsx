'use client'

import { Save, Edit, Copy, Plus, Trash2, Flag, ChevronDown } from 'lucide-react'
import { OriginAvatar } from '@/components/ui/OriginAvatar'
import { CategoryBadgeCompact } from '@/components/ui/CategoryBadge'
import { TagBadges, TagsLabel } from '@/components/ui/TagDisplay'
import { AIClassifier, ConfidenceBadge } from '@/components/ui/AIClassifier'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { TagSelector } from '@/components/ui/TagSelector'
import { BankSelector } from '@/components/ui/BankSelector'
import { DateInput } from '@/components/ui/DateInput'
import { formatCurrency, formatDate, formatTransactionDescription } from '@/lib/format'
import type { EditForm } from '../../shared/types'

interface Transaction {
  id: string
  rawDate: Date
  rawDescription: string
  rawAmount: number
  rawBalance?: number | null
  notes?: string | null
  origin: string
  bank: string
  status: string
  flagged?: boolean | null
  majorCategoryId?: string | null
  categoryId?: string | null
  majorCategory?: string | null
  category?: string | null
  tags?: string[] | null
  classifierConfidence?: number | null
  classifierReasoning?: string | null
  majorCategoryRef?: {
    id: string
    emoji?: string | null
    name: string
  } | null
  categoryRef?: {
    id: string
    name: string
    icon?: string | null
  } | null
}

interface TransactionRowProps {
  transaction: Transaction
  isEditing: boolean
  isSaving: boolean
  isSelected: boolean
  editForm: EditForm
  validationErrors: string[]
  language: 'pt' | 'en'
  token: string
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggleSelection: (
    event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>
  ) => void
  onToggleFlag: () => void
  onDuplicate: () => void
  onAddAsRule: () => void
  onDelete: () => void
  onUpdateEditForm: (updates: Partial<EditForm>) => void
  onRefreshTransaction: (id: string) => void
}

export function TransactionRow({
  transaction,
  isEditing,
  isSaving,
  isSelected,
  editForm,
  validationErrors,
  language,
  token,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleSelection,
  onToggleFlag,
  onDuplicate,
  onAddAsRule,
  onDelete,
  onUpdateEditForm,
  onRefreshTransaction,
}: TransactionRowProps) {
  const isIncome = transaction.rawAmount > 0

  return (
    <tr
      className={`group transition-all duration-200 ${
        transaction.flagged
          ? 'bg-amber-50/50 dark:bg-amber-500/5 border-l-4 border-l-amber-500 hover:bg-amber-100/50 dark:hover:bg-amber-500/10'
          : isIncome
            ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 border-l-4 border-l-transparent hover:border-l-emerald-500'
            : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 border-l-4 border-l-transparent hover:border-l-indigo-500'
      }`}
    >
      {isEditing ? (
        <>
          {/* Edit Mode: Full row expansion */}
          <td className="px-4 py-3 relative z-50" colSpan={10}>
            <div className="flex flex-col gap-3 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700 relative z-50">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 font-bold text-sm">⚠️</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                        Please fix the following issues:
                      </div>
                      <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-300 space-y-0.5">
                        {validationErrors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 1: Date, Origin, Bank */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">
                    Date *
                  </label>
                  <DateInput
                    value={editForm.rawDate || null}
                    onChange={date => onUpdateEditForm({ rawDate: date ?? undefined })}
                    disabled={isSaving}
                    required
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">
                    Origin *
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.origin || ''}
                      onChange={e => onUpdateEditForm({ origin: e.target.value })}
                      disabled={isSaving}
                      className="w-full pl-3 pr-9 py-2.5 text-sm font-medium border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-700 dark:to-slate-700/50 text-indigo-950 dark:text-white shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-400 dark:focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Joint">Joint</option>
                      <option value="Family">Family</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">
                    Bank *
                  </label>
                  <BankSelector
                    value={editForm.bank || ''}
                    onChange={bankName => onUpdateEditForm({ bank: bankName })}
                    token={token}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Row 2: Category & Tags - Clear visual separation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Section - Structural */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                    <span className="text-base">📁</span>
                    {language === 'en' ? 'Category' : 'Categoria'}
                  </label>
                  <CategorySelector
                    majorCategoryId={editForm.majorCategoryId || transaction.majorCategoryId}
                    categoryId={editForm.categoryId || transaction.categoryId}
                    onChange={selection => {
                      onUpdateEditForm({
                        majorCategoryId: selection.majorCategoryId,
                        categoryId: selection.categoryId,
                        majorCategory: selection.majorCategory,
                        category: selection.category,
                      })
                    }}
                    token={token}
                    language={language}
                  />
                  <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    {language === 'en'
                      ? 'Where does this expense belong?'
                      : 'Onde se encaixa esta despesa?'}
                  </p>
                </div>

                {/* Tags Section - Metadata */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                  <TagsLabel language={language} className="mb-2" />
                  <TagSelector
                    selectedTags={editForm.tags || transaction.tags || []}
                    onChange={tags => onUpdateEditForm({ tags })}
                    token={token}
                    language={language}
                    disabled={isSaving}
                  />
                  <p className="mt-1.5 text-[10px] text-indigo-500 dark:text-indigo-400">
                    {language === 'en'
                      ? 'Add details: vehicle, trip, provider...'
                      : 'Detalhes: veículo, viagem, fornecedor...'}
                  </p>
                </div>
              </div>

              {/* Row 3: Description & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={editForm.rawDescription || ''}
                    onChange={e => onUpdateEditForm({ rawDescription: e.target.value })}
                    disabled={isSaving}
                    placeholder="Transaction description"
                    className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={editForm.notes || ''}
                    onChange={e => onUpdateEditForm({ notes: e.target.value })}
                    disabled={isSaving}
                    placeholder="Optional notes"
                    className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Row 4: Amount */}
              <div className="w-full md:w-1/3">
                <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-1.5">
                  Amount (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.rawAmount !== undefined ? editForm.rawAmount : ''}
                  onChange={e => {
                    const value = e.target.value
                    // Allow empty, minus sign, and valid numbers
                    if (value === '' || value === '-') {
                      onUpdateEditForm({ rawAmount: value as any })
                    } else {
                      const parsed = parseFloat(value)
                      onUpdateEditForm({
                        rawAmount: isNaN(parsed) ? 0 : parsed,
                      })
                    }
                  }}
                  disabled={isSaving}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                <button
                  onClick={onSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-950 dark:text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </>
      ) : (
        <>
          {/* Display Mode */}
          {/* Column 1: Checkbox */}
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              onClick={e => onToggleSelection(e as any)}
              className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </td>

          {/* Column 2: Date */}
          <td className="px-4 py-3 whitespace-nowrap">
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              {formatDate(transaction.rawDate)}
            </span>
          </td>

          {/* Column 3: Origin */}
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex justify-center items-center">
              <OriginAvatar origin={transaction.origin} size="sm" />
            </div>
          </td>

          {/* Column 4: Bank */}
          <td className="px-4 py-3 whitespace-nowrap">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              {transaction.bank || 'N/A'}
            </span>
          </td>

          {/* Column 5: Status */}
          <td className="px-4 py-3 whitespace-nowrap">
            <span
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-base font-semibold ${
                transaction.status === 'categorized'
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}
              title={
                transaction.status === 'categorized' ? 'Categorized' : 'Pending categorization'
              }
            >
              <span>{transaction.status === 'categorized' ? '✓' : '⏳'}</span>
            </span>
          </td>

          {/* Column 6: Category */}
          <td className="px-4 py-3">
            <div className="flex flex-col gap-1.5 min-w-[140px] max-w-[180px]">
              {transaction.majorCategoryRef?.name || transaction.majorCategory ? (
                <>
                  <CategoryBadgeCompact
                    majorCategory={
                      transaction.majorCategoryRef?.name || transaction.majorCategory || ''
                    }
                    category={transaction.categoryRef?.name || transaction.category || undefined}
                    majorEmoji={transaction.majorCategoryRef?.emoji}
                    language={language}
                  />
                  {transaction.classifierConfidence && (
                    <ConfidenceBadge
                      confidence={transaction.classifierConfidence}
                      reasoning={transaction.classifierReasoning}
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400 dark:text-slate-500 italic">
                    {language === 'en' ? 'Not categorized' : 'Sem categoria'}
                  </span>
                  {transaction.status === 'pending' && (
                    <AIClassifier
                      transactionId={transaction.id}
                      token={token}
                      onClassified={() => onRefreshTransaction(transaction.id)}
                    />
                  )}
                </div>
              )}
            </div>
          </td>

          {/* Column 7: Tags */}
          <td className="px-4 py-3">
            <div className="min-w-[80px] max-w-[120px]">
              <TagBadges tags={transaction.tags || []} language={language} maxDisplay={3} />
            </div>
          </td>

          {/* Column 8: Description + Notes */}
          <td className="px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <div
                className="text-sm font-medium text-indigo-950 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors"
                title={transaction.rawDescription}
              >
                {formatTransactionDescription(transaction.rawDescription)}
              </div>
              {transaction.notes && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 italic">
                  {transaction.notes}
                </div>
              )}
            </div>
          </td>

          {/* Column 9: Amount */}
          <td className="px-4 py-3 whitespace-nowrap text-center">
            <span
              className={`font-semibold text-sm tabular-nums ${
                isIncome
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {formatCurrency(
                Math.abs(transaction.rawAmount),
                Math.abs(transaction.rawAmount) % 1 === 0 ? 0 : 2
              )}
            </span>
          </td>
        </>
      )}

      {/* Column 10: Actions */}
      <td className="px-4 py-3 whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center gap-0">
            <button
              onClick={onSaveEdit}
              disabled={isSaving}
              className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSaving ? 'Saving...' : 'Save'}
            >
              {isSaving ? (
                <div className="animate-spin h-3.5 w-3.5 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full" />
              ) : (
                <Save size={14} />
              )}
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-0">
            <button
              onClick={onToggleFlag}
              className={`p-1 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${
                transaction.flagged
                  ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                  : 'text-gray-400 hover:text-amber-600 dark:text-slate-500 dark:hover:text-amber-400'
              }`}
              title={transaction.flagged ? 'Unflag' : 'Flag for review'}
            >
              <Flag size={14} fill={transaction.flagged ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onStartEdit}
              className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              title="Edit"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={onDuplicate}
              className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={onAddAsRule}
              className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
              title="Add as Rule"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-600 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
