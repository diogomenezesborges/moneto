'use client'

import { TransactionRow } from './TransactionRow'
import type { TransactionWithUser, EditForm } from '../../shared/types'

interface TransactionTableProps {
  transactions: TransactionWithUser[]
  editingId: string | null
  editForm: EditForm
  savingEdit: boolean
  validationErrors: string[]
  selectedIds: string[]
  isAllSelected: boolean
  language: 'pt' | 'en'
  token: string
  onStartEdit: (transaction: TransactionWithUser) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggleSelection: (
    id: string,
    event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>
  ) => void
  onToggleAllSelection: () => void
  onToggleFlag: (id: string) => void
  onDuplicate: (transaction: TransactionWithUser) => void
  onAddAsRule: (transaction: TransactionWithUser) => void
  onDelete: (id: string) => void
  onUpdateEditForm: (updates: Partial<EditForm>) => void
  onRefreshTransaction: (id: string) => void
}

export function TransactionTable({
  transactions,
  editingId,
  editForm,
  savingEdit,
  validationErrors,
  selectedIds,
  isAllSelected,
  language,
  token,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleSelection,
  onToggleAllSelection,
  onToggleFlag,
  onDuplicate,
  onAddAsRule,
  onDelete,
  onUpdateEditForm,
  onRefreshTransaction,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-full mb-6">
          <span className="text-4xl">📊</span>
        </div>
        <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
          {language === 'en' ? 'No transactions found' : 'Nenhuma transação encontrada'}
        </h3>
        <p className="text-indigo-700/60 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {language === 'en'
            ? 'Try adjusting your filters or import new transactions.'
            : 'Tente ajustar os filtros ou importar novas transações.'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/50 dark:border-white/10">
      <table className="min-w-full divide-y divide-white/50 dark:divide-white/10">
        <thead className="bg-white/50 dark:bg-slate-800/50">
          <tr>
            {/* Checkbox Column */}
            <th className="px-4 py-3 w-12">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleAllSelection}
                className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </th>

            {/* Date Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 w-28">
              {language === 'en' ? 'Date' : 'Data'}
            </th>

            {/* Origin Column */}
            <th className="px-4 py-3 text-center text-xs font-medium text-indigo-900 dark:text-slate-300 w-20">
              {language === 'en' ? 'Origin' : 'Origem'}
            </th>

            {/* Bank Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 w-16">
              {language === 'en' ? 'Bank' : 'Banco'}
            </th>

            {/* Status Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 w-20">
              {language === 'en' ? 'Status' : 'Estado'}
            </th>

            {/* Category Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 w-44">
              {language === 'en' ? 'Category' : 'Categoria'}
            </th>

            {/* Tags Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 w-32">
              Tags
            </th>

            {/* Description Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300">
              {language === 'en' ? 'Description' : 'Descrição'}
            </th>

            {/* Amount Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 w-28">
              {language === 'en' ? 'Amount' : 'Montante'}
            </th>

            {/* Actions Column */}
            <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300 w-32">
              {language === 'en' ? 'Actions' : 'Ações'}
            </th>
          </tr>
        </thead>

        <tbody className="bg-white/50 dark:bg-transparent divide-y divide-indigo-50 dark:divide-white/5">
          {transactions.map(transaction => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              isEditing={editingId === transaction.id}
              isSaving={savingEdit}
              isSelected={selectedIds.includes(transaction.id)}
              editForm={editForm}
              validationErrors={validationErrors}
              language={language}
              token={token}
              onStartEdit={() => onStartEdit(transaction)}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onToggleSelection={event => onToggleSelection(transaction.id, event)}
              onToggleFlag={() => onToggleFlag(transaction.id)}
              onDuplicate={() => onDuplicate(transaction)}
              onAddAsRule={() => onAddAsRule(transaction)}
              onDelete={() => onDelete(transaction.id)}
              onUpdateEditForm={onUpdateEditForm}
              onRefreshTransaction={onRefreshTransaction}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
