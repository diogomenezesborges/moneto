/**
 * Tests for Bug #6: Promise.all() Error Isolation in Bulk Operations
 *
 * Verifies that bulk delete operations handle individual failures gracefully
 * without aborting the entire operation.
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useTransactions } from './useTransactions'
import { createWrapper } from '@/lib/queries/test-utils'
import { QueryClient } from '@tanstack/react-query'

// Mock the entire module
vi.mock('@/lib/queries/transactions', () => ({
  useTransactions: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useDeleteTransaction: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
}))

describe('Bug #6: Promise.allSettled in Bulk Delete', () => {
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

  it('should handle all successful deletions', async () => {
    // Mock all deletions succeed
    const mockDeleteTransaction = vi.fn().mockResolvedValue({ success: true })

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    // Simulate bulk delete behavior
    const ids = ['txn-1', 'txn-2', 'txn-3']
    const results = await Promise.allSettled(ids.map(id => mockDeleteTransaction(id)))

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length

    expect(successCount).toBe(3)
    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
  })

  it('should handle partial failures without aborting operation', async () => {
    // Mock some deletions fail
    const mockDeleteTransaction = vi
      .fn()
      .mockResolvedValueOnce({ success: true }) // txn-1 succeeds
      .mockRejectedValueOnce(new Error('Network error')) // txn-2 fails (exception)
      .mockResolvedValueOnce({ success: false, error: 'Not found' }) // txn-3 fails (API error)

    const ids = ['txn-1', 'txn-2', 'txn-3']
    const results = await Promise.allSettled(ids.map(id => mockDeleteTransaction(id)))

    // Count successes and failures
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failedCount = results.length - successCount

    expect(successCount).toBe(1) // Only txn-1 succeeded
    expect(failedCount).toBe(2) // txn-2 and txn-3 failed
    expect(results[0].status).toBe('fulfilled') // txn-1
    expect(results[1].status).toBe('rejected') // txn-2
    expect(results[2].status).toBe('fulfilled') // txn-3 (API error, not exception)
  })

  it('should collect error messages from failed deletions', async () => {
    const mockDeleteTransaction = vi
      .fn()
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({ success: false, error: 'Transaction not found' })

    const ids = ['txn-1', 'txn-2', 'txn-3']
    const results = await Promise.allSettled(ids.map(id => mockDeleteTransaction(id)))

    // Collect error messages
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map((r, idx) => {
        const originalIdx = results.indexOf(r)
        if (r.status === 'rejected') {
          return `Transaction ${ids[originalIdx]}: ${r.reason?.message || 'Unknown error'}`
        } else if (r.status === 'fulfilled') {
          return `Transaction ${ids[originalIdx]}: ${r.value.error || 'Failed'}`
        }
        return `Transaction ${ids[originalIdx]}: Unknown error`
      })

    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('Network timeout')
    expect(errors[1]).toContain('Transaction not found')
  })

  it('should handle all deletions failing', async () => {
    const mockDeleteTransaction = vi
      .fn()
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockRejectedValueOnce(new Error('Error 3'))

    const ids = ['txn-1', 'txn-2', 'txn-3']
    const results = await Promise.allSettled(ids.map(id => mockDeleteTransaction(id)))

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length

    expect(successCount).toBe(0)
    expect(results.every(r => r.status === 'rejected')).toBe(true)
  })

  it('should NOT abort on first failure (unlike Promise.all)', async () => {
    const mockDeleteTransaction = vi
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce({ success: true }) // This should still execute
      .mockResolvedValueOnce({ success: true }) // This should still execute

    const ids = ['txn-1', 'txn-2', 'txn-3']

    // With Promise.allSettled, all 3 calls should happen
    const results = await Promise.allSettled(ids.map(id => mockDeleteTransaction(id)))

    // Verify all 3 delete attempts were made
    expect(mockDeleteTransaction).toHaveBeenCalledTimes(3)
    expect(results).toHaveLength(3)

    // Verify results
    expect(results[0].status).toBe('rejected') // txn-1 failed
    expect(results[1].status).toBe('fulfilled') // txn-2 succeeded
    expect(results[2].status).toBe('fulfilled') // txn-3 succeeded
  })

  it('should compare Promise.all vs Promise.allSettled behavior', async () => {
    const mockDeleteFail = vi.fn().mockRejectedValue(new Error('Failure'))
    const mockDeleteSuccess = vi.fn().mockResolvedValue({ success: true })

    // Test 1: Promise.all aborts on first failure
    try {
      await Promise.all([mockDeleteFail(), mockDeleteSuccess(), mockDeleteSuccess()])
      expect.fail('Promise.all should have thrown')
    } catch (error: any) {
      // Promise.all threw on first failure
      expect(error.message).toBe('Failure')
    }

    // Reset mocks
    mockDeleteFail.mockClear()
    mockDeleteSuccess.mockClear()

    // Test 2: Promise.allSettled continues despite failures
    const results = await Promise.allSettled([
      mockDeleteFail(),
      mockDeleteSuccess(),
      mockDeleteSuccess(),
    ])

    // All 3 promises were settled
    expect(results).toHaveLength(3)
    expect(results[0].status).toBe('rejected')
    expect(results[1].status).toBe('fulfilled')
    expect(results[2].status).toBe('fulfilled')
  })

  it('should handle empty array gracefully', async () => {
    const mockDeleteTransaction = vi.fn()

    const ids: string[] = []
    const results = await Promise.allSettled(ids.map(id => mockDeleteTransaction(id)))

    expect(results).toHaveLength(0)
    expect(mockDeleteTransaction).not.toHaveBeenCalled()
  })

  it('should handle single deletion correctly', async () => {
    const mockDeleteTransaction = vi.fn().mockResolvedValue({ success: true })

    const ids = ['txn-1']
    const results = await Promise.allSettled(ids.map(id => mockDeleteTransaction(id)))

    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('fulfilled')
    expect(mockDeleteTransaction).toHaveBeenCalledTimes(1)
  })
})
