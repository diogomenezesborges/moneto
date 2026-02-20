'use client'

import { useState, useCallback } from 'react'

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

export function useBulkOperations() {
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false)
  const [bulkEditForm, setBulkEditForm] = useState<BulkEditForm>({})
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false)

  const openBulkEditDialog = useCallback(() => {
    setShowBulkEditDialog(true)
    setBulkEditForm({})
  }, [])

  const closeBulkEditDialog = useCallback(() => {
    setShowBulkEditDialog(false)
    setBulkEditForm({})
  }, [])

  const updateBulkEditForm = useCallback((updates: Partial<BulkEditForm>) => {
    setBulkEditForm(prev => ({ ...prev, ...updates }))
  }, [])

  const bulkUpdate = useCallback(
    async (
      selectedIds: string[],
      onUpdate: (updates: BulkEditForm) => Promise<{ success: boolean; error?: string }>
    ) => {
      if (selectedIds.length === 0) {
        return { success: false, error: 'No transactions selected' }
      }

      setBulkOperationInProgress(true)

      try {
        const result = await onUpdate(bulkEditForm)

        if (result.success) {
          closeBulkEditDialog()
        }

        return result
      } finally {
        setBulkOperationInProgress(false)
      }
    },
    [bulkEditForm, closeBulkEditDialog]
  )

  const bulkDelete = useCallback(
    async (
      selectedIds: string[],
      onDelete: (ids: string[]) => Promise<{ success: boolean; error?: string }>
    ) => {
      if (selectedIds.length === 0) {
        return { success: false, error: 'No transactions selected' }
      }

      setBulkOperationInProgress(true)

      try {
        return await onDelete(selectedIds)
      } finally {
        setBulkOperationInProgress(false)
      }
    },
    []
  )

  const bulkAIClassify = useCallback(
    async (
      selectedIds: string[],
      onClassify: (ids: string[]) => Promise<{ success: boolean; error?: string }>
    ) => {
      if (selectedIds.length === 0) {
        return { success: false, error: 'No transactions selected' }
      }

      setBulkOperationInProgress(true)

      try {
        return await onClassify(selectedIds)
      } finally {
        setBulkOperationInProgress(false)
      }
    },
    []
  )

  return {
    showBulkEditDialog,
    bulkEditForm,
    bulkOperationInProgress,
    openBulkEditDialog,
    closeBulkEditDialog,
    updateBulkEditForm,
    setBulkEditForm,
    bulkUpdate,
    bulkDelete,
    bulkAIClassify,
  }
}
