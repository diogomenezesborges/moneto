'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export function Notification({ message, type, onClose, duration = 4000 }: NotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const typeStyles = {
    success: {
      bg: 'bg-success',
      icon: CheckCircle,
      iconColor: 'text-white',
      textColor: 'text-white',
    },
    error: {
      bg: 'bg-danger',
      icon: XCircle,
      iconColor: 'text-white',
      textColor: 'text-white',
    },
    info: {
      bg: 'bg-gray-800 dark:bg-gray-200',
      icon: Info,
      iconColor: 'text-gray-200 dark:text-gray-800',
      textColor: 'text-gray-200 dark:text-gray-800',
    },
  }

  const style = typeStyles[type]
  const Icon = style.icon

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`${style.bg} ${style.textColor} rounded-xl shadow-2xl flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-md border ${type === 'info' ? 'border-gray-700 dark:border-gray-300' : 'border-transparent'}`}
      >
        <Icon size={20} className={style.iconColor} />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${type === 'info' ? 'text-gray-400 dark:text-gray-600 hover:text-gray-200 dark:hover:text-gray-800' : 'text-white/80 hover:text-white'}`}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
