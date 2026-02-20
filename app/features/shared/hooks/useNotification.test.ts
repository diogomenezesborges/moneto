/**
 * Tests for useNotification Hook
 *
 * Tests notification toast management with auto-dismiss.
 */

import { renderHook, act } from '@testing-library/react'
import { useNotification } from './useNotification'

describe('useNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with no notification', () => {
      const { result } = renderHook(() => useNotification())

      expect(result.current.notification).toBeNull()
    })
  })

  describe('showSuccess', () => {
    it('should show success notification', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showSuccess('Operation successful')
      })

      expect(result.current.notification).toEqual({
        message: 'Operation successful',
        type: 'success',
      })
    })

    it('should auto-dismiss success notification after 5 seconds', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showSuccess('Success message')
      })

      expect(result.current.notification).toBeTruthy()

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.notification).toBeNull()
    })
  })

  describe('showError', () => {
    it('should show error notification', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showError('Something went wrong')
      })

      expect(result.current.notification).toEqual({
        message: 'Something went wrong',
        type: 'error',
      })
    })

    it('should auto-dismiss error notification after 5 seconds', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showError('Error message')
      })

      expect(result.current.notification).toBeTruthy()

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.notification).toBeNull()
    })
  })

  describe('showInfo', () => {
    it('should show info notification', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showInfo('Information message')
      })

      expect(result.current.notification).toEqual({
        message: 'Information message',
        type: 'info',
      })
    })

    it('should auto-dismiss info notification after 5 seconds', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showInfo('Info message')
      })

      expect(result.current.notification).toBeTruthy()

      act(() => {
        vi.runAllTimers()
      })

      expect(result.current.notification).toBeNull()
    })
  })

  describe('showNotification', () => {
    it('should show notification with default type (info)', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showNotification('Default message')
      })

      expect(result.current.notification).toEqual({
        message: 'Default message',
        type: 'info',
      })
    })

    it('should show notification with custom type', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showNotification('Custom message', 'error')
      })

      expect(result.current.notification).toEqual({
        message: 'Custom message',
        type: 'error',
      })
    })

    it('should replace previous notification when new one is shown', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showInfo('First message')
      })

      expect(result.current.notification?.message).toBe('First message')

      act(() => {
        result.current.showSuccess('Second message')
      })

      expect(result.current.notification?.message).toBe('Second message')
      expect(result.current.notification?.type).toBe('success')
    })
  })

  describe('dismissNotification', () => {
    it('should dismiss notification immediately', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showSuccess('Success message')
      })

      expect(result.current.notification).toBeTruthy()

      act(() => {
        result.current.dismissNotification()
      })

      expect(result.current.notification).toBeNull()
    })

    it('should cancel auto-dismiss timer when manually dismissed', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showInfo('Info message')
      })

      expect(result.current.notification).toBeTruthy()

      // Advance time by 2 seconds (less than 5)
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Manually dismiss
      act(() => {
        result.current.dismissNotification()
      })

      expect(result.current.notification).toBeNull()

      // Advance time to 5 seconds total - should stay null
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.notification).toBeNull()
    })
  })

  describe('Timer Cleanup', () => {
    it('should clear timer when new notification replaces old one', () => {
      const { result } = renderHook(() => useNotification())

      act(() => {
        result.current.showInfo('First message')
      })

      // Advance time by 2 seconds (less than 5)
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.notification?.message).toBe('First message')

      // Show new notification (should reset timer)
      act(() => {
        result.current.showSuccess('Second message')
      })

      expect(result.current.notification?.message).toBe('Second message')

      // Advance by 3 more seconds (5 total from first, 3 from second)
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      // First notification's timer should be cleared, second should still be active
      expect(result.current.notification?.message).toBe('Second message')

      // Advance by 2 more seconds (5 total from second)
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Now second notification should be dismissed
      expect(result.current.notification).toBeNull()
    })

    it('should clear timer on unmount', () => {
      const { result, unmount } = renderHook(() => useNotification())

      act(() => {
        result.current.showInfo('Test message')
      })

      expect(result.current.notification).toBeTruthy()

      unmount()

      // Timer should be cleaned up, no memory leaks
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('Return Values', () => {
    it('should expose all expected functions and state', () => {
      const { result } = renderHook(() => useNotification())

      expect(result.current).toHaveProperty('notification')
      expect(result.current).toHaveProperty('showNotification')
      expect(result.current).toHaveProperty('showSuccess')
      expect(result.current).toHaveProperty('showError')
      expect(result.current).toHaveProperty('showInfo')
      expect(result.current).toHaveProperty('dismissNotification')

      expect(typeof result.current.showNotification).toBe('function')
      expect(typeof result.current.showSuccess).toBe('function')
      expect(typeof result.current.showError).toBe('function')
      expect(typeof result.current.showInfo).toBe('function')
      expect(typeof result.current.dismissNotification).toBe('function')
    })
  })
})
