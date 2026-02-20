/**
 * Stats Queries Tests
 *
 * Tests for stats and cash flow query hooks.
 */

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { useStats, useCashFlow, statsKeys } from './stats'
import { useAuthStore } from '@/lib/stores/authStore'
import { createWrapper } from './test-utils'

// Mock authStore
vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: vi.fn(),
  getAuthHeaders: vi.fn(() => ({
    Authorization: 'Bearer mock-token',
    'Content-Type': 'application/json',
  })),
}))

// Mock fetch
global.fetch = vi.fn()

describe('Stats Queries', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      token: 'mock-token',
    })
  })

  describe('statsKeys', () => {
    it('should generate correct query keys', () => {
      expect(statsKeys.all).toEqual(['stats'])
      expect(statsKeys.summary()).toEqual(['stats', 'summary'])
      expect(statsKeys.cashFlow({ period: '1m' })).toEqual(['stats', 'cashFlow', { period: '1m' }])
    })
  })

  describe('useStats', () => {
    it('should fetch stats successfully', async () => {
      const mockStats = {
        totalIncome: 5000,
        totalExpenses: 3000,
        netBalance: 2000,
        totalTransactions: 150,
        byCategory: { Food: 1000, Transport: 500 },
        byOrigin: { 'Bank A': 2000, 'Bank B': 1000 },
        byMonth: {
          '2025-01': { income: 2500, expenses: 1500 },
          '2025-02': { income: 2500, expenses: 1500 },
        },
        statusCounts: { APPROVED: 140, PENDING: 10 },
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      })

      const { result } = renderHook(() => useStats(), { wrapper: createWrapper(queryClient) })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockStats)
      expect(global.fetch).toHaveBeenCalledWith('/api/transactions/stats', {
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
      })
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useStats(), { wrapper: createWrapper(queryClient) })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe('Failed to fetch stats')
    })

    it('should not fetch when not authenticated', () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        token: null,
      })

      const { result } = renderHook(() => useStats(), { wrapper: createWrapper(queryClient) })

      expect(result.current.isPending).toBe(true)
      expect(result.current.fetchStatus).toBe('idle')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should not fetch when token is missing', () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        token: null,
      })

      const { result } = renderHook(() => useStats(), { wrapper: createWrapper(queryClient) })

      expect(result.current.isPending).toBe(true)
      expect(result.current.fetchStatus).toBe('idle')
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('useCashFlow', () => {
    it('should fetch cash flow data successfully', async () => {
      const mockCashFlow = {
        period: '1m',
        totalIncome: 5000,
        totalExpenses: 3000,
        nodes: [
          { id: 'income', label: 'Income', amount: 5000, level: 0 },
          { id: 'food', label: 'Food', amount: 1000, level: 1 },
        ],
        links: [{ source: 'income', target: 'food', value: 1000 }],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCashFlow,
      })

      const { result } = renderHook(() => useCashFlow({ period: '1m' }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCashFlow)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/transactions/cash-flow?period=1m',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('should include all filter parameters in URL', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nodes: [], links: [] }),
      })

      const filters = {
        period: '3m',
        dateFrom: '2025-01-01',
        dateTo: '2025-03-31',
        level: 'major' as const,
        origin: 'bank-a',
        bank: 'bank-a',
        majorCategory: 'Food',
        category: 'Groceries',
      }

      renderHook(() => useCashFlow(filters), { wrapper: createWrapper(queryClient) })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(fetchCall).toContain('period=3m')
      expect(fetchCall).toContain('dateFrom=2025-01-01')
      expect(fetchCall).toContain('dateTo=2025-03-31')
      expect(fetchCall).toContain('level=major')
      expect(fetchCall).toContain('origin=bank-a')
      expect(fetchCall).toContain('bank=bank-a')
      expect(fetchCall).toContain('majorCategory=Food')
      expect(fetchCall).toContain('category=Groceries')
    })

    it('should exclude "all" values from filter parameters', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nodes: [], links: [] }),
      })

      const filters = {
        origin: 'all',
        bank: 'all',
        majorCategory: 'all',
        category: 'all',
      }

      renderHook(() => useCashFlow(filters), { wrapper: createWrapper(queryClient) })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(fetchCall).not.toContain('origin=')
      expect(fetchCall).not.toContain('bank=')
      expect(fetchCall).not.toContain('majorCategory=')
      expect(fetchCall).not.toContain('category=')
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useCashFlow({ period: '1m' }), {
        wrapper: createWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect((result.current.error as Error).message).toBe('Failed to fetch cash flow')
    })

    it('should not fetch when not authenticated', () => {
      ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        token: null,
      })

      const { result } = renderHook(() => useCashFlow(), { wrapper: createWrapper(queryClient) })

      expect(result.current.isPending).toBe(true)
      expect(result.current.fetchStatus).toBe('idle')
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should use empty filters by default', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nodes: [], links: [] }),
      })

      renderHook(() => useCashFlow(), { wrapper: createWrapper(queryClient) })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(fetchCall).toBe('/api/transactions/cash-flow?')
    })
  })
})
