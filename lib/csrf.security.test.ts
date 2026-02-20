/**
 * Tests for Bug #10: CSRF Token Empty String Fallback
 *
 * Verifies that empty CSRF tokens are properly rejected at both
 * server-side validation and client-side helper functions.
 *
 * Security Issue: Empty strings could bypass CSRF protection if not
 * explicitly validated. This test ensures defense-in-depth.
 */

// Set required environment variables BEFORE importing csrf module
if (!process.env.CSRF_SECRET && !process.env.JWT_SECRET) {
  process.env.CSRF_SECRET = 'test-csrf-secret-minimum-32-characters-long-for-testing'
}

import { NextRequest } from 'next/server'
import {
  getCsrfTokenFromCookie,
  getCsrfTokenFromHeader,
  validateCsrfToken,
  generateCsrfToken,
} from './csrf'

describe('Bug #10: CSRF Token Security Hardening', () => {
  describe('getCsrfTokenFromHeader', () => {
    it('should reject empty string tokens', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': '',
        },
      })

      const token = getCsrfTokenFromHeader(request)
      expect(token).toBeNull()
    })

    it('should reject whitespace-only tokens', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': '   ',
        },
      })

      const token = getCsrfTokenFromHeader(request)
      expect(token).toBeNull()
    })

    it('should accept valid tokens', () => {
      const validToken = generateCsrfToken()
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': validToken,
        },
      })

      const token = getCsrfTokenFromHeader(request)
      expect(token).toBe(validToken)
    })

    it('should return null when header is missing', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      })

      const token = getCsrfTokenFromHeader(request)
      expect(token).toBeNull()
    })
  })

  describe('getCsrfTokenFromCookie', () => {
    it('should reject empty string cookies', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=',
        },
      })

      const token = getCsrfTokenFromCookie(request)
      expect(token).toBeNull()
    })

    it('should reject whitespace-only cookies', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=   ',
        },
      })

      const token = getCsrfTokenFromCookie(request)
      expect(token).toBeNull()
    })

    it('should accept valid cookie tokens', () => {
      const validToken = generateCsrfToken()
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: `csrf-token=${validToken}`,
        },
      })

      const token = getCsrfTokenFromCookie(request)
      expect(token).toBe(validToken)
    })

    it('should handle URL-encoded tokens correctly', () => {
      const validToken = generateCsrfToken()
      const encoded = encodeURIComponent(validToken)
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: `csrf-token=${encoded}`,
        },
      })

      const token = getCsrfTokenFromCookie(request)
      expect(token).toBe(validToken)
    })

    it('should reject empty string after URL decoding', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=%20%20%20', // URL-encoded spaces
        },
      })

      const token = getCsrfTokenFromCookie(request)
      expect(token).toBeNull()
    })
  })

  describe('validateCsrfToken (Integration)', () => {
    it('should reject request with empty header token', () => {
      const validToken = generateCsrfToken()
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: `csrf-token=${validToken}`,
          'x-csrf-token': '', // Empty header
        },
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing from header')
    })

    it('should reject request with empty cookie token', () => {
      const validToken = generateCsrfToken()
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=', // Empty cookie
          'x-csrf-token': validToken,
        },
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing from cookie')
    })

    it('should reject request with both empty tokens', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=',
          'x-csrf-token': '',
        },
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('CSRF token missing from cookie')
    })

    it('should accept request with valid matching tokens', () => {
      const validToken = generateCsrfToken()
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: `csrf-token=${validToken}`,
          'x-csrf-token': validToken,
        },
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should skip validation for GET requests', () => {
      // GET requests don't require CSRF tokens
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET',
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(true)
    })

    it('should skip validation for HEAD requests', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'HEAD',
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(true)
    })

    it('should skip validation for OPTIONS requests', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(true)
    })
  })

  describe('Defense in Depth', () => {
    it('should not allow whitespace-only tokens to bypass validation', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=   ',
          'x-csrf-token': '   ',
        },
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(false)
    })

    it('should handle tab characters as invalid tokens', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=\t\t',
          'x-csrf-token': '\t\t',
        },
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(false)
    })

    it('should handle newline characters as invalid tokens', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: 'csrf-token=\n',
          'x-csrf-token': '\n',
        },
      })

      const result = validateCsrfToken(request)
      expect(result.valid).toBe(false)
    })
  })
})
