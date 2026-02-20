/**
 * TransactionCard Component
 *
 * Mobile-optimized card view for displaying transactions.
 * Designed for touch interactions with large tap targets (WCAG 2.1 AA: 44x44px minimum).
 *
 * Features:
 * - Vertical stack layout optimized for mobile
 * - Large touch targets for all interactive elements
 * - Swipeable actions (delete, edit)
 * - Clear visual hierarchy
 * - Responsive spacing and typography
 */

'use client'

import { useState } from 'react'
import { Trash2, Edit2, Copy, Calendar, Building2, User, FileText } from 'lucide-react'
import { formatCurrency, formatDate, formatTransactionDescription } from '@/lib/format'

interface Transaction {
  id: string | number
  description: string
  amount: number
  date: string | Date
  origin: string
  bank?: string | null
  category?: string | null
  majorCategory?: string | null
  notes?: string | null
  status?: string
}

interface TransactionCardProps {
  transaction: Transaction
  isSelected?: boolean
  onSelect?: (id: string | number, e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete?: (id: string | number) => void | Promise<void>
  onEdit?: (id: string | number) => void
  onDuplicate?: (transaction: Transaction) => void | Promise<void>
  language?: 'en' | 'pt'
}

export function TransactionCard({
  transaction,
  isSelected = false,
  onSelect,
  onDelete,
  onEdit,
  onDuplicate,
  language = 'en',
}: TransactionCardProps) {
  const [showActions, setShowActions] = useState(false)

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect?.(transaction.id, e)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(transaction.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(transaction.id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDuplicate?.(transaction)
  }

  // Format date consistently
  const formattedDate =
    typeof transaction.date === 'string'
      ? formatDate(new Date(transaction.date))
      : formatDate(transaction.date)

  const isExpense = transaction.amount < 0
  const isPending = transaction.status === 'pending' || !transaction.category

  return (
    <div
      className={`
        relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2
        transition-all duration-200
        ${isSelected ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' : 'border-gray-200 dark:border-slate-700'}
        ${showActions ? 'scale-[0.98]' : 'hover:shadow-md'}
      `}
      onClick={() => setShowActions(!showActions)}
    >
      {/* Selection Checkbox - Large touch target */}
      {onSelect && (
        <div className="absolute top-4 left-4 z-10">
          <label className="flex items-center justify-center w-11 h-11 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="w-6 h-6 rounded-md cursor-pointer accent-indigo-600"
              onClick={e => e.stopPropagation()}
            />
          </label>
        </div>
      )}

      <div className="p-4 pl-16">
        {/* Header: Amount + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div
              className={`text-2xl font-bold tabular-nums ${
                isExpense
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isExpense ? '-' : '+'}
              {formatCurrency(Math.abs(transaction.amount))}
            </div>
          </div>

          {/* Status Badge */}
          {isPending && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
              {language === 'pt' ? 'Pendente' : 'Pending'}
            </span>
          )}
        </div>

        {/* Description */}
        <div className="mb-3">
          <p
            className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2"
            title={transaction.description}
          >
            {formatTransactionDescription(transaction.description)}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="space-y-2 text-sm">
          {/* Date */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar size={16} className="flex-shrink-0" />
            <span className="font-medium">{formattedDate}</span>
          </div>

          {/* Origin */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <User size={16} className="flex-shrink-0" />
            <span className="font-medium">{transaction.origin}</span>
          </div>

          {/* Bank */}
          {transaction.bank && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Building2 size={16} className="flex-shrink-0" />
              <span className="font-medium">{transaction.bank}</span>
            </div>
          )}

          {/* Category */}
          {transaction.category && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FileText size={16} className="flex-shrink-0" />
              <span className="font-medium">
                {transaction.majorCategory && `${transaction.majorCategory} → `}
                {transaction.category}
              </span>
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Actions - Shown when card is tapped */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center gap-3">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors min-h-[48px]"
                type="button"
                aria-label="Editar transação"
              >
                <Edit2 size={18} />
                <span>{language === 'pt' ? 'Editar' : 'Edit'}</span>
              </button>
            )}

            {onDuplicate && (
              <button
                onClick={handleDuplicate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors min-h-[48px]"
                type="button"
                aria-label="Duplicar transação"
              >
                <Copy size={18} />
                <span>{language === 'pt' ? 'Duplicar' : 'Duplicate'}</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors min-h-[48px]"
                type="button"
                aria-label="Eliminar transação"
              >
                <Trash2 size={18} />
                <span>{language === 'pt' ? 'Eliminar' : 'Delete'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Skeleton loader for TransactionCard
 * Used while transactions are loading
 */
export function TransactionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-gray-200 dark:border-slate-700 p-4 pl-16 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
        <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
      </div>

      <div className="h-5 w-full bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
      <div className="h-5 w-2/3 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>

      <div className="space-y-2">
        <div className="h-4 w-40 bg-gray-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-36 bg-gray-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-44 bg-gray-200 dark:bg-slate-700 rounded"></div>
      </div>
    </div>
  )
}
