/**
 * TransactionsFeature Component
 *
 * Main transactions feature component using modular hooks.
 * This is a simplified proof-of-concept demonstrating the new architecture.
 *
 * Mobile Optimizations (Issue #13):
 * - Responsive card view for mobile (<768px)
 * - Mobile filter sheet (bottom drawer)
 * - Large touch targets (WCAG 2.1 AA: 44x44px minimum)
 * - Floating action button for primary action
 */

'use client'

import { useState, useMemo } from 'react'
import { TransactionTableSkeleton } from '@/app/features/shared/components/Skeleton'

/**
 * Safely get CSRF token from localStorage
 * Returns null if token is missing or empty (security hardening)
 */
function getValidCsrfToken(): string | null {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('csrf-token')
  // Reject null, undefined, or empty strings
  if (!token || token.trim() === '') {
    return null
  }
  return token
}
import { Upload, Plus, Trash2 } from 'lucide-react'
import {
  useTransactionFilters,
  useTransactionSelection,
  useTransactionEdit,
  useBulkOperations,
} from '../hooks'
import { useCategories, useUndoAction } from '@/app/features/shared/hooks'
import { UndoToast } from '@/app/features/shared/components/UndoToast'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useBulkDeleteTransactions,
  useImportTransactions,
} from '@/lib/queries/transactions'
import { exportToCSV } from '@/lib/parsers'
import { TransactionCard } from './TransactionCard'
import { MobileFilterSheet } from './MobileFilterSheet'
import { TransactionFilters } from './TransactionFilters'
import { TransactionTable } from './TransactionTable'
import { TransactionEditDialog } from './TransactionEditDialog'
import { TransactionAddDialog } from './TransactionAddDialog'
import { BulkEditDialog } from './BulkEditDialog'
import { ImportDialog } from './ImportDialog'
import { ExportDialog } from './ExportDialog'

interface TransactionsFeatureProps {
  token: string
  isAuthenticated: boolean
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
}

