/**
 * Tests for useTheme Hook
 *
 * Tests dark mode management and system preference detection.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useTheme } from './useTheme'

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(event: MediaQueryListEvent) => void> = []

  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.push(listener)
      }
    }),
    removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }),
    dispatchEvent: vi.fn((event: MediaQueryListEvent) => {
      listeners.forEach(listener => listener(event))
      return true
    }),
    // Helper to trigger listeners
    triggerChange: (matches: boolean) => {
      const event = new Event('change') as MediaQueryListEvent
      Object.defineProperty(event, 'matches', { value: matches })
      listeners.forEach(listener => listener(event))
    },
  }
}

describe('useTheme', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>

  beforeEach(() => {
    // Reset document classes
    document.documentElement.classList.remove('dark')

    // Setup matchMedia mock (defaults to light mode)
    matchMediaMock = createMatchMediaMock(false)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => matchMediaMock),
    })
  })

  describe('Initial State', () => {
    it('should initialize with default values (light mode, Portuguese)', async () => {
      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(false)
        expect(result.current.language).toBe('pt')
      })
    })

    it('should detect system dark mode preference', async () => {
      matchMediaMock = createMatchMediaMock(true)
      window.matchMedia = vi.fn(() => matchMediaMock) as any

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(true)
      })
    })

    it('should detect system light mode preference', async () => {
      matchMediaMock = createMatchMediaMock(false)
      window.matchMedia = vi.fn(() => matchMediaMock) as any

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(false)
      })
    })
  })

  describe('Dark Mode Toggle', () => {
    it('should toggle dark mode when toggleDarkMode is called', async () => {
      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(false)
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.darkMode).toBe(true)

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.darkMode).toBe(false)
    })

    it('should apply "dark" class to document when dark mode is enabled', async () => {
      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(false)
      })

      expect(document.documentElement.classList.contains('dark')).toBe(false)

      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    it('should remove "dark" class from document when dark mode is disabled', async () => {
      matchMediaMock = createMatchMediaMock(true)
      window.matchMedia = vi.fn(() => matchMediaMock) as any

      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    it('should allow direct dark mode state updates via setDarkMode', async () => {
      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(false)
      })

      act(() => {
        result.current.setDarkMode(true)
      })

      expect(result.current.darkMode).toBe(true)
    })
  })

  describe('Language Toggle', () => {
    it('should toggle language when toggleLanguage is called', async () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current.language).toBe('pt')

      act(() => {
        result.current.toggleLanguage()
      })

      expect(result.current.language).toBe('en')

      act(() => {
        result.current.toggleLanguage()
      })

      expect(result.current.language).toBe('pt')
    })

    it('should allow direct language state updates via setLanguage', async () => {
      const { result } = renderHook(() => useTheme())

      expect(result.current.language).toBe('pt')

      act(() => {
        result.current.setLanguage('en')
      })

      expect(result.current.language).toBe('en')

      act(() => {
        result.current.setLanguage('pt')
      })

      expect(result.current.language).toBe('pt')
    })
  })

  describe('System Preference Changes', () => {
    it('should listen to system dark mode preference changes', async () => {
      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current.darkMode).toBe(false)
      })

      // Simulate system switching to dark mode
      act(() => {
        matchMediaMock.triggerChange(true)
      })

      await waitFor(() => {
        expect(result.current.darkMode).toBe(true)
      })

      // Simulate system switching back to light mode
      act(() => {
        matchMediaMock.triggerChange(false)
      })

      await waitFor(() => {
        expect(result.current.darkMode).toBe(false)
      })
    })

    it('should clean up media query listener on unmount', async () => {
      const { unmount } = renderHook(() => useTheme())

      expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))

      unmount()

      expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })
  })

  describe('Return Values', () => {
    it('should expose all expected functions and state', async () => {
      const { result } = renderHook(() => useTheme())

      await waitFor(() => {
        expect(result.current).toHaveProperty('darkMode')
        expect(result.current).toHaveProperty('language')
        expect(result.current).toHaveProperty('toggleDarkMode')
        expect(result.current).toHaveProperty('toggleLanguage')
        expect(result.current).toHaveProperty('setDarkMode')
        expect(result.current).toHaveProperty('setLanguage')
      })

      expect(typeof result.current.darkMode).toBe('boolean')
      expect(['pt', 'en']).toContain(result.current.language)
      expect(typeof result.current.toggleDarkMode).toBe('function')
      expect(typeof result.current.toggleLanguage).toBe('function')
      expect(typeof result.current.setDarkMode).toBe('function')
      expect(typeof result.current.setLanguage).toBe('function')
    })
  })
})
