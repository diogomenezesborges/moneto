'use client'

import React, { createContext, useContext, useId } from 'react'
import { X } from 'lucide-react'
import { useDialog } from './use-dialog'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DialogContextValue {
  isOpen: boolean
  onClose: () => void
  titleId: string
  descriptionId: string
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error('Dialog compound components must be used within <Dialog>')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

interface DialogRootProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

function DialogRoot({ isOpen, onClose, children }: DialogRootProps) {
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`

  if (!isOpen) return null

  return (
    <DialogContext.Provider value={{ isOpen, onClose, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

interface DialogOverlayProps {
  className?: string
}

function DialogOverlay({ className = '' }: DialogOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 ${className}`.trim()}
      aria-hidden="true"
    />
  )
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

interface DialogContentProps {
  size?: DialogSize
  className?: string
  children: React.ReactNode
  closeOnEscape?: boolean
  closeOnOutsideClick?: boolean
  trapFocus?: boolean
  lockScroll?: boolean
}

function DialogContent({
  size = 'md',
  className = '',
  children,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  trapFocus = true,
  lockScroll = true,
}: DialogContentProps) {
  const { onClose, titleId, descriptionId } = useDialogContext()
  const { overlayProps, dialogProps } = useDialog({
    isOpen: true,
    onClose,
    closeOnEscape,
    closeOnOutsideClick,
    trapFocus,
    lockScroll,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" {...overlayProps}>
      <div
        {...dialogProps}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} animate-in fade-in zoom-in duration-200 ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

function DialogHeader({ className = '', children }: DialogHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between p-6 border-b border-gray-200 dark:border-slate-700 ${className}`.trim()}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

interface DialogFooterProps {
  className?: string
  children: React.ReactNode
}

function DialogFooter({ className = '', children }: DialogFooterProps) {
  return (
    <div
      className={`flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700 ${className}`.trim()}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

function DialogTitle({ className = '', children }: DialogTitleProps) {
  const { titleId } = useDialogContext()

  return (
    <h2
      id={titleId}
      className={`text-xl font-bold text-gray-900 dark:text-white ${className}`.trim()}
    >
      {children}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

interface DialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

function DialogDescription({ className = '', children }: DialogDescriptionProps) {
  const { descriptionId } = useDialogContext()

  return (
    <p
      id={descriptionId}
      className={`text-gray-700 dark:text-slate-300 text-sm leading-relaxed ${className}`.trim()}
    >
      {children}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

interface DialogCloseProps {
  className?: string
  onClick?: () => void
}

function DialogClose({ className = '', onClick }: DialogCloseProps) {
  const { onClose } = useDialogContext()

  const handleClick = onClick ?? onClose

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors ${className}`.trim()}
      aria-label="Close"
    >
      <X size={24} aria-hidden="true" />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Dialog = Object.assign(DialogRoot, {
  Overlay: DialogOverlay,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
})

export type { DialogSize, DialogRootProps, DialogContentProps }
