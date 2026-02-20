/**
 * useTransactionSelection Hook
 *
 * Manages transaction selection state for bulk operations.
 */

import { useState, useCallback } from 'react'
import type { TransactionWithUser } from '../../shared/types'

export function useTransactionSelection() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  // Toggle single selection
  const toggleSelection = useCallback(
    (
      id: string,
      transactions: TransactionWithUser[],
      event?: React.MouseEvent | React.ChangeEvent
    ) => {
      // Shift-click for range selection (only works with MouseEvent)
      if (
        'shiftKey' in (event || {}) &&
        (event as React.MouseEvent).shiftKey &&
        lastSelectedId &&
        lastSelectedId !== id
      ) {
        const currentIndex = transactions.findIndex(t => t.id === id)
        const lastIndex = transactions.findIndex(t => t.id === lastSelectedId)

        if (currentIndex !== -1 && lastIndex !== -1) {
          const startIndex = Math.min(currentIndex, lastIndex)
          const endIndex = Math.max(currentIndex, lastIndex)
          const rangeIds = transactions.slice(startIndex, endIndex + 1).map(t => t.id)

          setSelectedIds(prev => {
            const newSet = new Set(prev)
            rangeIds.forEach(rid => newSet.add(rid))
            return Array.from(newSet)
          })
          setLastSelectedId(id)
          return
        }
      }

      // Normal toggle
      setSelectedIds(prev => (prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]))
      setLastSelectedId(id)
    },
    [lastSelectedId]
  )

  // Toggle all selection
  const toggleAllSelection = useCallback(
    (transactions: TransactionWithUser[]) => {
      if (selectedIds.length === transactions.length) {
        setSelectedIds([])
      } else {
        setSelectedIds(transactions.map(t => t.id))
      }
    },
    [selectedIds.length]
  )

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds([])
    setLastSelectedId(null)
  }, [])

  // Check if transaction is selected
  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.includes(id)
    },
    [selectedIds]
  )

  // Check if all are selected
  const isAllSelected = useCallback(
    (transactions: TransactionWithUser[]) => {
      return transactions.length > 0 && selectedIds.length === transactions.length
    },
    [selectedIds.length]
  )

  return {
    selectedIds,
    lastSelectedId,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    isSelected,
    isAllSelected,
  }
}
