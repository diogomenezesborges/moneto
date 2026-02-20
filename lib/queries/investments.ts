/**
 * Investment Tracking - TanStack Query Hooks
 *
 * React Query hooks for holdings and transactions data fetching and mutations.
 * Issue #108: Investment Tracking - Feature Structure
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/stores/authStore'
import type {
  HoldingWithStats,
  HoldingFormData,
  HoldingUpdateData,
  InvestmentTransaction,
  InvestmentTransactionWithHolding,
  TransactionFormData,
  PriceQuote,
  RecurringCost,
  RecurringCostFormData,
  InvestmentReview,
  InvestmentReviewFormData,
} from '@/app/features/investments/types'

// ============================================================================
// Query Keys
// ============================================================================

export const investmentKeys = {
  all: ['investments'] as const,
  holdings: () => [...investmentKeys.all, 'holdings'] as const,
  holding: (id: string) => [...investmentKeys.holdings(), id] as const,
  transactions: () => [...investmentKeys.all, 'transactions'] as const,
  holdingTransactions: (holdingId: string) =>
    [...investmentKeys.transactions(), 'holding', holdingId] as const,
  prices: (tickers: string[]) => [...investmentKeys.all, 'prices', tickers.join(',')] as const,
}

// ============================================================================
// Holdings Queries
// ============================================================================

/**
 * Fetch all holdings with calculated metrics
 */
export function useHoldings() {
  return useQuery({
    queryKey: investmentKeys.holdings(),
    queryFn: async (): Promise<HoldingWithStats[]> => {
      const res = await fetch('/api/investments/holdings', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch holdings')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch a single holding by ID
 */
export function useHolding(id: string) {
  return useQuery({
    queryKey: investmentKeys.holding(id),
    queryFn: async (): Promise<HoldingWithStats> => {
      const res = await fetch(`/api/investments/holdings/${id}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch holding')
      return res.json()
    },
    enabled: !!id,
  })
}

// ============================================================================
// Holdings Mutations
// ============================================================================

/**
 * Create a new holding
 */
export function useCreateHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: HoldingFormData) => {
      const res = await fetch('/api/investments/holdings', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to create holding')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() })
    },
  })
}

/**
 * Update an existing holding
 */
export function useUpdateHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: HoldingUpdateData) => {
      const { id, ...updateData } = data
      const res = await fetch(`/api/investments/holdings/${id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to update holding')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() })
      queryClient.invalidateQueries({ queryKey: investmentKeys.holding(variables.id) })
    },
  })
}

/**
 * Delete a holding (soft delete: sets isActive = false)
 */
export function useDeleteHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/holdings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to delete holding')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() })
    },
  })
}

// ============================================================================
// Transactions Queries
// ============================================================================

/**
 * Fetch all transactions (optionally filtered by holding)
 */
export function useTransactions(holdingId?: string) {
  return useQuery({
    queryKey: holdingId
      ? investmentKeys.holdingTransactions(holdingId)
      : investmentKeys.transactions(),
    queryFn: async (): Promise<InvestmentTransactionWithHolding[]> => {
      const url = holdingId
        ? `/api/investments/transactions?holdingId=${holdingId}`
        : '/api/investments/transactions'
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================================================
// Transactions Mutations
// ============================================================================

/**
 * Create a new investment transaction (BUY or SELL)
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const res = await fetch('/api/investments/transactions', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to create transaction')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate holdings (to recalculate metrics)
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() })
      queryClient.invalidateQueries({
        queryKey: investmentKeys.holding(variables.holdingId),
      })
      // Invalidate transactions
      queryClient.invalidateQueries({ queryKey: investmentKeys.transactions() })
      queryClient.invalidateQueries({
        queryKey: investmentKeys.holdingTransactions(variables.holdingId),
      })
    },
  })
}

/**
 * Delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to delete transaction')
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate all holdings and transactions to recalculate metrics
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() })
      queryClient.invalidateQueries({ queryKey: investmentKeys.transactions() })
    },
  })
}

// ============================================================================
// Price Service Queries
// ============================================================================

/**
 * Fetch current prices for multiple tickers
 */
export function usePrices(tickers: string[]) {
  return useQuery({
    queryKey: investmentKeys.prices(tickers),
    queryFn: async (): Promise<Record<string, PriceQuote>> => {
      const tickersParam = tickers.join(',')
      const res = await fetch(`/api/investments/prices?tickers=${tickersParam}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch prices')
      const data = await res.json()
      return data.quotes
    },
    enabled: tickers.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes (longer than price service cache)
  })
}

/**
 * Refresh prices for all holdings with tickers
 */
export function useRefreshPrices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tickers: string[]) => {
      const tickersParam = tickers.join(',')
      const res = await fetch(`/api/investments/prices?tickers=${tickersParam}&refresh=true`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to refresh prices')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
    },
  })
}

// ============================================================================
// Recurring Costs Queries (Cost Transparency)
// ============================================================================

/**
 * Fetch all recurring costs for the user
 */
export function useRecurringCosts() {
  return useQuery({
    queryKey: [...investmentKeys.all, 'recurring-costs'] as const,
    queryFn: async (): Promise<RecurringCost[]> => {
      const res = await fetch('/api/investments/recurring-costs', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch recurring costs')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Create a new recurring cost
 */
export function useCreateRecurringCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RecurringCostFormData) => {
      const res = await fetch('/api/investments/recurring-costs', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to create recurring cost')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...investmentKeys.all, 'recurring-costs'] })
      // Also invalidate holdings to recalculate cost impact
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() })
    },
  })
}

/**
 * Delete a recurring cost
 */
export function useDeleteRecurringCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/recurring-costs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to delete recurring cost')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...investmentKeys.all, 'recurring-costs'] })
      queryClient.invalidateQueries({ queryKey: investmentKeys.holdings() })
    },
  })
}

// ============================================================================
// Investment Reviews Queries (Decision Journal)
// ============================================================================

/**
 * Fetch all investment reviews for the user
 */
export function useInvestmentReviews() {
  return useQuery({
    queryKey: [...investmentKeys.all, 'reviews'] as const,
    queryFn: async (): Promise<InvestmentReview[]> => {
      const res = await fetch('/api/investments/reviews', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to fetch investment reviews')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Create a new investment review
 */
export function useCreateInvestmentReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InvestmentReviewFormData) => {
      const res = await fetch('/api/investments/reviews', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to create investment review')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...investmentKeys.all, 'reviews'] })
    },
  })
}

/**
 * Delete an investment review
 */
export function useDeleteInvestmentReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/investments/reviews/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to delete investment review')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...investmentKeys.all, 'reviews'] })
    },
  })
}
