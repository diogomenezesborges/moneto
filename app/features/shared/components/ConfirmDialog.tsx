'use client'

import { AlertTriangle, Info } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      bg: 'bg-danger hover:bg-danger/90',
      text: 'text-danger dark:text-danger',
      Icon: AlertTriangle,
    },
    warning: {
      bg: 'bg-warning hover:bg-warning/90',
      text: 'text-warning dark:text-warning',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-primary hover:bg-primary/90',
      text: 'text-primary dark:text-primary',
      Icon: Info,
    },
  }

  const config = variantConfig[variant]
  const IconComponent = config.Icon

  return (
    <Dialog isOpen={isOpen} onClose={onCancel}>
      <Dialog.Overlay />
      <Dialog.Content size="md">
        <Dialog.Header>
          <div className="flex items-start gap-3">
            <IconComponent className="w-6 h-6 mt-0.5" aria-hidden="true" />
            <Dialog.Title className={config.text}>{title}</Dialog.Title>
          </div>
          <Dialog.Close onClick={onCancel} />
        </Dialog.Header>

        <div className="p-6">
          <Dialog.Description>{message}</Dialog.Description>
        </div>

        <Dialog.Footer>
          <button
            onClick={onCancel}
            className="px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 min-h-[44px] text-sm font-medium text-white ${config.bg} rounded-lg transition-colors shadow-sm hover:shadow-md`}
          >
            {confirmText}
          </button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}
