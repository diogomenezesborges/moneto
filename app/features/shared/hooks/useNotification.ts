/**
 * useNotification Hook
 *
 * Manages notification toasts with auto-dismiss.
 */

import { useState, useEffect } from 'react'
import type { NotificationState } from '../types'

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState | null>(null)

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000) // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
  }

  const showSuccess = (message: string) => showNotification(message, 'success')
  const showError = (message: string) => showNotification(message, 'error')
  const showInfo = (message: string) => showNotification(message, 'info')

  const dismissNotification = () => setNotification(null)

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    dismissNotification,
  }
}
