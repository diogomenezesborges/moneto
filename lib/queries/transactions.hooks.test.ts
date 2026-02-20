/**
 * Tests for Transaction Query Hooks
 *
 * Comprehensive tests for all TanStack Query hooks in lib/queries/transactions.ts
 * Ensures 85%+ coverage for critical transaction management functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { createWrapper } from './test-utils'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useBulkDeleteTransactions,
  useTrashTransactions,
  useRestoreTransaction,
  usePermanentDelete,
  useImportTransactions,
  useReviewTransactions,
  useReviewAction,
  useCashFlowData,
  useBanks,
  transactionKeys,
  type Transaction,
  type TransactionFilters,
  type TransactionUpdate,
  type TransactionCreateInput,
  type CashFlowFilters,
  type CashFlowData,
  type Bank,
} from './transactions'
import { useAuthStore } from '@/lib/stores/authStore'

// Mock auth store
vi.mock('@/lib/stores/authStore', () => ({
  useAuthStore: vi.fn(),
  getAuthHeaders: vi.fn(() => ({
    Authorization: 'Bearer test-token',
    'X-CSRF-Token': 'test-csrf-token',
  })),
}))

// Mock file parser
vi.mock('@/lib/parsers', () => ({
  parseFile: vi.fn(async () => ({
    transactions: [
      {
        date: '2024-01-01',
        description: 'Test Transaction',
        amount: -100,
        bank: 'Test Bank',
      },
    ],
  })),
}))

const mockTransaction: Transaction = {
  id: 'txn-1',
  rawDescription: 'Test Transaction',
  rawAmount: -100,
  rawDate: '2024-01-01',
  majorCategory: 'Food',
  category: 'Groceries',
  majorCategoryId: 'cat-1',
  categoryId: 'subcat-1',
  tags: ['tag1', 'tag2'],
  notes: 'Test note',
  origin: 'Personal',
  bank: 'Main Bank',
  status: 'categorized',
  reviewStatus: null,
  isFlagged: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
}

describe('Transaction Query Keys', () => {
  it('should generate correct query keys', () => {
    expect(transactionKeys.all).toEqual(['transactions'])
    expect(transactionKeys.lists()).toEqual(['transactions', 'list'])
    expect(transactionKeys.details()).toEqual(['transactions', 'detail'])
    expect(transactionKeys.stats()).toEqual(['transactions', 'stats'])
    expect(transactionKeys.review()).toEqual(['transactions', 'review'])
    expect(transactionKeys.trash()).toEqual(['transactions', 'trash'])
  })

  it('should generate list key with filters', () => {
    const filters: TransactionFilters = { origin: 'Personal', bank: 'Main Bank' }
    expect(transactionKeys.list(filters)).toEqual(['transactions', 'list', filters])
  })

  it('should generate detail key with id', () => {
    expect(transactionKeys.detail('txn-1')).toEqual(['transactions', 'detail', 'txn-1'])
  })
})

describe('useTransactions', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should fetch transactions with default filters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockTransaction],
    })

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([mockTransaction])
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions?',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should fetch transactions with filters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockTransaction],
    })

    const filters: TransactionFilters = {
      origin: 'Personal',
      bank: 'Main Bank',
      period: '2024-01',
      majorCategory: 'Food',
    }

    const { result } = renderHook(() => useTransactions(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const calledUrl = (global.fetch as any).mock.calls[0][0]
    expect(calledUrl).toContain('origin=Personal')
    expect(calledUrl).toContain('bank=Main Bank')
    expect(calledUrl).toContain('period=2024-01')
    expect(calledUrl).toContain('majorCategory=Food')
  })

  it('should not fetch when not authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
    } as any)

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
  })

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to fetch' }),
    })

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('should handle malformed JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Malformed JSON')
      },
      status: 200,
      statusText: 'OK',
      url: '/api/transactions',
    })

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Should return empty array fallback
    expect(result.current.data).toEqual([])
  })

  it('should skip filters with "all" value', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockTransaction],
    })

    const filters: TransactionFilters = {
      origin: 'all',
      bank: 'all',
      majorCategory: 'all',
    }

    const { result } = renderHook(() => useTransactions(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const calledUrl = (global.fetch as any).mock.calls[0][0]
    expect(calledUrl).not.toContain('origin=')
    expect(calledUrl).not.toContain('bank=')
    expect(calledUrl).not.toContain('majorCategory=')
  })
})

describe('useCreateTransaction', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should create a transaction', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1 }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createWrapper(queryClient),
    })

    const input: TransactionCreateInput = {
      rawDate: new Date('2024-01-01'),
      rawDescription: 'New Transaction',
      rawAmount: -50,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategoryId: 'cat-1',
      categoryId: 'subcat-1',
      tags: ['test'],
      notes: 'Test note',
    }

    result.current.mutate(input)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"description":"New Transaction"'),
      })
    )

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all })
  })

  it('should handle string date', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1 }),
    })

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createWrapper(),
    })

    const input: TransactionCreateInput = {
      rawDate: '2024-01-01',
      rawDescription: 'New Transaction',
      rawAmount: -50,
    }

    result.current.mutate(input)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('should handle create errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to create' }),
    })

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createWrapper(),
    })

    const input: TransactionCreateInput = {
      rawDescription: 'New Transaction',
      rawAmount: -50,
    }

    result.current.mutate(input)

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateTransaction', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should update a transaction', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockTransaction, notes: 'Updated note' }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateTransaction(), {
      wrapper: createWrapper(queryClient),
    })

    const update: TransactionUpdate = {
      id: 'txn-1',
      notes: 'Updated note',
      tags: ['new-tag'],
    }

    result.current.mutate(update)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"notes":"Updated note"'),
      })
    )

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all })
  })

  it('should handle update errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to update' }),
    })

    const { result } = renderHook(() => useUpdateTransaction(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: 'txn-1', notes: 'Updated' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useDeleteTransaction', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should soft delete a transaction', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Transaction deleted', recoverable: true }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ id: 'txn-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'DELETE',
        body: expect.stringContaining('"permanent":false'),
      })
    )

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all })
  })

  it('should permanently delete a transaction', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Transaction permanently deleted' }),
    })

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: 'txn-1', permanent: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        body: expect.stringContaining('"permanent":true'),
      })
    )
  })

  it('should handle delete errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to delete' }),
    })

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: 'txn-1' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useBulkDeleteTransactions', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should bulk delete transactions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: '3 transactions deleted' }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useBulkDeleteTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ ids: ['txn-1', 'txn-2', 'txn-3'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions',
      expect.objectContaining({
        method: 'DELETE',
        body: expect.stringContaining('"ids":["txn-1","txn-2","txn-3"]'),
      })
    )

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all })
  })

  it('should handle bulk delete errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to delete' }),
    })

    const { result } = renderHook(() => useBulkDeleteTransactions(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ ids: ['txn-1', 'txn-2'] })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useTrashTransactions', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should fetch trashed transactions', async () => {
    const trashedTransaction = { ...mockTransaction, deletedAt: '2024-01-02T00:00:00Z' }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [trashedTransaction],
    })

    const { result } = renderHook(() => useTrashTransactions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([trashedTransaction])
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions/trash',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should not fetch when not authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
    } as any)

    const { result } = renderHook(() => useTrashTransactions(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
  })

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    const { result } = renderHook(() => useTrashTransactions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useRestoreTransaction', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should restore a transaction from trash', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Transaction restored' }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRestoreTransaction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('txn-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions/restore',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"id":"txn-1"'),
      })
    )

    // Should invalidate both trash and all transactions
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.trash() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all })
  })

  it('should handle restore errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to restore' }),
    })

    const { result } = renderHook(() => useRestoreTransaction(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('txn-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('usePermanentDelete', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should permanently delete a transaction from trash', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Transaction permanently deleted' }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => usePermanentDelete(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate('txn-1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions/permanent',
      expect.objectContaining({
        method: 'DELETE',
        body: expect.stringContaining('"id":"txn-1"'),
      })
    )

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.trash() })
  })

  it('should handle permanent delete errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to delete' }),
    })

    const { result } = renderHook(() => usePermanentDelete(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('txn-1')

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useImportTransactions', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should import transactions from file', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 1, skipped: 0, message: 'Imported 1 transaction' }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useImportTransactions(), {
      wrapper: createWrapper(queryClient),
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })

    result.current.mutate({ file, origin: 'Personal', bank: 'Main Bank' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      imported: 1,
      duplicates: 0,
      message: 'Imported 1 transaction',
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all })
  })

  it('should handle malformed JSON response during import', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Malformed JSON')
      },
      status: 200,
      statusText: 'OK',
      url: '/api/transactions',
    })

    const { result } = renderHook(() => useImportTransactions(), {
      wrapper: createWrapper(),
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })

    result.current.mutate({ file, origin: 'Personal' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Should return fallback values
    expect(result.current.data).toEqual({
      imported: 0,
      duplicates: 0,
      message: undefined,
    })
  })

  it('should handle import errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to import' }),
    })

    const { result } = renderHook(() => useImportTransactions(), {
      wrapper: createWrapper(),
    })

    const file = new File(['test'], 'test.csv', { type: 'text/csv' })

    result.current.mutate({ file, origin: 'Personal' })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useReviewTransactions', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should fetch review transactions', async () => {
    const reviewTransaction = { ...mockTransaction, reviewStatus: 'pending_review' }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [reviewTransaction],
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([reviewTransaction])
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions/review',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should not fetch when not authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
    } as any)

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
  })

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    const { result } = renderHook(() => useReviewTransactions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useReviewAction', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should approve review transactions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Transactions approved' }),
    })

    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ action: 'approve', transactionIds: ['txn-1', 'txn-2'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions/review',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"approve"'),
      })
    )

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.review() })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: transactionKeys.all })
  })

  it('should reject review transactions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Transactions rejected' }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ action: 'reject', transactionIds: ['txn-1'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/transactions/review',
      expect.objectContaining({
        body: expect.stringContaining('"action":"reject"'),
      })
    )
  })

  it('should handle review action errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Failed to approve' }),
    })

    const { result } = renderHook(() => useReviewAction(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ action: 'approve', transactionIds: ['txn-1'] })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCashFlowData', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should fetch cash flow data', async () => {
    const cashFlowData: CashFlowData = {
      period: '2024-01',
      totalIncome: 5000,
      totalExpenses: 3000,
      nodes: [
        { id: 'income', label: 'Income', amount: 5000, level: 0 },
        { id: 'expenses', label: 'Expenses', amount: 3000, level: 1 },
      ],
      links: [{ source: 'income', target: 'expenses', value: 3000 }],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => cashFlowData,
    })

    const filters: CashFlowFilters = {
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      level: 'category',
    }

    const { result } = renderHook(() => useCashFlowData(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(cashFlowData)

    const calledUrl = (global.fetch as any).mock.calls[0][0]
    expect(calledUrl).toContain('dateFrom=2024-01-01')
    expect(calledUrl).toContain('dateTo=2024-01-31')
    expect(calledUrl).toContain('level=category')
  })

  it('should not fetch when dates are missing', async () => {
    const filters: CashFlowFilters = {
      dateFrom: '',
      dateTo: '',
    }

    const { result } = renderHook(() => useCashFlowData(filters), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
  })

  it('should include optional filters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ period: '2024-01', nodes: [], links: [] }),
    })

    const filters: CashFlowFilters = {
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Food',
    }

    const { result } = renderHook(() => useCashFlowData(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const calledUrl = (global.fetch as any).mock.calls[0][0]
    expect(calledUrl).toContain('origin=Personal')
    expect(calledUrl).toContain('bank=Main Bank')
    expect(calledUrl).toContain('majorCategory=Food')
  })

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    const filters: CashFlowFilters = {
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
    }

    const { result } = renderHook(() => useCashFlowData(filters), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useBanks', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      token: 'test-token',
    } as any)
  })

  it('should fetch banks', async () => {
    const banks: Bank[] = [
      { id: 'bank-1', name: 'Main Bank' },
      { id: 'bank-2', name: 'Other Bank' },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ banks }),
    })

    const { result } = renderHook(() => useBanks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(banks)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/banks',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should handle malformed JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('Malformed JSON')
      },
      status: 200,
      statusText: 'OK',
      url: '/api/banks',
    })

    const { result } = renderHook(() => useBanks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Should return empty array fallback
    expect(result.current.data).toEqual([])
  })

  it('should not fetch when not authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      token: null,
    } as any)

    const { result } = renderHook(() => useBanks(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
  })

  it('should handle fetch errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    const { result } = renderHook(() => useBanks(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
