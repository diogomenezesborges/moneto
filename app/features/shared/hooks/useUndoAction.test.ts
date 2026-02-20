/**
 * Tests for useUndoAction Hook (Issue #219)
 *
 * Verifies the undo toast pattern for destructive actions:
 * - trigger() sets pending state with countdown
 * - Timer expires and calls onExecute
 * - undo() cancels pending action and calls onUndo
 * - timeRemaining decrements over time
 * - New trigger replaces previous pending action
 * - Cleanup on unmount cancels timers
 * - Error handling calls onError
 */

import { renderHook, act } from '@testing-library/react'
import { useUndoAction } from './useUndoAction'

describe('useUndoAction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with no pending action', () => {
      const { result } = renderHook(() => useUndoAction())

      expect(result.current.state.isPending).toBe(false)
      expect(result.current.state.message).toBeNull()
      expect(result.current.state.timeRemaining).toBe(0)
      expect(result.current.state.totalDelay).toBe(0)
    })

    it('should expose trigger, undo, and state', () => {
      const { result } = renderHook(() => useUndoAction())

      expect(typeof result.current.trigger).toBe('function')
      expect(typeof result.current.undo).toBe('function')
      expect(result.current.state).toBeDefined()
    })
  })

  describe('trigger()', () => {
    it('should set pending state with message and delay', () => {
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          onExecute: vi.fn(),
        })
      })

      expect(result.current.state.isPending).toBe(true)
      expect(result.current.state.message).toBe('Item deleted')
      expect(result.current.state.totalDelay).toBe(5000)
      expect(result.current.state.timeRemaining).toBe(5000)
    })

    it('should use custom delay when provided', () => {
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 3000,
          onExecute: vi.fn(),
        })
      })

      expect(result.current.state.totalDelay).toBe(3000)
      expect(result.current.state.timeRemaining).toBe(3000)
    })

    it('should call onExecute when timer expires', () => {
      const onExecute = vi.fn()
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 3000,
          onExecute,
        })
      })

      expect(onExecute).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(onExecute).toHaveBeenCalledTimes(1)
    })

    it('should reset state after timer expires', () => {
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 2000,
          onExecute: vi.fn(),
        })
      })

      expect(result.current.state.isPending).toBe(true)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.state.isPending).toBe(false)
      expect(result.current.state.message).toBeNull()
    })
  })

  describe('undo()', () => {
    it('should cancel the pending action', () => {
      const onExecute = vi.fn()
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 5000,
          onExecute,
        })
      })

      expect(result.current.state.isPending).toBe(true)

      act(() => {
        result.current.undo()
      })

      expect(result.current.state.isPending).toBe(false)
      expect(result.current.state.message).toBeNull()

      // Advance past the original timeout - onExecute should NOT be called
      act(() => {
        vi.advanceTimersByTime(6000)
      })

      expect(onExecute).not.toHaveBeenCalled()
    })

    it('should call onUndo callback when undone', () => {
      const onUndo = vi.fn()
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          onExecute: vi.fn(),
          onUndo,
        })
      })

      act(() => {
        result.current.undo()
      })

      expect(onUndo).toHaveBeenCalledTimes(1)
    })

    it('should not call onExecute after undo', () => {
      const onExecute = vi.fn()
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 3000,
          onExecute,
        })
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      act(() => {
        result.current.undo()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(onExecute).not.toHaveBeenCalled()
    })
  })

  describe('timeRemaining', () => {
    it('should decrement over time', () => {
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 5000,
          onExecute: vi.fn(),
        })
      })

      expect(result.current.state.timeRemaining).toBe(5000)

      // Advance by 100ms (one interval tick)
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // timeRemaining should have decreased
      expect(result.current.state.timeRemaining).toBeLessThanOrEqual(5000)
      expect(result.current.state.timeRemaining).toBeGreaterThanOrEqual(4800)

      // Advance by another 900ms (1 second total)
      act(() => {
        vi.advanceTimersByTime(900)
      })

      expect(result.current.state.timeRemaining).toBeLessThanOrEqual(4100)
      expect(result.current.state.timeRemaining).toBeGreaterThanOrEqual(3900)
    })

    it('should not go below zero', () => {
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 1000,
          onExecute: vi.fn(),
        })
      })

      // Advance past the delay
      act(() => {
        vi.advanceTimersByTime(1500)
      })

      expect(result.current.state.timeRemaining).toBe(0)
    })
  })

  describe('Replacing Actions', () => {
    it('should replace previous pending action with new one', () => {
      const onExecute1 = vi.fn()
      const onExecute2 = vi.fn()
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'First item deleted',
          delay: 5000,
          onExecute: onExecute1,
        })
      })

      expect(result.current.state.message).toBe('First item deleted')

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Trigger a new action, replacing the first
      act(() => {
        result.current.trigger({
          message: 'Second item deleted',
          delay: 5000,
          onExecute: onExecute2,
        })
      })

      expect(result.current.state.message).toBe('Second item deleted')
      expect(result.current.state.totalDelay).toBe(5000)

      // Advance past the first action's original timeout
      act(() => {
        vi.advanceTimersByTime(3500)
      })

      // First action should NOT have been executed
      expect(onExecute1).not.toHaveBeenCalled()
      // Second action should not have executed yet (only 3.5s out of 5s)
      expect(onExecute2).not.toHaveBeenCalled()

      // Advance to complete the second action's timeout
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(onExecute2).toHaveBeenCalledTimes(1)
      expect(onExecute1).not.toHaveBeenCalled()
    })
  })

  describe('Cleanup on Unmount', () => {
    it('should cancel timers when hook unmounts', () => {
      const onExecute = vi.fn()
      const { result, unmount } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 5000,
          onExecute,
        })
      })

      expect(result.current.state.isPending).toBe(true)

      unmount()

      // Advance past the delay
      act(() => {
        vi.advanceTimersByTime(6000)
      })

      // onExecute should NOT be called since component unmounted
      expect(onExecute).not.toHaveBeenCalled()
    })

    it('should clean up interval timers on unmount', () => {
      const { result, unmount } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 5000,
          onExecute: vi.fn(),
        })
      })

      unmount()

      // All timers should be cleared
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should call onError when onExecute throws', async () => {
      const onError = vi.fn()
      const error = new Error('Delete failed')
      const onExecute = vi.fn().mockRejectedValue(error)

      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 1000,
          onExecute,
          onError,
        })
      })

      // Advance past the delay and flush all promises
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(onExecute).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(error)
    })

    it('should wrap non-Error thrown values in Error', async () => {
      const onError = vi.fn()
      const onExecute = vi.fn().mockRejectedValue('string error')

      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 1000,
          onExecute,
          onError,
        })
      })

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
      expect(onError.mock.calls[0][0].message).toBe('string error')
    })

    it('should still reset state even when onExecute throws', async () => {
      const onExecute = vi.fn().mockRejectedValue(new Error('fail'))

      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 1000,
          onExecute,
          onError: vi.fn(),
        })
      })

      expect(result.current.state.isPending).toBe(true)

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.state.isPending).toBe(false)
    })
  })

  describe('Async onExecute', () => {
    it('should support async onExecute functions', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useUndoAction())

      act(() => {
        result.current.trigger({
          message: 'Item deleted',
          delay: 1000,
          onExecute,
        })
      })

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(onExecute).toHaveBeenCalledTimes(1)
      expect(result.current.state.isPending).toBe(false)
    })
  })
})
