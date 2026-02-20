/**
 * useTransactions Hook
 *
 * Manages transaction state, CRUD operations, and data fetching.
 */

import { useState, useEffect, useCallback } from 'react'
import type { TransactionWithUser } from '../../shared/types'

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

interface UseTransactionsProps {
  token: string | null
  isAuthenticated: boolean
}

export function useTransactions({ token, isAuthenticated }: UseTransactionsProps) {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (!token || !isAuthenticated) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      // API returns transactions directly as an array, not wrapped in an object
      setTransactions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Fetch transactions error:', err)
    } finally {
      setLoading(false)
    }
  }, [token, isAuthenticated])

  // Load transactions on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchTransactions()
    }
  }, [isAuthenticated, token, fetchTransactions])

  // Create transaction
  const createTransaction = useCallback(
    async (data: Partial<TransactionWithUser>) => {
      if (!token) return { success: false, error: 'Not authenticated' }

      try {
        const csrfToken = getValidCsrfToken()
        if (!csrfToken) {
          return { success: false, error: 'CSRF token missing - please log in again' }
        }

        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ transactions: [data] }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to create transaction')
        }

        await fetchTransactions() // Reload transactions
        return { success: true }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    },
    [token, fetchTransactions]
  )

  // Update transaction
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<TransactionWithUser>) => {
      if (!token) return { success: false, error: 'Not authenticated' }

      try {
        const csrfToken = getValidCsrfToken()
        if (!csrfToken) {
          return { success: false, error: 'CSRF token missing - please log in again' }
        }

        const response = await fetch('/api/transactions', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ id, ...updates }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to update transaction')
        }

        const updatedTransaction = await response.json()

        // Update local state with the returned transaction
        setTransactions(prev => prev.map(t => (t.id === id ? { ...t, ...updatedTransaction } : t)))

        return { success: true, transaction: updatedTransaction }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    },
    [token]
  )

  // Delete transaction
  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!token) return { success: false, error: 'Not authenticated' }

      try {
        const csrfToken = getValidCsrfToken()
        if (!csrfToken) {
          return { success: false, error: 'CSRF token missing - please log in again' }
        }

        const response = await fetch('/api/transactions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to delete transaction')
        }

        // Remove from local state
        setTransactions(prev => prev.filter(t => t.id !== id))

        return { success: true }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    },
    [token]
  )

  // Bulk delete transactions
  const bulkDeleteTransactions = useCallback(
    async (ids: string[]) => {
      if (!token) return { success: false, error: 'Not authenticated' }

      // Use Promise.allSettled to handle each deletion independently
      // This prevents one failure from aborting the entire operation
      const results = await Promise.allSettled(ids.map(id => deleteTransaction(id)))

      // Count successes and failures
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failedCount = results.length - successCount

      // Collect error messages from failed deletions
      const errors = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
        .map((r, idx) => {
          if (r.status === 'rejected') {
            return `Transaction ${ids[idx]}: ${r.reason?.message || 'Unknown error'}`
          } else if (r.status === 'fulfilled') {
            return `Transaction ${ids[idx]}: ${r.value.error || 'Failed'}`
          }
          return `Transaction ${ids[idx]}: Unknown error`
        })

      if (failedCount > 0) {
        return {
          success: false,
          error: `${failedCount} of ${results.length} deletions failed`,
          successCount,
          failedCount,
          errors, // Include detailed error messages
        }
      }

      return { success: true, successCount }
    },
    [token, deleteTransaction]
  )

  // Import transactions from file
  const importTransactions = useCallback(
    async (file: File) => {
      if (!token) return { success: false, error: 'Not authenticated' }

      setLoading(true)

      try {
        // Parse file using client-side parser
        const { parseFile } = await import('@/lib/parsers')
        const { transactions: parsedTransactions } = await parseFile(file, 'user-id')

        // Send to API for import
        const csrfToken = getValidCsrfToken()
        if (!csrfToken) {
          return { success: false, error: 'CSRF token missing - please log in again' }
        }

        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ transactions: parsedTransactions }),
        })

        if (!response.ok) {
          throw new Error('Failed to import transactions')
        }

        const data = await response.json()

        // Reload transactions
        await fetchTransactions()

        return {
          success: true,
          imported: data.count || 0,
          duplicates: data.skipped || 0,
          message: data.message,
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      } finally {
        setLoading(false)
      }
    },
    [token, fetchTransactions]
  )

  // Export transactions to CSV
  const exportTransactions = useCallback(
    (filteredTransactions?: TransactionWithUser[]) => {
      const { exportToCSV } = require('@/lib/parsers')
      const dataToExport = filteredTransactions || transactions

      const csv = exportToCSV(dataToExport)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    [transactions]
  )

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    importTransactions,
    exportTransactions,
  }
}
