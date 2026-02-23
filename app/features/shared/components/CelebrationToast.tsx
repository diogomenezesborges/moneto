'use client'

import { useEffect } from 'react'
import { Sparkles, PartyPopper, Trophy, X } from 'lucide-react'

interface CelebrationToastProps {
  message: string
  onClose: () => void
  duration?: number
  variant?: 'milestone' | 'batch' | 'achievement'
}

/**
 * CelebrationToast Component
 *
 * A reusable toast component for positive reinforcement and milestone celebrations.
 * Extends the existing Notification pattern with celebratory styling.
 * Non-intrusive, auto-dismisses after specified duration (default 5 seconds).
 *
 * @example
 * // Review queue cleared
 * <CelebrationToast
 *   message="All caught up! Review queue cleared 🎉"
 *   onClose={() => setShowToast(false)}
 *   variant="milestone"
 * />
 *
 * @example
 * // Batch approval
 * <CelebrationToast
 *   message="Great work! 15 transactions approved"
 *   onClose={() => setShowToast(false)}
 *   variant="batch"
 * />
 */
export function CelebrationToast({
  message,
  onClose,
  duration = 5000,
  variant = 'milestone',
}: CelebrationToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const variantStyles = {
    milestone: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      icon: PartyPopper,
      borderColor: 'border-blue-400',
    },
    batch: {
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      icon: Sparkles,
      borderColor: 'border-green-400',
    },
    achievement: {
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      icon: Trophy,
      borderColor: 'border-yellow-400',
    },
  }

  const style = variantStyles[variant]
  const Icon = style.icon

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`${style.bg} text-white rounded-xl shadow-2xl flex items-center gap-3 px-5 py-4 min-w-[320px] max-w-md border-2 ${style.borderColor}`}
      >
        <div className="flex-shrink-0 animate-bounce">
          <Icon size={24} className="text-white" />
        </div>
        <p className="flex-1 text-sm font-semibold leading-snug">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          aria-label="Close celebration"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