export function TransactionsFeature({
  token,
  isAuthenticated,
  onSuccess,
  onError,
}: TransactionsFeatureProps) {
  // Mobile-specific state
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Dialog state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [addForm, setAddForm] = useState<any>({})
  const [addValidationErrors, setAddValidationErrors] = useState<string[]>([])
  const [savingAdd, setSavingAdd] = useState(false)

  // Language state
  const [language, setLanguage] = useState<'pt' | 'en'>('pt')

  // Undo action for delete operations
  const undoAction = useUndoAction()
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  // TanStack Query hooks
  const { data: transactions, isLoading: loading, error: queryError } = useTransactions({})
  const createTransactionMutation = useCreateTransaction()
  const updateTransactionMutation = useUpdateTransaction()
  const deleteTransactionMutation = useDeleteTransaction()
  const bulkDeleteMutation = useBulkDeleteTransactions()
  const importTransactionsMutation = useImportTransactions()

  // Convert query error to string
  const error = queryError?.message || null

  // Filter out hidden (pending delete) transactions for optimistic UI
  const visibleTransactions = useMemo(
    () => (transactions || []).filter(t => !hiddenIds.has(String(t.id))),
    [transactions, hiddenIds]
  )

  const {
    taxonomy,
    majorCategories,
    allCategories,
    loading: categoriesLoading,
    error: categoriesError,
    getCategoriesForMajor,
  } = useCategories({ token, isAuthenticated })

  const {
    filterStatus,
    setFilterStatus,
    filterMajorCategory,
    setFilterMajorCategory,
    filterCategory,
    setFilterCategory,
    filterOrigin,
    setFilterOrigin,
    filterBank,
    setFilterBank,
    filterFlagged,
    setFilterFlagged,
    filterTags,
    setFilterTags,
    searchTerm,
    setSearchTerm,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    showAdvancedFilters,
    setShowAdvancedFilters,
    itemsPerPage,
    setItemsPerPage,
    hasActiveFilters,
    paginatedTransactions,
    clearAllFilters,
    uniqueOrigins,
    uniqueBanks,
    uniqueMajorCategories,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useTransactionFilters({ transactions: visibleTransactions as any })

  const {
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    isSelected,
    isAllSelected,
  } = useTransactionSelection()

  const {
    editingId,
    editForm,
    savingEdit,
    validationErrors,
    startEditing,
    cancelEdit,
    saveEdit,
    updateEditForm,
  } = useTransactionEdit()

  const {
    showBulkEditDialog,
    bulkEditForm,
    bulkOperationInProgress,
    openBulkEditDialog,
    closeBulkEditDialog,
    updateBulkEditForm,
    bulkUpdate,
  } = useBulkOperations()

  // Handle open import dialog
  const handleOpenImportDialog = () => {
    setShowImportDialog(true)
  }

  // Handle import from dialog
  const handleImport = async (file: File, origin: string, bank?: string) => {
    try {
      const result = await importTransactionsMutation.mutateAsync({ file, origin, bank })
      onSuccess?.(
        `Imported ${result.imported} transactions. ${result.duplicates ? `Skipped ${result.duplicates} duplicates.` : ''}`
      )
      return { success: true, imported: result.imported, duplicates: result.duplicates }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed'
      onError?.(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Handle export from dialog
  const handleExport = (format: 'xlsx' | 'csv' | 'json' = 'xlsx') => {
    // Note: exportToCSV currently only supports CSV format
    // This parameter is for future enhancement
    const csv = exportToCSV(paginatedTransactions as any)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    onSuccess?.('Transactions exported successfully')
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedIds })
      onSuccess?.(`Deleted ${selectedIds.length} transaction(s)`)
      clearSelection()
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    const result = await saveEdit(async (id, updates) => {
      // Get CSRF token
      const csrfToken = getValidCsrfToken()
      if (!csrfToken) {
        return { success: false, error: 'CSRF token missing - please log in again' }
      }

      // Use the updateTransaction method from useTransactions hook
      const updateResult = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...updates }),
      })

      if (!updateResult.ok) {
        const errorData = await updateResult.json().catch(() => ({}))
        const errorMessage =
          errorData.message ||
          (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message) ||
          'Failed to update transaction'
        return {
          success: false,
          error: errorMessage,
        }
      }

      return { success: true }
    })

    if (result.success) {
      onSuccess?.('Transaction updated successfully')
      cancelEdit()
      // No need to fetchTransactions - hook already updated state optimistically
    } else if (result.error) {
      onError?.(result.error)
    }
  }

  // Handle delete with undo toast
  const handleDelete = (id: string | number) => {
    const stringId = String(id)

    // Optimistic UI: hide the transaction immediately
    setHiddenIds(prev => new Set(prev).add(stringId))

    undoAction.trigger({
      message: 'Transaction deleted',
      onExecute: async () => {
        try {
          await deleteTransactionMutation.mutateAsync({ id: stringId })
        } catch (err) {
          // Restore the transaction on failure
          setHiddenIds(prev => {
            const next = new Set(prev)
            next.delete(stringId)
            return next
          })
          onError?.(err instanceof Error ? err.message : 'Delete failed')
        }
      },
      onUndo: () => {
        // Restore the transaction
        setHiddenIds(prev => {
          const next = new Set(prev)
          next.delete(stringId)
          return next
        })
      },
      onError: err => {
        setHiddenIds(prev => {
          const next = new Set(prev)
          next.delete(stringId)
          return next
        })
        onError?.(err.message)
      },
    })
  }

  // Handle toggle flag
  const handleToggleFlag = async (id: string) => {
    const transaction = transactions?.find(t => t.id === id)
    if (!transaction) return

    try {
      await updateTransactionMutation.mutateAsync({
        id,
        isFlagged: !transaction.isFlagged,
      })
      onSuccess?.(transaction.isFlagged ? 'Flag removed' : 'Transaction flagged')
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to toggle flag')
    }
  }

  // Handle duplicate
  const handleDuplicate = async (transaction: any) => {
    try {
      // Create a copy without the ID, matching API schema
      const duplicate = {
        rawDate: new Date(transaction.rawDate).toISOString(),
        rawDescription: transaction.rawDescription,
        rawAmount: transaction.rawAmount,
        origin: transaction.origin,
        bank: transaction.bank,
        majorCategoryId: transaction.majorCategoryId || undefined,
        categoryId: transaction.categoryId || undefined,
        tags: transaction.tags || [],
        notes: transaction.notes || undefined,
      }

      await createTransactionMutation.mutateAsync(duplicate)
      onSuccess?.('Transaction duplicated')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate transaction'
      onError?.(errorMessage)
    }
  }

  // Handle add as rule
  const handleAddAsRule = async (transaction: any) => {
    // TODO: Implement rule creation dialog
    console.log('Add as rule:', transaction)
    onSuccess?.('Rule creation not yet implemented')
  }

  // Handle refresh transaction (re-classify with AI)
  const handleRefreshTransaction = async (id: string) => {
    const transaction = transactions?.find(t => t.id === id)
    if (!transaction) return

    try {
      // Get CSRF token
      const csrfToken = getValidCsrfToken()
      if (!csrfToken) {
        onError?.('CSRF token missing - please log in again')
        return
      }

      const result = await fetch('/api/transactions/ai-classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          transactionIds: [id],
        }),
      })

      if (result.ok) {
        onSuccess?.('Transaction re-classified')
        // TanStack Query will auto-refetch and update the UI
      } else {
        const errorData = await result.json().catch(() => ({}))
        const errorMessage =
          errorData.message ||
          (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message) ||
          'Failed to re-classify transaction'
        throw new Error(errorMessage)
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to re-classify transaction')
    }
  }

  // Handle open add dialog
  const handleOpenAddDialog = () => {
    setAddForm({
      status: 'pending',
      tags: [],
    })
    setAddValidationErrors([])
    setShowAddDialog(true)
  }

  // Handle save add
  const handleSaveAdd = async () => {
    // Validate
    const errors: string[] = []
    if (!addForm.rawDate) errors.push('Date is required')
    if (!addForm.rawDescription?.trim()) errors.push('Description is required')
    if (addForm.rawAmount === undefined || isNaN(addForm.rawAmount))
      errors.push('Valid amount is required')
    if (!addForm.origin) errors.push('Origin is required')
    if (!addForm.bank) errors.push('Bank is required')

    if (errors.length > 0) {
      setAddValidationErrors(errors)
      return
    }

    setSavingAdd(true)
    setAddValidationErrors([])

    try {
      // Transform addForm to match API schema
      const transaction = {
        rawDate: addForm.rawDate.toISOString(),
        rawDescription: addForm.rawDescription,
        rawAmount: addForm.rawAmount,
        origin: addForm.origin,
        bank: addForm.bank,
        majorCategoryId: addForm.majorCategoryId || undefined,
        categoryId: addForm.categoryId || undefined,
        tags: addForm.tags || [],
        notes: addForm.notes || undefined,
      }

      await createTransactionMutation.mutateAsync(transaction)
      onSuccess?.('Transaction created successfully')
      setShowAddDialog(false)
      setAddForm({})
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction'
      onError?.(errorMessage)
    } finally {
      setSavingAdd(false)
    }
  }

  // Handle open edit dialog
  const handleOpenEditDialog = (transaction: any) => {
    startEditing(transaction)
    setShowEditDialog(true)
  }

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    cancelEdit()
    setShowEditDialog(false)
  }

  // Handle save edit dialog
  const handleSaveEditDialog = async () => {
    await handleSaveEdit()
    // handleSaveEdit already handles success/error and calls cancelEdit on success
    setShowEditDialog(false)
  }

  // Handle save bulk edit
  const handleSaveBulkEdit = async () => {
    const result = await bulkUpdate(selectedIds, async updates => {
      // Update each transaction individually since there's no bulk endpoint
      const csrfToken = getValidCsrfToken()
      if (!csrfToken) {
        return { success: false, error: 'CSRF token missing - please log in again' }
      }

      const updatePromises = selectedIds.map(id =>
        fetch('/api/transactions', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ id, ...updates }),
        })
      )

      try {
        const responses = await Promise.all(updatePromises)
        const failedUpdates = responses.filter(r => !r.ok)

        if (failedUpdates.length > 0) {
          return {
            success: false,
            error: `Failed to update ${failedUpdates.length} transaction(s)`,
          }
        }

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Bulk update failed',
        }
      }
    })

    if (result.success) {
      onSuccess?.(`Updated ${selectedIds.length} transaction(s)`)
      clearSelection()
      // No need to fetchTransactions - hook already updated state optimistically
    } else if (result.error) {
      onError?.(result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterOrigin={filterOrigin}
        setFilterOrigin={setFilterOrigin}
        filterBank={filterBank}
        setFilterBank={setFilterBank}
        filterDateFrom={filterDateFrom}
        setFilterDateFrom={setFilterDateFrom}
        filterDateTo={filterDateTo}
        setFilterDateTo={setFilterDateTo}
        sortField={sortField}
        setSortField={setSortField}
        uniqueOrigins={uniqueOrigins}
        uniqueBanks={uniqueBanks}
        hasActiveFilters={hasActiveFilters}
        clearAllFilters={clearAllFilters}
      />

      {/* Desktop Filters - Hidden on Mobile */}
      <div className="hidden md:block">
        <TransactionFilters
          // Filter state
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          filterFlagged={filterFlagged}
          filterMajorCategory={filterMajorCategory}
          filterCategory={filterCategory}
          filterTags={filterTags}
          filterDateFrom={filterDateFrom}
          filterDateTo={filterDateTo}
          filterOrigin={filterOrigin}
          filterBank={filterBank}
          sortField={sortField}
          sortDirection={sortDirection}
          showAdvancedFilters={showAdvancedFilters}
          hasActiveFilters={hasActiveFilters}
          // Filter setters
          setSearchTerm={setSearchTerm}
          setFilterStatus={setFilterStatus}
          setFilterFlagged={setFilterFlagged}
          setFilterMajorCategory={setFilterMajorCategory}
          setFilterCategory={setFilterCategory}
          setFilterTags={setFilterTags}
          setFilterDateFrom={setFilterDateFrom}
          setFilterDateTo={setFilterDateTo}
          setFilterOrigin={setFilterOrigin}
          setFilterBank={setFilterBank}
          setSortField={setSortField}
          setSortDirection={setSortDirection}
          setShowAdvancedFilters={setShowAdvancedFilters}
          // Computed values
          transactionCount={transactions?.length || 0}
          uniqueOrigins={uniqueOrigins}
          uniqueBanks={uniqueBanks}
          majorCategories={majorCategories}
          categories={
            filterMajorCategory !== 'all'
              ? getCategoriesForMajor(filterMajorCategory)
              : allCategories
          }
          // Actions
          clearAllFilters={clearAllFilters}
          onImport={handleOpenImportDialog}
          onExport={() => setShowExportDialog(true)}
          onAddTransaction={handleOpenAddDialog}
          // State
          language={language}
          token={token}
          loading={loading || categoriesLoading}
          pageSize={itemsPerPage}
          setPageSize={setItemsPerPage}
        />
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl p-4 border border-indigo-500/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              {selectedIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={openBulkEditDialog}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 min-h-[44px] rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 min-h-[44px] rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="min-h-[44px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Action Buttons Bar - Only visible on mobile */}
      <div className="md:hidden flex gap-3">
        <button
          onClick={handleOpenAddDialog}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-4 rounded-2xl hover:shadow-lg flex items-center justify-center gap-2 transition-all font-semibold min-h-[52px]"
          disabled={loading}
        >
          <Plus size={20} />
          <span>Add</span>
        </button>

        <button
          onClick={handleOpenImportDialog}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 rounded-2xl hover:shadow-lg flex items-center justify-center gap-2 transition-all font-semibold min-h-[52px]"
          disabled={loading}
        >
          <Upload size={20} />
          <span>Import</span>
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/60 dark:border-white/20 overflow-hidden">
        {loading ? (
          <TransactionTableSkeleton />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-indigo-700 dark:text-indigo-300">No transactions found</p>
          </div>
        ) : (
          <>
            {/* Mobile: Card View - Only visible on mobile */}
            <div className="md:hidden p-4 space-y-4">
              {paginatedTransactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={{
                    id: String(transaction.id),
                    description: transaction.rawDescription,
                    amount: transaction.rawAmount,
                    date: new Date(transaction.rawDate),
                    origin: transaction.origin,
                    bank: transaction.bank ?? undefined,
                    category: transaction.category ?? undefined,
                    majorCategory: transaction.majorCategory ?? undefined,
                    notes: transaction.notes ?? undefined,
                    status: transaction.status,
                  }}
                  isSelected={isSelected(String(transaction.id))}
                  onSelect={(id, e) => toggleSelection(String(id), paginatedTransactions, e)}
                  onEdit={() => startEditing(transaction)}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  language={language}
                />
              ))}
            </div>

            {/* Desktop: Table View - Hidden on mobile */}
            <div className="hidden md:block">
              <TransactionTable
                transactions={paginatedTransactions}
                editingId={editingId}
                editForm={editForm}
                savingEdit={savingEdit}
                validationErrors={validationErrors}
                selectedIds={selectedIds}
                isAllSelected={isAllSelected(paginatedTransactions)}
                language={language}
                token={token}
                onStartEdit={startEditing}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={cancelEdit}
                onToggleSelection={(id, e) => toggleSelection(id, paginatedTransactions, e)}
                onToggleAllSelection={() => toggleAllSelection(paginatedTransactions)}
                onToggleFlag={handleToggleFlag}
                onDuplicate={handleDuplicate}
                onAddAsRule={handleAddAsRule}
                onDelete={handleDelete}
                onUpdateEditForm={updateEditForm}
                onRefreshTransaction={handleRefreshTransaction}
              />
            </div>

            {/* Pagination - Mobile & Desktop */}
            {totalPages > 1 && (
              <div className="bg-indigo-50 dark:bg-slate-900/50 px-4 md:px-6 py-4 border-t border-indigo-100 dark:border-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm md:text-base text-indigo-700 dark:text-indigo-300 font-medium">
                    <span className="hidden sm:inline">Page </span>
                    {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 md:px-6 py-3 md:py-2 min-h-[48px] md:min-h-0 bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors text-sm md:text-base"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 md:px-6 py-3 md:py-2 min-h-[48px] md:min-h-0 bg-white dark:bg-slate-700 border-2 border-indigo-200 dark:border-indigo-600 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors text-sm md:text-base"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <TransactionEditDialog
        isOpen={showEditDialog}
        editForm={editForm}
        savingEdit={savingEdit}
        validationErrors={validationErrors}
        language={language}
        token={token}
        onClose={handleCloseEditDialog}
        onSave={handleSaveEditDialog}
        onUpdateForm={updateEditForm}
      />

      <TransactionAddDialog
        isOpen={showAddDialog}
        addForm={addForm}
        saving={savingAdd}
        validationErrors={addValidationErrors}
        language={language}
        token={token}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSaveAdd}
        onUpdateForm={updates => setAddForm((prev: any) => ({ ...prev, ...updates }))}
      />

      <BulkEditDialog
        isOpen={showBulkEditDialog}
        selectedCount={selectedIds.length}
        bulkEditForm={bulkEditForm}
        isProcessing={bulkOperationInProgress}
        language={language}
        token={token}
        onClose={closeBulkEditDialog}
        onSave={handleSaveBulkEdit}
        onUpdateForm={updateBulkEditForm}
      />

      <ImportDialog
        isOpen={showImportDialog}
        language={language}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImport}
      />

      <ExportDialog
        isOpen={showExportDialog}
        transactionCount={paginatedTransactions.length}
        language={language}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />

      {/* Undo Toast for delete operations */}
      {undoAction.state.isPending && undoAction.state.message && (
        <UndoToast
          message={undoAction.state.message}
          timeRemaining={undoAction.state.timeRemaining}
          totalDelay={undoAction.state.totalDelay}
          onUndo={undoAction.undo}
        />
      )}
    </div>
  )
}
