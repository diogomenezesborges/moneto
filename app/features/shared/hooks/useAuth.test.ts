/**
 * Tests for useAuth Hook
 *
 * Tests authentication state management and localStorage persistence.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from './useAuth'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useAuth', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('Initial State', () => {
    it('should initialize with unauthenticated state', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      expect(result.current.auth.isAuthenticated).toBe(false)
      expect(result.current.auth.user).toBeNull()
      expect(result.current.auth.token).toBeNull()
    })

    it('should eventually set authChecked to true after mount', async () => {
      const { result } = renderHook(() => useAuth())

      // Note: renderHook runs effects synchronously, so authChecked is already true
      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })
    })
  })

  describe('Login', () => {
    it('should update auth state when login is called', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      const mockUser = {
        id: 'user-1',
        name: 'TestUser',
        pinHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockToken = 'test-token-123'

      act(() => {
        result.current.login(mockUser, mockToken)
      })

      expect(result.current.auth.isAuthenticated).toBe(true)
      expect(result.current.auth.user).toEqual(mockUser)
      expect(result.current.auth.token).toBe(mockToken)
    })

    it('should persist auth to localStorage after login', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      const mockUser = {
        id: 'user-1',
        name: 'TestUser',
        pinHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const mockToken = 'test-token-123'

      act(() => {
        result.current.login(mockUser, mockToken)
      })

      await waitFor(() => {
        const stored = localStorage.getItem('auth')
        expect(stored).toBeTruthy()

        const parsed = JSON.parse(stored!)
        expect(parsed.isAuthenticated).toBe(true)
        expect(parsed.token).toBe(mockToken)
        expect(parsed.user.id).toBe('user-1')
      })
    })
  })

  describe('Logout', () => {
    it('should clear auth state when logout is called', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      const mockUser = {
        id: 'user-1',
        name: 'TestUser',
        pinHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      act(() => {
        result.current.login(mockUser, 'test-token')
      })

      await waitFor(() => {
        expect(result.current.auth.isAuthenticated).toBe(true)
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.auth.isAuthenticated).toBe(false)
      expect(result.current.auth.user).toBeNull()
      expect(result.current.auth.token).toBeNull()
    })

    it('should remove auth from localStorage after logout', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      const mockUser = {
        id: 'user-1',
        name: 'TestUser',
        pinHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      act(() => {
        result.current.login(mockUser, 'test-token')
      })

      await waitFor(() => {
        expect(localStorage.getItem('auth')).toBeTruthy()
      })

      act(() => {
        result.current.logout()
      })

      await waitFor(() => {
        expect(localStorage.getItem('auth')).toBeNull()
      })
    })
  })

  describe('localStorage Persistence', () => {
    it('should load auth from localStorage on mount', async () => {
      const mockAuth = {
        isAuthenticated: true,
        user: {
          id: 'user-1',
          name: 'TestUser',
          pinHash: 'hash',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'stored-token',
      }

      localStorage.setItem('auth', JSON.stringify(mockAuth))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
        expect(result.current.auth.isAuthenticated).toBe(true)
        expect(result.current.auth.token).toBe('stored-token')
        expect(result.current.auth.user?.id).toBe('user-1')
      })
    })

    it('should handle malformed localStorage data gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      localStorage.setItem('auth', 'invalid-json')

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      expect(result.current.auth.isAuthenticated).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse stored auth:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })

    it('should not persist unauthenticated state to localStorage', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      // Unauthenticated state should not be in localStorage
      expect(result.current.auth.isAuthenticated).toBe(false)
      expect(localStorage.getItem('auth')).toBeNull()
    })
  })

  describe('setAuth', () => {
    it('should allow direct auth state updates', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.authChecked).toBe(true)
      })

      const mockAuth = {
        isAuthenticated: true,
        user: {
          id: 'user-2',
          name: 'SecondUser',
          pinHash: 'hash2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'direct-token',
      }

      act(() => {
        result.current.setAuth(mockAuth)
      })

      expect(result.current.auth).toEqual(mockAuth)
    })
  })
})
