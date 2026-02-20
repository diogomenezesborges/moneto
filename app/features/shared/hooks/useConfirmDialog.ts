'use client'

import { useState } from 'react'

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  })

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'danger' | 'warning' | 'info' = 'danger'
  ) => {
    setDialogState({ isOpen: true, title, message, onConfirm, variant })
  }

  const handleConfirm = () => {
    dialogState.onConfirm()
    setDialogState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      variant: 'danger',
    })
  }

  const handleCancel = () => {
    setDialogState({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
      variant: 'danger',
    })
  }

  return {
    dialogState,
    showConfirmDialog,
    handleConfirm,
    handleCancel,
  }
}
