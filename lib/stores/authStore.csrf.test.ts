/**
 * Tests for Bug #10: AuthStore CSRF Token Validation
 *
 * Verifies that the authStore never stores empty strings as CSRF tokens
 * and that getAuthHeaders() properly validates tokens before including them.
 */

import { useAuthStore, getAuthHeaders } from './authStore'

describe('Bug #10: AuthStore CSRF Token Security', () => {
  beforeEach(() => {
    // Reset auth store before each test
    useAuthStore.setState({
      user: null,
      token: null,
      csrfToken: null,
      isAuthenticated: false,
      authChecked: false,
    })
  })

  describe('login()', () => {
    it('should reject empty string CSRF tokens', () => {
      const { login } = useAuthStore.getState()
      const user = { id: 'user-123', name: 'Test User', role: 'user' }

      login(user, 'valid-auth-token', '')

      const state = useAuthStore.getState()
      expect(state.csrfToken).toBeNull()
    })

    it('should reject whitespace-only CSRF tokens', () => {
      const { login } = useAuthStore.getState()
      const user = { id: 'user-123', name: 'Test User', role: 'user' }

      login(user, 'valid-auth-token', '   ')

      const state = useAuthStore.getState()
      expect(state.csrfToken).toBeNull()
    })

    it('should accept valid CSRF tokens', () => {
      const { login } = useAuthStore.getState()
      const user = { id: 'user-123', name: 'Test User', role: 'user' }
      const validToken = 'valid-csrf-token-12345'

      login(user, 'valid-auth-token', validToken)

      const state = useAuthStore.getState()
      expect(state.csrfToken).toBe(validToken)
    })

    it('should accept undefined CSRF tokens (set to null)', () => {
      const { login } = useAuthStore.getState()
      const user = { id: 'user-123', name: 'Test User', role: 'user' }

      login(user, 'valid-auth-token', undefined)

      const state = useAuthStore.getState()
      expect(state.csrfToken).toBeNull()
    })

    it('should trim whitespace before validation', () => {
      const { login } = useAuthStore.getState()
      const user = { id: 'user-123', name: 'Test User', role: 'user' }

      // Token with leading/trailing whitespace - should be accepted and stored as-is
      const tokenWithSpaces = '  valid-token  '
      login(user, 'valid-auth-token', tokenWithSpaces)

      const state = useAuthStore.getState()
      // Should store original token (with spaces) since it's not empty after trimming
      expect(state.csrfToken).toBe(tokenWithSpaces)
    })
  })

  describe('setCsrfToken()', () => {
    it('should reject empty string tokens', () => {
      const { setCsrfToken } = useAuthStore.getState()

      // First set a valid token
      setCsrfToken('valid-token')
      expect(useAuthStore.getState().csrfToken).toBe('valid-token')

      // Try to set empty string - should convert to null
      setCsrfToken('')
      expect(useAuthStore.getState().csrfToken).toBeNull()
    })

    it('should reject whitespace-only tokens', () => {
      const { setCsrfToken } = useAuthStore.getState()

      setCsrfToken('   ')
      expect(useAuthStore.getState().csrfToken).toBeNull()
    })

    it('should accept valid tokens', () => {
      const { setCsrfToken } = useAuthStore.getState()
      const validToken = 'new-csrf-token-67890'

      setCsrfToken(validToken)
      expect(useAuthStore.getState().csrfToken).toBe(validToken)
    })

    it('should handle token updates correctly', () => {
      const { setCsrfToken } = useAuthStore.getState()

      // Set initial token
      setCsrfToken('token-1')
      expect(useAuthStore.getState().csrfToken).toBe('token-1')

      // Update to new valid token
      setCsrfToken('token-2')
      expect(useAuthStore.getState().csrfToken).toBe('token-2')

      // Try to set empty (should clear to null)
      setCsrfToken('')
      expect(useAuthStore.getState().csrfToken).toBeNull()
    })
  })

  describe('getAuthHeaders()', () => {
    it('should not include CSRF header when token is empty string', () => {
      // Manually force an empty string (shouldn't be possible through normal APIs)
      useAuthStore.setState({
        token: 'valid-auth-token',
        csrfToken: '' as any, // Force empty string
      })

      const headers = getAuthHeaders() as Record<string, string>
      expect(headers['X-CSRF-Token']).toBeUndefined()
      expect(headers['Authorization']).toBe('Bearer valid-auth-token')
    })

    it('should not include CSRF header when token is whitespace-only', () => {
      useAuthStore.setState({
        token: 'valid-auth-token',
        csrfToken: '   ' as any,
      })

      const headers = getAuthHeaders() as Record<string, string>
      expect(headers['X-CSRF-Token']).toBeUndefined()
    })

    it('should include CSRF header when token is valid', () => {
      useAuthStore.setState({
        token: 'valid-auth-token',
        csrfToken: 'valid-csrf-token',
      })

      const headers = getAuthHeaders() as Record<string, string>
      expect(headers['X-CSRF-Token']).toBe('valid-csrf-token')
      expect(headers['Authorization']).toBe('Bearer valid-auth-token')
    })

    it('should not include CSRF header when token is null', () => {
      useAuthStore.setState({
        token: 'valid-auth-token',
        csrfToken: null,
      })

      const headers = getAuthHeaders() as Record<string, string>
      expect(headers['X-CSRF-Token']).toBeUndefined()
      expect(headers['Authorization']).toBe('Bearer valid-auth-token')
    })

    it('should not include auth header when token is empty', () => {
      useAuthStore.setState({
        token: '',
        csrfToken: 'valid-csrf-token',
      })

      const headers = getAuthHeaders() as Record<string, string>
      expect(headers['Authorization']).toBeUndefined()
      expect(headers['X-CSRF-Token']).toBe('valid-csrf-token')
    })

    it('should handle both tokens missing', () => {
      useAuthStore.setState({
        token: null,
        csrfToken: null,
      })

      const headers = getAuthHeaders() as Record<string, string>
      expect(headers['Authorization']).toBeUndefined()
      expect(headers['X-CSRF-Token']).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle logout correctly (clear CSRF token)', () => {
      const { login, logout } = useAuthStore.getState()
      const user = { id: 'user-123', name: 'Test User', role: 'user' }

      // Login with valid tokens
      login(user, 'auth-token', 'csrf-token')
      expect(useAuthStore.getState().csrfToken).toBe('csrf-token')

      // Logout
      logout()
      expect(useAuthStore.getState().csrfToken).toBeNull()
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('should handle special characters in CSRF tokens', () => {
      const { setCsrfToken } = useAuthStore.getState()
      const specialToken = 'token:with:colons:1234567890:abcdef'

      setCsrfToken(specialToken)
      expect(useAuthStore.getState().csrfToken).toBe(specialToken)

      const headers = getAuthHeaders() as Record<string, string>
      expect(headers['X-CSRF-Token']).toBe(specialToken)
    })

    it('should handle very long CSRF tokens', () => {
      const { setCsrfToken } = useAuthStore.getState()
      const longToken = 'a'.repeat(500)

      setCsrfToken(longToken)
      expect(useAuthStore.getState().csrfToken).toBe(longToken)
    })
  })
})
