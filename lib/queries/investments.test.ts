/**
 * Unit Tests for Investment Queries (Issue #114)
 *
 * Tests all TanStack Query hooks for the Investment feature to ensure 85% coverage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createWrapper, createTestQueryClient } from './test-utils'
import {
  useHoldings,
  useHolding,
  useCreateHolding,
  useUpdateHolding,
  useDeleteHolding,
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  usePrices,
  useRefreshPrices,
  useRecurringCosts,
  useCreateRecurringCost,
  useDeleteRecurringCost,
  useInvestmentReviews,
  useCreateInvestmentReview,
  useDeleteInvestmentReview,
} from './investments'

// Mock fetch globally
global.fetch = vi.fn()

const mockHolding = {
  id: '1',
  name: 'IWDA ETF',
  ticker: 'IWDA.AS',
  type: 'ETF',
  currency: 'EUR',
  totalUnits: 10,
  averageCost: 82.5,
  totalInvested: 825,
  currentPrice: 85.0,
  currentValue: 850,
  gainLoss: 25,
  gainLossPercent: 3.03,
  transactions: [],
}

const mockTransaction = {
  id: '1',
  holdingId: '1',
  type: 'BUY',
  units: 10,
  pricePerUnit: 82.5,
  fees: 0,
  date: new Date('2026-01-01'),
}

const mockRecurringCost = {
  id: '1',
  type: 'PLATFORM_FEE',
  amount: 2.5,
  frequency: 'MONTHLY',
  startDate: new Date('2026-01-01'),
  notes: 'Platform fee',
}

const mockInvestmentReview = {
  id: '1',
  date: new Date('2026-01-01'),
  reviewType: 'QUARTERLY',
  notes: 'Q1 2026 review',
  decisions: ['Hold IWDA'],
  attachedHoldings: ['1'],
}

describe('Investment Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  describe('useHoldings', () => {
    it('should fetch holdings successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockHolding],
      })

      const { result } = renderHook(() => useHoldings(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockHolding])
      expect(global.fetch).toHaveBeenCalledWith('/api/investments/holdings', {
        headers: expect.any(Object),
      })
    })

    it('should handle fetch error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const { result } = renderHook(() => useHoldings(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
    })
  })

  describe('useHolding', () => {
    it('should fetch single holding', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHolding,
      })

      const { result } = renderHook(() => useHolding('1'), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockHolding)
    })
  })

  describe('useCreateHolding', () => {
    it('should create holding successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHolding,
      })

      const queryClient = createTestQueryClient()
      const { result } = renderHook(() => useCreateHolding(), {
        wrapper: createWrapper(queryClient),
      })

      await result.current.mutateAsync({
        name: 'IWDA ETF',
        ticker: 'IWDA.AS',
        type: 'ETF',
        currency: 'EUR',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/holdings',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(String),
        })
      )
    })

    it('should handle create error with message', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Holding already exists' }),
      })

      const { result } = renderHook(() => useCreateHolding(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          name: 'IWDA ETF',
          type: 'ETF',
          currency: 'EUR',
        })
      ).rejects.toThrow('Holding already exists')
    })

    it('should handle create error without message', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useCreateHolding(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          name: 'IWDA ETF',
          type: 'ETF',
          currency: 'EUR',
        })
      ).rejects.toThrow('Failed to create holding')
    })
  })

  describe('useUpdateHolding', () => {
    it('should update holding successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHolding,
      })

      const { result } = renderHook(() => useUpdateHolding(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync({
        id: '1',
        name: 'IWDA ETF Updated',
        type: 'ETF',
        currency: 'EUR',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/holdings/1',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })

    it('should handle update error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not found' }),
      })

      const { result } = renderHook(() => useUpdateHolding(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          id: '1',
          name: 'Updated',
          type: 'ETF',
          currency: 'EUR',
        })
      ).rejects.toThrow('Not found')
    })
  })

  describe('useDeleteHolding', () => {
    it('should delete holding successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDeleteHolding(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync('1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/holdings/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should handle delete error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete' }),
      })

      const { result } = renderHook(() => useDeleteHolding(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow('Cannot delete')
    })
  })

  describe('useTransactions', () => {
    it('should fetch all transactions', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockTransaction],
      })

      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockTransaction])
    })

    it('should fetch transactions for specific holding', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockTransaction],
      })

      const { result } = renderHook(() => useTransactions('1'), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/transactions?holdingId=1',
        expect.any(Object)
      )
    })
  })

  describe('useCreateTransaction', () => {
    it('should create transaction successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      })

      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync({
        holdingId: '1',
        type: 'BUY',
        units: 10,
        pricePerUnit: 82.5,
        fees: 0,
        date: new Date('2026-01-01'),
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/transactions',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should handle create transaction error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid transaction' }),
      })

      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          holdingId: '1',
          type: 'BUY',
          units: 10,
          pricePerUnit: 82.5,
          fees: 0,
          date: new Date(),
        })
      ).rejects.toThrow('Invalid transaction')
    })
  })

  describe('useDeleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync('1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/transactions/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should handle delete transaction error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete transaction' }),
      })

      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow('Cannot delete transaction')
    })
  })

  describe('usePrices', () => {
    it('should fetch prices for tickers', async () => {
      const mockPrices = {
        'IWDA.AS': {
          ticker: 'IWDA.AS',
          price: 85.0,
          currency: 'EUR',
          change: 0.5,
          changePercent: 0.59,
          lastUpdated: new Date(),
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quotes: mockPrices }),
      })

      const { result } = renderHook(() => usePrices(['IWDA.AS']), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockPrices)
    })

    it('should not fetch if no tickers provided', () => {
      const { result } = renderHook(() => usePrices([]), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      expect(result.current.fetchStatus).toBe('idle')
    })
  })

  describe('useRefreshPrices', () => {
    it('should refresh prices successfully', async () => {
      const mockPrices = {
        quotes: {
          'IWDA.AS': { price: 85.5, ticker: 'IWDA.AS' },
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPrices,
      })

      const { result } = renderHook(() => useRefreshPrices(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync(['IWDA.AS'])

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('refresh=true'),
        expect.any(Object)
      )
    })
  })

  describe('useRecurringCosts', () => {
    it('should fetch recurring costs', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRecurringCost],
      })

      const { result } = renderHook(() => useRecurringCosts(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockRecurringCost])
    })
  })

  describe('useCreateRecurringCost', () => {
    it('should create recurring cost successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecurringCost,
      })

      const { result } = renderHook(() => useCreateRecurringCost(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync({
        type: 'PLATFORM_FEE',
        amount: 2.5,
        frequency: 'MONTHLY',
        startDate: new Date('2026-01-01'),
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/recurring-costs',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should handle create recurring cost error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid cost' }),
      })

      const { result } = renderHook(() => useCreateRecurringCost(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          type: 'PLATFORM_FEE',
          amount: 2.5,
          frequency: 'MONTHLY',
          startDate: new Date(),
        })
      ).rejects.toThrow('Invalid cost')
    })
  })

  describe('useDeleteRecurringCost', () => {
    it('should delete recurring cost successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDeleteRecurringCost(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync('1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/recurring-costs/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should handle delete recurring cost error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete cost' }),
      })

      const { result } = renderHook(() => useDeleteRecurringCost(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow('Cannot delete cost')
    })

    it('should handle delete recurring cost error with message field', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Cost is in use' }),
      })

      const { result } = renderHook(() => useDeleteRecurringCost(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow('Cost is in use')
    })

    it('should handle delete recurring cost error without error or message fields', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDeleteRecurringCost(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow(
        'Failed to delete recurring cost'
      )
    })
  })

  describe('useInvestmentReviews', () => {
    it('should fetch investment reviews', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockInvestmentReview],
      })

      const { result } = renderHook(() => useInvestmentReviews(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockInvestmentReview])
    })

    it('should handle fetch investment reviews error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      })

      const { result } = renderHook(() => useInvestmentReviews(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error).toEqual(new Error('Failed to fetch investment reviews'))
    })
  })

  describe('useCreateInvestmentReview', () => {
    it('should create investment review successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockInvestmentReview,
      })

      const { result } = renderHook(() => useCreateInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync({
        date: new Date('2026-01-01'),
        reviewType: 'QUARTERLY',
        notes: 'Q1 2026 review',
        decisions: ['Hold IWDA'],
        attachedHoldings: ['1'],
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/reviews',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('should handle create review error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid review' }),
      })

      const { result } = renderHook(() => useCreateInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          date: new Date(),
          reviewType: 'QUARTERLY',
          notes: 'Review',
          decisions: [],
          attachedHoldings: [],
        })
      ).rejects.toThrow('Invalid review')
    })

    it('should handle create review error with message field', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Review date is required' }),
      })

      const { result } = renderHook(() => useCreateInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          date: new Date(),
          reviewType: 'QUARTERLY',
          notes: 'Review',
          decisions: [],
          attachedHoldings: [],
        })
      ).rejects.toThrow('Review date is required')
    })

    it('should handle create review error without error or message fields', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useCreateInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(
        result.current.mutateAsync({
          date: new Date(),
          reviewType: 'QUARTERLY',
          notes: 'Review',
          decisions: [],
          attachedHoldings: [],
        })
      ).rejects.toThrow('Failed to create investment review')
    })
  })

  describe('useDeleteInvestmentReview', () => {
    it('should delete investment review successfully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDeleteInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await result.current.mutateAsync('1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/investments/reviews/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should handle delete review error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot delete review' }),
      })

      const { result } = renderHook(() => useDeleteInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow('Cannot delete review')
    })

    it('should handle delete review error with message field', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Review not found' }),
      })

      const { result } = renderHook(() => useDeleteInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow('Review not found')
    })

    it('should handle delete review error without error or message fields', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      const { result } = renderHook(() => useDeleteInvestmentReview(), {
        wrapper: createWrapper(createTestQueryClient()),
      })

      await expect(result.current.mutateAsync('1')).rejects.toThrow(
        'Failed to delete investment review'
      )
    })
  })
})
