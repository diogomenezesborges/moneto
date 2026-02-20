/**
 * useUndoAction Hook
 *
 * Manages undoable destructive actions with a countdown timer.
 * Shows a toast with an undo button before executing the action.
 * Used for delete operations on transactions and rules (Issue #219).
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface UndoActionOptions {
  /** Delay before executing the action (ms). Default: 5000 */
  delay?: number
  /** Message to show in the toast */
  message: string
  /** Callback when action executes (timer expires) */
  onExecute: () => void | Promise<void>
  /** Callback when action is undone */
  onUndo?: () => void
  /** Callback on error */
  onError?: (error: Error) => void
}

interface UndoActionState {
  /** Whether an undo action is currently pending */
  isPending: boolean
  /** The message for the current pending action */
  message: string | null
  /** Time remaining in ms */
  timeRemaining: number
  /** Total delay time */
  totalDelay: number
}

interface UseUndoActionReturn {
  /** Trigger a new undoable action */
  trigger: (options: UndoActionOptions) => void
  /** Cancel/undo the pending action */
  undo: () => void
  /** Current state */
  state: UndoActionState
}

export function useUndoAction(): UseUndoActionReturn {
  const [state, setState] = useState<UndoActionState>({
    isPending: false,
    message: null,
    timeRemaining: 0,
    totalDelay: 0,
  })

  const executeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingOptionsRef = useRef<UndoActionOptions | null>(null)
  const startTimeRef = useRef<number>(0)

  const clearTimers = useCallback(() => {
    if (executeTimeoutRef.current !== null) {
      clearTimeout(executeTimeoutRef.current)
      executeTimeoutRef.current = null
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const resetState = useCallback(() => {
    clearTimers()
    pendingOptionsRef.current = null
    startTimeRef.current = 0
    setState({
      isPending: false,
      message: null,
      timeRemaining: 0,
      totalDelay: 0,
    })
  }, [clearTimers])

  const trigger = useCallback(
    (options: UndoActionOptions) => {
      // Cancel any existing pending action (without calling onUndo)
      clearTimers()

      const delay = options.delay ?? 5000
      pendingOptionsRef.current = options
      startTimeRef.current = Date.now()

      setState({
        isPending: true,
        message: options.message,
        timeRemaining: delay,
        totalDelay: delay,
      })

      // Set up countdown interval (update every 100ms)
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        const remaining = Math.max(0, delay - elapsed)
        setState(prev => ({
          ...prev,
          timeRemaining: remaining,
        }))
      }, 100)

      // Set up execution timeout
      executeTimeoutRef.current = setTimeout(async () => {
        clearTimers()
        const currentOptions = pendingOptionsRef.current
        pendingOptionsRef.current = null
        startTimeRef.current = 0

        setState({
          isPending: false,
          message: null,
          timeRemaining: 0,
          totalDelay: 0,
        })

        if (currentOptions) {
          try {
            await currentOptions.onExecute()
          } catch (error) {
            currentOptions.onError?.(error instanceof Error ? error : new Error(String(error)))
          }
        }
      }, delay)
    },
    [clearTimers]
  )

  const undo = useCallback(() => {
    const options = pendingOptionsRef.current
    resetState()
    options?.onUndo?.()
  }, [resetState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  return { trigger, undo, state }
}
