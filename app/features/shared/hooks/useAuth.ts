/**
 * useAuth Hook
 *
 * Manages authentication state and localStorage persistence.
 */

import { useState, useEffect } from 'react'
import type { AuthState } from '../types'

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  })
  const [authChecked, setAuthChecked] = useState(false)

  // Check for stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAuth(parsed)
      } catch (e) {
        console.error('Failed to parse stored auth:', e)
      }
    }
    setAuthChecked(true)
  }, [])

  // Persist auth to localStorage
  useEffect(() => {
    if (authChecked) {
      if (auth.isAuthenticated) {
        localStorage.setItem('auth', JSON.stringify(auth))
      } else {
        localStorage.removeItem('auth')
      }
    }
  }, [auth, authChecked])

  const login = (user: AuthState['user'], token: string) => {
    setAuth({
      isAuthenticated: true,
      user,
      token,
    })
  }

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null,
    })
    localStorage.removeItem('auth')
  }

  return {
    auth,
    authChecked,
    login,
    logout,
    setAuth,
  }
}
