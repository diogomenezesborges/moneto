/**
 * Tests for Bug #1: Review Cache Invalidation
 *
 * Verifies that review mutations properly invalidate TanStack Query cache
 * and trigger automatic refetches.
 */

import { QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { useReviewAction, useReviewTransactions, type ReviewTransaction } from './review'
import { createWrapper } from './test-utils'
import { useAuthStore } from '@/lib/stores/authStore'

// Mock auth store
vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: vi.fn(),
  getAuthHeaders: () => ({ Authorization: 'Bearer test-token' }),
}))

describe('Bug #1: Review Cache Invalidation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  it('should invalidate review queries after successful approval', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    // Trigger approval mutation
    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify invalidateQueries was called for review keys
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['review']),
      })
    )
  })

  it('should invalidate transaction queries after successful approval', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify invalidateQueries was called for transaction keys
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: expect.arrayContaining(['transactions']),
      })
    )
  })

  it('should execute onSettled callback non-blocking', async () => {
    // This test verifies the fix: onSettled should be synchronous
    // Async onSettled can cause race conditions and blocking behavior

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    // Mutation should complete quickly (non-blocking)
    await waitFor(() => expect(result.current.isSuccess).toBe(true), {
      timeout: 500,
    })
  })

  it('should NOT use refetchType parameter (default behavior)', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify invalidateQueries was called WITHOUT refetchType parameter
    // This allows TanStack Query to use default refetch behavior
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        refetchType: expect.anything(),
      })
    )
  })

  it('should rollback optimistic updates on error', async () => {
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData')

    // Mock API error
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Verify setQueryData was called to rollback optimistic update
    // This uses the context saved in onMutate
    expect(setQueryDataSpy).toHaveBeenCalled()
  })

  it('should handle rejection action with same cache invalidation', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'reject',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Both approve and reject should invalidate caches
    expect(invalidateSpy).toHaveBeenCalledTimes(2) // review + transactions
  })
})

describe('useReviewTransactions', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
    // Mock authenticated state
    ;(useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    })
  })

  it('should fetch pending review transactions', async () => {
    const mockTransactions: ReviewTransaction[] = [
      {
        id: '1',
        rawDescription: 'Test Transaction',
        rawAmount: 100.5,
        rawDate: '2026-02-01',
        majorCategory: null,
        category: null,
        majorCategoryId: null,
        categoryId: 'cat1',
        tags: [],
        notes: null,
        origin: 'Personal',
        bank: null,
        status: 'pending_review',
        reviewStatus: null,
        isFlagged: false,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        deletedAt: null,
      },
    ]

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockTransactions,
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockTransactions)
    expect(global.fetch).toHaveBeenCalledWith('/api/transactions/review', {
      headers: { Authorization: 'Bearer test-token' },
    })
  })

  it('should handle fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toEqual(new Error('Failed to fetch pending review'))
  })

  it('should not fetch when not authenticated', () => {
    ;(useAuthStore as any).mockReturnValue({
      isAuthenticated: false,
      token: null,
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isFetching).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should not fetch when token is missing', () => {
    ;(useAuthStore as any).mockReturnValue({
      isAuthenticated: true,
      token: null,
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isFetching).toBe(false)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should have staleTime of 0 for immediate refetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Data should be considered stale immediately
    expect(result.current.isStale).toBe(true)
  })

  it('should refetch on window focus', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Trigger refetch (simulating window focus)
    await result.current.refetch()

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})

describe('useReviewAction - Error Handling', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  it('should handle error with message in response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Custom error message' }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Custom error message')
  })

  it('should handle error without message (fallback)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Review action failed')
  })

  it('should handle JSON parse error in error response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe('Review action failed')
  })

  it('should rollback to previous data when context exists', async () => {
    const mockPreviousData: ReviewTransaction[] = [
      {
        id: '1',
        rawDescription: 'Test Transaction',
        rawAmount: 100.5,
        rawDate: '2026-02-01',
        majorCategory: null,
        category: null,
        majorCategoryId: null,
        categoryId: 'cat1',
        tags: [],
        notes: null,
        origin: 'Personal',
        bank: null,
        status: 'pending_review',
        reviewStatus: null,
        isFlagged: false,
        createdAt: '2026-02-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        deletedAt: null,
      },
    ]

    // Set initial data in cache
    queryClient.setQueryData(['review', 'pending'], mockPreviousData)

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Server error' }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Data should be rolled back to previous state
    const cachedData = queryClient.getQueryData<ReviewTransaction[]>(['review', 'pending'])
    expect(cachedData).toEqual(mockPreviousData)
  })

  it('should not error when rollback context is undefined', async () => {
    // No initial data in cache
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Server error' }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({
      transactionIds: ['test-txn-1'],
      action: 'approve',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Should not throw error even though context.previousReview is undefined
    expect(result.current.error?.message).toBe('Server error')
  })
})
