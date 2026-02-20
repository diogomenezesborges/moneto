/**
 * ReviewFeature Component
 *
 * Review and approve imported transactions before they appear in the main list.
 * Uses the exact same table UI as TransactionsFeature for consistency.
 * Issue #230: Batch actions, progress bar, group by bank
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { ReviewTableSkeleton } from '@/app/features/shared/components/Skeleton'
import {
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Check,
  X,
  Filter,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Edit,
  Copy,
  Save,
  Zap,
  Layers,
  Trophy,
} from 'lucide-react'
import {
  type Transaction,
  useReviewTransactions,
  useReviewAction,
  useUpdateTransaction,
  useCreateTransaction,
} from '@/lib/queries/transactions'
import { Select } from '@/components/ui/Select'
import { DateInput } from '@/components/ui/DateInput'
import { OriginAvatar } from '@/components/ui/OriginAvatar'
import { CategoryBadgeCompact } from '@/components/ui/CategoryBadge'
import { TagBadges, TagsLabel } from '@/components/ui/TagDisplay'
import { CategorySelector } from '@/components/ui/CategorySelector'
import { TagSelector } from '@/components/ui/TagSelector'
import { BankSelector } from '@/components/ui/BankSelector'
import { formatCurrency, formatDate } from '@/lib/format'
import type { EditForm } from '../../shared/types'

interface ReviewFeatureProps {
  token: string
  isAuthenticated: boolean
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function ReviewFeature({ token, isAuthenticated, onSuccess, onError }: ReviewFeatureProps) {
  // TanStack Query hooks
  const {
    data: reviewData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useReviewTransactions()
  const transactions = reviewData?.transactions ?? []
  const progress = reviewData?.progress
  const reviewActionMutation = useReviewAction()
  const updateTransactionMutation = useUpdateTransaction()
  const createTransactionMutation = useCreateTransaction()

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOrigin, setFilterOrigin] = useState('all')
  const [filterBank, setFilterBank] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null)
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null)
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // View state — Issue #230
  const [groupByBank, setGroupByBank] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Show error from query
  if (queryError && !loading) {
    onError?.('Failed to load pending transactions')
  }

  // Get unique values for filters
  const uniqueOrigins = Array.from(new Set((transactions || []).map(t => t.origin)))
  const uniqueBanks = Array.from(
    new Set((transactions || []).map(t => t.bank).filter((b): b is string => b !== null))
  )

  // Filter and sort transactions
  const filteredTransactions = (transactions || []).filter(t => {
    if (searchTerm && !t.rawDescription.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (filterOrigin !== 'all' && t.origin !== filterOrigin) return false
    if (filterBank !== 'all' && t.bank !== filterBank) return false
    if (filterDateFrom) {
      const txDate = new Date(t.rawDate)
      if (txDate < filterDateFrom) return false
    }
    if (filterDateTo) {
      const txDate = new Date(t.rawDate)
      if (txDate > filterDateTo) return false
    }
    return true
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aVal: any, bVal: any
    switch (sortField) {
      case 'date':
        aVal = new Date(a.rawDate).getTime()
        bVal = new Date(b.rawDate).getTime()
        break
      case 'amount':
        aVal = Math.abs(a.rawAmount)
        bVal = Math.abs(b.rawAmount)
        break
      case 'description':
        aVal = a.rawDescription.toLowerCase()
        bVal = b.rawDescription.toLowerCase()
        break
      default:
        return 0
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm !== '' ||
    filterOrigin !== 'all' ||
    filterBank !== 'all' ||
    filterDateFrom !== null ||
    filterDateTo !== null

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('')
    setFilterOrigin('all')
    setFilterBank('all')
    setFilterDateFrom(null)
    setFilterDateTo(null)
  }

  // Issue #230: High-confidence = AI has categorized the transaction
  const categorizedIds = useMemo(
    () => transactions.filter(t => t.status === 'categorized').map(t => t.id),
    [transactions]
  )

  // Issue #230: Groups for bank view
  const bankGroups = useMemo(() => {
    const groups = new Map<string, typeof sortedTransactions>()
    for (const t of sortedTransactions) {
      const key = t.bank || 'Other'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [sortedTransactions])

  const toggleGroup = (bank: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(bank)) next.delete(bank)
      else next.add(bank)
      return next
    })
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedIds.length === sortedTransactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(sortedTransactions.map(t => t.id))
    }
  }

  // Handle approve/reject action
  const handleAction = async (action: 'approve' | 'reject', ids?: string[]) => {
    const targetIds = ids || selectedIds
    if (targetIds.length === 0) return
    try {
      const result = await reviewActionMutation.mutateAsync({ action, transactionIds: targetIds })
      onSuccess?.(result.message || `Transactions ${action}ed successfully`)
      setSelectedIds([])
    } catch (err) {
      onError?.(err instanceof Error ? err.message : `Failed to ${action} transactions`)
    }
  }

  // Issue #230: Approve all AI-categorized transactions
  const handleApproveAllCategorized = async () => {
    if (categorizedIds.length === 0) return
    try {
      const result = await reviewActionMutation.mutateAsync({
        action: 'approve',
        transactionIds: categorizedIds,
      })
      onSuccess?.(result.message || `Approved ${categorizedIds.length} categorized transactions`)
      setSelectedIds([])
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to approve categorized transactions')
    }
  }

  const isAllSelected =
    selectedIds.length === sortedTransactions.length && sortedTransactions.length > 0

  // Start editing a transaction
  const startEditing = useCallback((transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditForm({
      rawDate: new Date(transaction.rawDate),
      rawDescription: transaction.rawDescription,
      rawAmount: transaction.rawAmount,
      origin: transaction.origin,
      bank: transaction.bank || undefined,
      majorCategory: transaction.majorCategory,
      category: transaction.category,
      tags: transaction.tags || [],
      status: transaction.status,
      flagged: transaction.isFlagged,
    })
    setValidationErrors([])
  }, [])

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditForm({})
    setValidationErrors([])
  }, [])

  // Update edit form
  const updateEditForm = useCallback((updates: Partial<EditForm>) => {
    setEditForm(prev => ({ ...prev, ...updates }))
  }, [])

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingId) return
    const errors: string[] = []
    if (!editForm.rawDate) errors.push('Date is required')
    if (!editForm.rawDescription?.trim()) errors.push('Description is required')
    if (editForm.rawAmount === undefined || editForm.rawAmount === null) {
      errors.push('Valid amount is required')
    }
    if (!editForm.origin) errors.push('Origin is required')
    if (!editForm.bank) errors.push('Bank is required')
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])
    try {
      await updateTransactionMutation.mutateAsync({
        id: editingId,
        rawDate:
          editForm.rawDate instanceof Date
            ? editForm.rawDate.toISOString()
            : editForm.rawDate || undefined,
        rawDescription: editForm.rawDescription,
        rawAmount:
          typeof editForm.rawAmount === 'string'
            ? parseFloat(editForm.rawAmount)
            : editForm.rawAmount,
        majorCategoryId: editForm.majorCategoryId || undefined,
        categoryId: editForm.categoryId || undefined,
        tags: editForm.tags || [],
      })
      onSuccess?.('Transaction updated successfully')
      cancelEdit()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to update transaction')
    }
  }

  // Handle duplicate
  const handleDuplicate = async (transaction: any) => {
    try {
      const duplicate = {
        rawDate: new Date(transaction.rawDate).toISOString(),
        rawDescription: transaction.rawDescription,
        rawAmount: transaction.rawAmount,
        origin: transaction.origin,
        bank: transaction.bank,
        tags: transaction.tags || [],
      }
      await createTransactionMutation.mutateAsync(duplicate)
      onSuccess?.('Transaction duplicated')
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to duplicate transaction')
    }
  }

  // Issue #230: Render a single transaction row (shared between flat and grouped views)
  const renderTransactionRow = (
    transaction: Transaction,
    isIncome: boolean,
    isSelected: boolean,
    txDate: Date,
    isEditing: boolean
  ) => (
    <tr
      key={transaction.id}
      className={`group transition-all duration-200 ${
        isSelected ? 'bg-indigo-100/50 dark:bg-indigo-500/10' : ''
      } ${
        transaction.duplicateOf
          ? 'bg-amber-50/50 dark:bg-amber-500/5 border-l-4 border-l-amber-500'
          : isIncome
            ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 border-l-4 border-l-transparent hover:border-l-emerald-500'
            : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 border-l-4 border-l-transparent hover:border-l-indigo-500'
      }`}
    >
      {isEditing ? (
        /* Edit Mode */
        <td className="px-4 py-3 relative z-50" colSpan={11}>
          <div className="flex flex-col gap-3 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700 relative z-50">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400r mb-1.5">
                  Date *
                </label>
                <DateInput
                  value={editForm.rawDate || null}
                  onChange={date => updateEditForm({ rawDate: date ?? undefined })}
                  disabled={updateTransactionMutation.isPending}
                  required
                  placeholder="DD/MM/YYYY"
                  className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400r mb-1.5">
                  Origin *
                </label>
                <div className="relative">
                  <select
                    value={editForm.origin || ''}
                    onChange={e => updateEditForm({ origin: e.target.value })}
                    disabled={updateTransactionMutation.isPending}
                    className="w-full pl-3 pr-9 py-2.5 text-sm font-medium border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-700 dark:to-slate-700/50 text-indigo-950 dark:text-white shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-400 dark:focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer [&>option]:bg-white dark:[&>option]:bg-slate-800 [&>option]:text-gray-900 dark:[&>option]:text-white"
                  >
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400r mb-1.5">
                  Bank *
                </label>
                <BankSelector
                  value={editForm.bank || ''}
                  onChange={bankName => updateEditForm({ bank: bankName })}
                  token={token}
                  disabled={updateTransactionMutation.isPending}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300r mb-2">
                  <span className="text-base">📁</span>Category
                </label>
                <CategorySelector
                  majorCategoryId={editForm.majorCategoryId}
                  categoryId={editForm.categoryId}
                  onChange={selection => {
                    updateEditForm({
                      majorCategoryId: selection.majorCategoryId,
                      categoryId: selection.categoryId,
                      majorCategory: selection.majorCategory,
                      category: selection.category,
                    })
                  }}
                  token={token}
                  language="pt"
                />
                <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  Where does this expense belong?
                </p>
              </div>
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                <TagsLabel language="pt" className="mb-2" />
                <TagSelector
                  selectedTags={editForm.tags || []}
                  onChange={tags => updateEditForm({ tags })}
                  token={token}
                  language="pt"
                  disabled={updateTransactionMutation.isPending}
                />
                <p className="mt-1.5 text-[10px] text-indigo-500 dark:text-indigo-400">
                  Add details: vehicle, trip, provider...
                </p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400r mb-1.5">
                Description *
              </label>
              <input
                type="text"
                value={editForm.rawDescription || ''}
                onChange={e => updateEditForm({ rawDescription: e.target.value })}
                disabled={updateTransactionMutation.isPending}
                placeholder="Transaction description"
                className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-400r mb-1.5">
                Amount (€) *
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.rawAmount !== undefined ? editForm.rawAmount : ''}
                onChange={e => {
                  const value = e.target.value
                  if (value === '' || value === '-') {
                    updateEditForm({ rawAmount: value as any })
                  } else {
                    const parsed = parseFloat(value)
                    updateEditForm({ rawAmount: isNaN(parsed) ? 0 : parsed })
                  }
                }}
                disabled={updateTransactionMutation.isPending}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-slate-700 text-indigo-950 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-indigo-200 dark:border-indigo-700">
              <button
                onClick={handleSaveEdit}
                disabled={updateTransactionMutation.isPending}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {updateTransactionMutation.isPending ? (
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
                onClick={cancelEdit}
                disabled={updateTransactionMutation.isPending}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-950 dark:text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </td>
      ) : (
        /* Display Mode */
        <>
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(transaction.id)}
              className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              {formatDate(txDate)}
            </span>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex justify-center items-center">
              <OriginAvatar origin={transaction.origin} size="sm" />
            </div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              {transaction.bank || 'N/A'}
            </span>
          </td>
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
          <td className="px-4 py-3">
            <div className="flex flex-col gap-1.5 min-w-[140px] max-w-[180px]">
              {transaction.majorCategoryRef?.name || transaction.majorCategory ? (
                <CategoryBadgeCompact
                  majorCategory={
                    transaction.majorCategoryRef?.name || transaction.majorCategory || ''
                  }
                  category={transaction.categoryRef?.name || transaction.category || undefined}
                  majorEmoji={transaction.majorCategoryRef?.emoji}
                  language="pt"
                />
              ) : (
                <span className="text-xs font-medium text-gray-400 dark:text-slate-500 italic">
                  Not categorized
                </span>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="min-w-[80px] max-w-[120px]">
              <TagBadges tags={transaction.tags || []} language="pt" maxDisplay={3} />
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm font-medium text-indigo-950 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              {transaction.rawDescription}
            </div>
          </td>
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
          <td className="px-4 py-3">
            {transaction.duplicateOf ? (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={14} />
                <span className="text-xs font-medium">Duplicate?</span>
              </div>
            ) : (
              <span className="text-xs text-indigo-500 dark:text-indigo-400">New import</span>
            )}
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex items-center gap-0">
              <button
                onClick={() => startEditing(transaction)}
                disabled={updateTransactionMutation.isPending}
                className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDuplicate(transaction)}
                disabled={createTransactionMutation.isPending}
                className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Duplicate"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={() => handleAction('approve', [transaction.id])}
                disabled={reviewActionMutation.isPending}
                className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Approve"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => handleAction('reject', [transaction.id])}
                disabled={reviewActionMutation.isPending}
                className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Reject"
              >
                <X size={16} />
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* Progress Bar — Issue #230 */}
      {!loading && progress && (
        <div
          data-testid="review-progress"
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-white/60 dark:border-white/20 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {progress.percentComplete === 100 ? (
                <Trophy size={16} className="text-amber-500" />
              ) : (
                <Eye size={16} className="text-indigo-600 dark:text-indigo-400" />
              )}
              <span className="text-sm font-semibold text-indigo-950 dark:text-white">
                {progress.percentComplete === 100
                  ? 'All caught up! Queue complete'
                  : `${progress.pending} pending · ${progress.reviewed} of ${progress.total} reviewed`}
              </span>
            </div>
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
              {progress.percentComplete}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                progress.percentComplete === 100
                  ? 'bg-amber-500'
                  : progress.percentComplete >= 75
                    ? 'bg-emerald-500'
                    : progress.percentComplete >= 50
                      ? 'bg-teal-500'
                      : 'bg-indigo-500'
              }`}
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          {categorizedIds.length > 0 && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
              <Zap size={11} className="inline mr-1" />
              {categorizedIds.length} AI-categorized transactions ready for quick approval
            </p>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-3xl shadow-lg p-6 border border-white/60 dark:border-white/20 relative z-10">
        {/* Header with Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-950 dark:text-white">
              Review Transactions
            </h3>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Issue #230: Approve All Categorized */}
            <button
              onClick={handleApproveAllCategorized}
              disabled={reviewActionMutation.isPending || categorizedIds.length === 0}
              data-testid="approve-all-categorized"
              className="group relative bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-2 rounded-xl hover:shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Approve all ${categorizedIds.length} AI-categorized transactions`}
            >
              <Zap size={16} />
              <span>Approve Categorized ({categorizedIds.length})</span>
            </button>

            {/* Issue #230: Group by Bank toggle */}
            <button
              onClick={() => setGroupByBank(g => !g)}
              data-testid="group-by-bank"
              className={`group relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold border-2 ${
                groupByBank
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-700 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <Layers size={16} />
              <span>Group by Bank</span>
            </button>

            <button
              onClick={() => refetch()}
              disabled={loading}
              className="group relative bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl hover:shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => handleAction('approve')}
              disabled={reviewActionMutation.isPending || selectedIds.length === 0}
              className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl hover:shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} />
              <span>Approve ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => handleAction('reject')}
              disabled={reviewActionMutation.isPending || selectedIds.length === 0}
              className="group relative bg-gradient-to-r from-rose-600 to-red-600 text-white px-4 py-2 rounded-xl hover:shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={16} />
              <span>Reject ({selectedIds.length})</span>
            </button>

            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 px-4 py-2 rounded-xl border border-amber-500/20 dark:border-amber-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {(transactions || []).length} Pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-400 dark:text-indigo-500 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400" />
            <input
              type="text"
              placeholder="Search transactions by description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gradient-to-r from-white to-indigo-50/30 dark:from-slate-800 dark:to-slate-800 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md focus:shadow-xl transition-all text-indigo-950 dark:text-white font-medium placeholder:text-indigo-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 text-base"
            />
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-gradient-to-br from-white to-indigo-50/20 dark:from-slate-800/50 dark:to-slate-800/30 border-2 border-indigo-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-300r">
                Filters & Sort
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
              >
                {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Essential Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              value={sortField}
              onChange={val => setSortField(val as any)}
              options={[
                { value: 'date', label: '📅 Sort by Date' },
                { value: 'amount', label: '💰 Sort by Amount' },
                { value: 'description', label: '📝 Sort by Description' },
              ]}
              placeholder="Sort by"
            />
            <Select
              value={sortDirection}
              onChange={val => setSortDirection(val as any)}
              options={[
                { value: 'desc', label: '⬇️ Descending' },
                { value: 'asc', label: '⬆️ Ascending' },
              ]}
              placeholder="Order"
            />
            <DateInput
              value={filterDateFrom}
              onChange={setFilterDateFrom}
              placeholder="From (DD/MM/YYYY)"
              className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-white/80 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md focus:shadow-lg transition-all text-indigo-950 dark:text-white font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
            />
            <DateInput
              value={filterDateTo}
              onChange={setFilterDateTo}
              placeholder="To (DD/MM/YYYY)"
              className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border-2 border-white/80 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md focus:shadow-lg transition-all text-indigo-950 dark:text-white font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
            />
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  value={filterOrigin}
                  onChange={val => setFilterOrigin(val)}
                  options={[
                    { value: 'all', label: '👥 All Origins' },
                    ...uniqueOrigins.map(o => ({ value: o, label: o })),
                  ]}
                  placeholder="Origin"
                />
                <Select
                  value={filterBank}
                  onChange={val => setFilterBank(val)}
                  options={[
                    { value: 'all', label: '🏦 All Banks' },
                    ...uniqueBanks.map(b => ({ value: b, label: b })),
                  ]}
                  placeholder="Bank"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-800/70 dark:to-slate-800/50 backdrop-blur-md rounded-3xl shadow-lg overflow-visible border border-white/60 dark:border-white/20">
        {loading ? (
          <ReviewTableSkeleton />
        ) : sortedTransactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
              {hasActiveFilters ? 'No matching transactions' : 'All caught up!'}
            </h3>
            <p className="text-indigo-700/60 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more transactions.'
                : 'No transactions pending review at the moment.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/50 dark:border-white/10">
            <table className="min-w-full divide-y divide-white/50 dark:divide-white/10">
              <thead className="bg-white/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-28">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-indigo-900 dark:text-slate-300r w-20">
                    Origin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-16">
                    Bank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-20">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-44">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-32">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-28">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-24">
                    Issue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-900 dark:text-slate-300r w-24">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white/50 dark:bg-transparent divide-y divide-indigo-50 dark:divide-white/5">
                {groupByBank
                  ? bankGroups.flatMap(([bank, groupTxs]) => {
                      const isCollapsed = collapsedGroups.has(bank)
                      const groupCategorized = groupTxs.filter(
                        t => t.status === 'categorized'
                      ).length
                      const groupIds = groupTxs.map(t => t.id)
                      return [
                        <tr
                          key={`group-${bank}`}
                          data-testid={`bank-group-${bank}`}
                          className="bg-indigo-50/80 dark:bg-indigo-900/20 border-y border-indigo-200 dark:border-indigo-700"
                        >
                          <td colSpan={11} className="px-4 py-2">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleGroup(bank)}
                                className="flex items-center gap-2 text-sm font-bold text-indigo-900 dark:text-indigo-100 hover:text-indigo-700"
                              >
                                {isCollapsed ? (
                                  <ChevronRight size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                                <span>{bank}</span>
                                <span className="px-2 py-0.5 bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 rounded-full text-xs">
                                  {groupTxs.length}
                                </span>
                                {groupCategorized > 0 && (
                                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs flex items-center gap-1">
                                    <Zap size={10} />
                                    {groupCategorized} categorized
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => handleAction('approve', groupIds)}
                                disabled={reviewActionMutation.isPending}
                                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 disabled:opacity-50 px-3 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              >
                                Approve all {groupTxs.length}
                              </button>
                            </div>
                          </td>
                        </tr>,
                        ...(isCollapsed
                          ? []
                          : groupTxs.map(transaction =>
                              renderTransactionRow(
                                transaction,
                                transaction.rawAmount > 0,
                                selectedIds.includes(transaction.id),
                                new Date(transaction.rawDate),
                                editingId === transaction.id
                              )
                            )),
                      ]
                    })
                  : sortedTransactions.map(transaction =>
                      renderTransactionRow(
                        transaction,
                        transaction.rawAmount > 0,
                        selectedIds.includes(transaction.id),
                        new Date(transaction.rawDate),
                        editingId === transaction.id
                      )
                    )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
