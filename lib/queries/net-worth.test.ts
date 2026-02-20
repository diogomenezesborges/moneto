/**
 * Unit Tests for Net Worth Queries (Issue #198)
 *
 * Tests the TanStack Query hook and utility functions for net worth calculation.
 * Covers: successful fetch, error handling, trend calculation, edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper, createTestQueryClient } from './test-utils'
import { useNetWorth, calculateTrend, netWorthKeys } from './net-worth'
import type { NetWorthData, NetWorthHistoryPoint } from './net-worth'

// Mock fetch globally
global.fetch = vi.fn()

// Mock auth store so the query is enabled in tests
vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ isAuthenticated: true, token: 'test-token' })),
  getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
}))

const mockNetWorthData: NetWorthData = {
  accountBalances: 15000,
  investmentValue: 8500,
  netWorth: 23500,
  accounts: [
    {
      bank: 'Main Bank',
      origin: 'User 1',
      balance: 10000,
      lastTransactionDate: '2026-02-01T00:00:00.000Z',
    },
    {
      bank: 'Savings Bank',
      origin: 'User 2',
      balance: 5000,
      lastTransactionDate: '2026-01-28T00:00:00.000Z',
    },
  ],
  holdings: [
    {
      id: '1',
      name: 'IWDA ETF',
      type: 'ETF',
      currentValue: 8500,
      totalCost: 7500,
    },
  ],
  history: [
    {
      month: '2025-12',
      netWorth: 20000,
      accountBalances: 12000,
      investmentValue: 8000,
    },
    {
      month: '2026-01',
      netWorth: 22000,
      accountBalances: 14000,
      investmentValue: 8000,
    },
    {
      month: '2026-02',
      netWorth: 23500,
      accountBalances: 15000,
      investmentValue: 8500,
    },
  ],
}

describe('Net Worth Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  // ============================================================================
  // Query Keys
  // ============================================================================

  describe('netWorthKeys', () => {
    it('should have correct all key', () => {
      expect(netWorthKeys.all).toEqual(['net-worth'])
    })

    it('should have correct current key', () => {
      expect(netWorthKeys.current()).toEqual(['net-worth', 'current'])
    })
  })

  // ============================================================================
  // useNetWorth Hook
  // ============================================================================

  describe('useNetWorth', () => {
    it('should fetch net worth data successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockNetWorthData,
      })

      const { result } = renderHook(() => useNetWorth(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockNetWorthData)
      expect(global.fetch).toHaveBeenCalledWith('/api/net-worth', {
        headers: expect.any(Object),
      })
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useNetWorth(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toEqual(new Error('Failed to fetch net worth data'))
    })

    it('should handle network error', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useNetWorth(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  // ============================================================================
  // calculateTrend
  // ============================================================================

  describe('calculateTrend', () => {
    it('should return null for empty history', () => {
      expect(calculateTrend([])).toBeNull()
    })

    it('should return null for single data point', () => {
      const history: NetWorthHistoryPoint[] = [
        { month: '2026-01', netWorth: 10000, accountBalances: 10000, investmentValue: 0 },
      ]
      expect(calculateTrend(history)).toBeNull()
    })

    it('should calculate upward trend correctly', () => {
      const history: NetWorthHistoryPoint[] = [
        { month: '2026-01', netWorth: 10000, accountBalances: 10000, investmentValue: 0 },
        { month: '2026-02', netWorth: 12000, accountBalances: 12000, investmentValue: 0 },
      ]

      const trend = calculateTrend(history)
      expect(trend).not.toBeNull()
      expect(trend!.change).toBe(2000)
      expect(trend!.changePercent).toBe(20)
      expect(trend!.direction).toBe('up')
    })

    it('should calculate downward trend correctly', () => {
      const history: NetWorthHistoryPoint[] = [
        { month: '2026-01', netWorth: 10000, accountBalances: 10000, investmentValue: 0 },
        { month: '2026-02', netWorth: 8000, accountBalances: 8000, investmentValue: 0 },
      ]

      const trend = calculateTrend(history)
      expect(trend).not.toBeNull()
      expect(trend!.change).toBe(-2000)
      expect(trend!.changePercent).toBe(-20)
      expect(trend!.direction).toBe('down')
    })

    it('should calculate neutral trend (no change)', () => {
      const history: NetWorthHistoryPoint[] = [
        { month: '2026-01', netWorth: 10000, accountBalances: 10000, investmentValue: 0 },
        { month: '2026-02', netWorth: 10000, accountBalances: 10000, investmentValue: 0 },
      ]

      const trend = calculateTrend(history)
      expect(trend).not.toBeNull()
      expect(trend!.change).toBe(0)
      expect(trend!.changePercent).toBe(0)
      expect(trend!.direction).toBe('neutral')
    })

    it('should handle negative net worth correctly', () => {
      const history: NetWorthHistoryPoint[] = [
        { month: '2026-01', netWorth: -5000, accountBalances: -5000, investmentValue: 0 },
        { month: '2026-02', netWorth: -3000, accountBalances: -3000, investmentValue: 0 },
      ]

      const trend = calculateTrend(history)
      expect(trend).not.toBeNull()
      expect(trend!.change).toBe(2000)
      expect(trend!.changePercent).toBe(40) // 2000 / |-5000| * 100
      expect(trend!.direction).toBe('up')
    })

    it('should handle zero previous net worth', () => {
      const history: NetWorthHistoryPoint[] = [
        { month: '2026-01', netWorth: 0, accountBalances: 0, investmentValue: 0 },
        { month: '2026-02', netWorth: 5000, accountBalances: 5000, investmentValue: 0 },
      ]

      const trend = calculateTrend(history)
      expect(trend).not.toBeNull()
      expect(trend!.change).toBe(5000)
      expect(trend!.changePercent).toBe(0) // Cannot divide by zero
      expect(trend!.direction).toBe('up')
    })

    it('should use last two entries from longer history', () => {
      const trend = calculateTrend(mockNetWorthData.history)
      expect(trend).not.toBeNull()
      expect(trend!.change).toBe(1500) // 23500 - 22000
      expect(trend!.direction).toBe('up')
    })

    it('should handle transition from positive to negative net worth', () => {
      const history: NetWorthHistoryPoint[] = [
        { month: '2026-01', netWorth: 2000, accountBalances: 2000, investmentValue: 0 },
        { month: '2026-02', netWorth: -1000, accountBalances: -1000, investmentValue: 0 },
      ]

      const trend = calculateTrend(history)
      expect(trend).not.toBeNull()
      expect(trend!.change).toBe(-3000)
      expect(trend!.changePercent).toBe(-150) // -3000 / |2000| * 100
      expect(trend!.direction).toBe('down')
    })
  })
})
