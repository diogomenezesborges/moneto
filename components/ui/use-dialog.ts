'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseDialogOptions {
  isOpen: boolean
  onClose: () => void
  closeOnEscape?: boolean
  closeOnOutsideClick?: boolean
  trapFocus?: boolean
  lockScroll?: boolean
}

interface UseDialogReturn {
  dialogRef: React.RefObject<HTMLDivElement | null>
  overlayProps: { onClick: (e: React.MouseEvent) => void }
  dialogProps: {
    role: 'dialog'
    'aria-modal': true
    tabIndex: -1
    ref: React.RefObject<HTMLDivElement | null>
    onKeyDown: (e: React.KeyboardEvent) => void
  }
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useDialog({
  isOpen,
  onClose,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  trapFocus = true,
  lockScroll = true,
}: UseDialogOptions): UseDialogReturn {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // Scroll lock
  useEffect(() => {
    if (!lockScroll) return

    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, lockScroll])

  // Focus management: save previous focus and restore on close
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus()
      previouslyFocusedRef.current = null
    }
  }, [isOpen])

  // Focus trap: focus first focusable element on open
  useEffect(() => {
    if (!isOpen || !trapFocus) return

    // Use requestAnimationFrame to ensure the dialog is rendered
    const frameId = requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog) return

      const focusableElements = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    })

    return () => cancelAnimationFrame(frameId)
  }, [isOpen, trapFocus])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      if (trapFocus && e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return

        const focusableElements = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          // Shift+Tab: if focus is on first element, wrap to last
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: if focus is on last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [closeOnEscape, trapFocus, onClose]
  )

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!closeOnOutsideClick) return

      // Only close if the click was directly on the overlay, not on dialog content
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [closeOnOutsideClick, onClose]
  )

  return {
    dialogRef,
    overlayProps: {
      onClick: handleOverlayClick,
    },
    dialogProps: {
      role: 'dialog' as const,
      'aria-modal': true as const,
      tabIndex: -1 as const,
      ref: dialogRef,
      onKeyDown: handleKeyDown,
    },
  }
}
