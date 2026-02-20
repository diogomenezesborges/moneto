/**
 * Auth Store (Zustand)
 *
 * Authentication state management.
 * Handles token storage and user info.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  csrfToken: string | null
  isAuthenticated: boolean
  authChecked: boolean

  // Actions
  login: (user: User, token: string, csrfToken?: string) => void
  logout: () => void
  setAuthChecked: (checked: boolean) => void
  setCsrfToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      csrfToken: null,
      isAuthenticated: false,
      authChecked: false,

      login: (user, token, csrfToken) =>
        set({
          user,
          token,
          // Reject empty strings - only accept valid tokens or null
          csrfToken: csrfToken && csrfToken.trim() !== '' ? csrfToken : null,
          isAuthenticated: true,
          authChecked: true,
        }),

      logout: () => {
        // Clear localStorage tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('csrf-token')
        }
        set({
          user: null,
          token: null,
          csrfToken: null,
          isAuthenticated: false,
          authChecked: true,
        })
      },

      setAuthChecked: checked => set({ authChecked: checked }),

      // Reject empty strings - only accept valid tokens or null
      setCsrfToken: token => set({ csrfToken: token && token.trim() !== '' ? token : null }),
    }),
    {
      name: 'moneto-auth-store',
      // Only persist token - user info will be re-fetched on load
      partialize: state => ({
        token: state.token,
        csrfToken: state.csrfToken,
      }),
      onRehydrateStorage: () => state => {
        // After rehydration, if we have a token, verify it
        if (state?.token) {
          // Mark auth as not checked - will be verified on app load
          state.authChecked = false
        } else {
          state?.setAuthChecked(true)
        }
      },
    }
  )
)

/**
 * Helper to get auth headers for API calls
 * Only includes tokens if they are valid (non-empty strings)
 */
export function getAuthHeaders(): HeadersInit {
  const { token, csrfToken } = useAuthStore.getState()
  const headers: HeadersInit = {}

  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token}`
  }

  // SECURITY: Never send empty CSRF tokens - they should be null or valid strings
  if (csrfToken && csrfToken.trim() !== '') {
    headers['X-CSRF-Token'] = csrfToken
  }

  return headers
}
