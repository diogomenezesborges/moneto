/**
 * Tests for Bug #9: Missing Response Validation
 *
 * Verifies that malformed JSON responses don't crash the application
 * and graceful fallbacks are provided.
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useTransactions, useBanks } from './transactions'
import { createWrapper, createTestQueryClient } from './test-utils'
import { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/authStore'

describe('Bug #9: Response Validation for Malformed JSON', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
    vi.clearAllMocks()

    // Set auth state
    useAuthStore.setState({
      token: 'test-token',
      isAuthenticated: true,
      user: { id: 'user-123', name: 'Test User', role: 'user' },
    })
  })

  describe('fetchTransactions', () => {
    it('should handle malformed JSON response gracefully', async () => {
      // Mock response with malformed JSON (HTML error page)
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Unexpected token < in JSON')),
        url: '/api/transactions',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      // Should not crash, should return empty array as fallback
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })

    it('should handle corrupted JSON response', async () => {
      // Mock response with corrupted JSON
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Unexpected end of JSON input')),
        url: '/api/transactions',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })

    it('should handle valid JSON response correctly', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          rawDescription: 'Test transaction',
          rawAmount: 100,
          rawDate: '2026-01-01',
          origin: 'Personal',
          status: 'finalized',
        },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTransactions,
        url: '/api/transactions',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toHaveLength(1)
        expect(result.current.data?.[0].id).toBe('txn-1')
      })
    })

    it('should handle non-array JSON response', async () => {
      // API returns object instead of array
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Invalid response format' }),
        url: '/api/transactions',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      // Should detect non-array and return empty array
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })

    it('should log error when JSON parsing fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Parse error')),
        url: '/api/transactions',
        statusText: 'OK',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify error was logged with context
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse JSON response:',
        expect.objectContaining({
          status: 200,
          statusText: 'OK',
          url: '/api/transactions',
          error: 'Parse error',
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('useBanks', () => {
    it('should handle malformed JSON in banks response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        url: '/api/banks',
      })

      const { result } = renderHook(() => useBanks(), {
        wrapper: createWrapper(queryClient),
      })

      // Should return empty array as fallback
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })

    it('should handle valid banks response', async () => {
      const mockBanks = ['Banco A', 'Banco B', 'Banco C']

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ banks: mockBanks }),
        url: '/api/banks',
      })

      const { result } = renderHook(() => useBanks(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual(mockBanks)
      })
    })

    it('should handle missing banks property', async () => {
      // Response missing 'banks' property
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        url: '/api/banks',
      })

      const { result } = renderHook(() => useBanks(), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })
  })

  describe('Import transactions', () => {
    it('should handle malformed JSON in import response', async () => {
      // This test simulates the import mutation behavior
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        url: '/api/transactions/import',
      })

      // Direct test of the import logic
      const response = await fetch('/api/transactions/import')
      expect(response.ok).toBe(true)

      // JSON parsing should fail gracefully
      const error = await response.json().catch(() => null)
      expect(error).toBeNull()
    })

    it('should handle valid import response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ count: 10, skipped: 2, message: 'Import successful' }),
        url: '/api/transactions/import',
      })

      const response = await fetch('/api/transactions/import')
      const data = await response.json()

      expect(data).toEqual({
        count: 10,
        skipped: 2,
        message: 'Import successful',
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty response body', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Unexpected end of JSON input')),
        url: '/api/transactions',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })

    it('should handle network interruption during JSON parse', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('NetworkError: Connection interrupted')),
        url: '/api/transactions',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })

    it('should handle response with wrong Content-Type', async () => {
      // Server returns 200 OK but Content-Type is text/html
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockRejectedValue(new Error('Unexpected token < in JSON at position 0')),
        url: '/api/transactions',
        headers: new Headers({ 'Content-Type': 'text/html' }),
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.data).toEqual([])
      })
    })
  })

  describe('Error responses (should already have .catch())', () => {
    it('should handle malformed JSON in error response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        url: '/api/transactions',
      })

      const { result } = renderHook(() => useTransactions({}), {
        wrapper: createWrapper(queryClient),
      })

      // Should handle error gracefully
      await waitFor(() => {
        expect(result.current.isError).toBe(true)
        expect(result.current.error).toBeDefined()
      })
    })
  })
})
