'use client'

import { useState, useCallback } from 'react'
import type { Transaction } from '@prisma/client'
import type { EditForm } from '../../shared/types'

interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function useTransactionEdit() {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const startEditing = useCallback((transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditForm({
      rawDate: transaction.rawDate,
      rawDescription: transaction.rawDescription,
      rawAmount: transaction.rawAmount,
      rawBalance: transaction.rawBalance,
      notes: transaction.notes,
      origin: transaction.origin,
      bank: transaction.bank,
      majorCategoryId: transaction.majorCategoryId,
      categoryId: transaction.categoryId,
      majorCategory: transaction.majorCategory,
      category: transaction.category,
      tags: transaction.tags || [],
      status: transaction.status,
      flagged: transaction.flagged || false,
    })
    setValidationErrors([])
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditForm({})
    setValidationErrors([])
  }, [])

  const validateEditForm = useCallback((): ValidationResult => {
    const errors: string[] = []

    if (!editForm.rawDate) {
      errors.push('Date is required')
    }

    if (!editForm.rawDescription?.trim()) {
      errors.push('Description cannot be empty')
    }

    if (editForm.rawAmount === undefined || editForm.rawAmount === null) {
      errors.push('Valid amount is required')
    } else {
      const amount =
        typeof editForm.rawAmount === 'string' ? parseFloat(editForm.rawAmount) : editForm.rawAmount
      if (isNaN(amount)) {
        errors.push('Valid amount is required')
      }
    }

    if (!editForm.origin) {
      errors.push('Origin is required')
    }

    if (!editForm.bank) {
      errors.push('Bank is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }, [editForm])

  const saveEdit = useCallback(
    async (
      onSave: (id: string, updates: EditForm) => Promise<{ success: boolean; error?: string }>
    ) => {
      if (!editingId) return { success: false, error: 'No transaction being edited' }

      // Validate first
      const validation = validateEditForm()
      if (!validation.valid) {
        setValidationErrors(validation.errors)
        return { success: false, error: validation.errors.join(', ') }
      }

      setSavingEdit(true)
      setValidationErrors([])

      try {
        const result = await onSave(editingId, editForm)

        if (result.success) {
          setEditingId(null)
          setEditForm({})
        }

        return result
      } finally {
        setSavingEdit(false)
      }
    },
    [editingId, editForm, validateEditForm]
  )

  const updateEditForm = useCallback((updates: Partial<EditForm>) => {
    setEditForm(prev => ({ ...prev, ...updates }))
  }, [])

  return {
    editingId,
    editForm,
    savingEdit,
    validationErrors,
    startEditing,
    cancelEdit,
    validateEditForm,
    saveEdit,
    updateEditForm,
    setEditForm,
  }
}
