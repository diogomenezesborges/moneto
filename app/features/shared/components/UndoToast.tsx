/**
 * UndoToast Component
 *
 * A fixed bottom-right toast with an undo button and countdown progress bar.
 * Used for destructive actions (delete transaction, delete rule) to allow
 * the user to reverse the action before it executes (Issue #219).
 *
 * @example
 * <UndoToast
 *   message="Transaction deleted"
 *   timeRemaining={3000}
 *   totalDelay={5000}
 *   onUndo={() => restoreTransaction()}
 * />
 */

'use client'

interface UndoToastProps {
  /** Message to display in the toast */
  message: string
  /** Time remaining before action executes (ms) */
  timeRemaining: number
  /** Total delay time (ms), used to calculate progress */
  totalDelay: number
  /** Callback when undo button is clicked */
  onUndo: () => void
  /** Optional callback when toast is dismissed without undo */
  onDismiss?: () => void
}

export function UndoToast({ message, timeRemaining, totalDelay, onUndo }: UndoToastProps) {
  const progress = totalDelay > 0 ? (timeRemaining / totalDelay) * 100 : 0

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-gray-900 dark:bg-gray-100 rounded-xl shadow-2xl min-w-[300px] max-w-md border border-gray-700 dark:border-gray-300 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <p className="flex-1 text-sm font-medium text-gray-100 dark:text-gray-900">{message}</p>
          <button
            onClick={onUndo}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center px-3 py-2 text-sm font-bold text-yellow-400 dark:text-yellow-600 hover:text-yellow-300 dark:hover:text-yellow-700 transition-colors rounded-lg hover:bg-white/10 dark:hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
            aria-label="Undo action"
          >
            Undo
          </button>
        </div>
        {/* Countdown progress bar */}
        <div className="h-1 w-full bg-gray-700 dark:bg-gray-300">
          <div
            className="h-full bg-yellow-400 dark:bg-yellow-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Time remaining to undo"
          />
        </div>
      </div>
    </div>
  )
}
