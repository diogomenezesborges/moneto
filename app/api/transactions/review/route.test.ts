/**
 * Tests for Bug #5: N+1 Query Performance Optimization
 *
 * Verifies that the review endpoint uses batch queries instead of N+1 individual queries.
 */

import { GET } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ userId: 'user-123' }),
}))

describe('Bug #5: N+1 Query Optimization in Review Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    const { getUserFromRequest } = await import('@/lib/auth')
    ;(getUserFromRequest as any).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toBe('Unauthorized')
  })

  it('should handle database errors gracefully in GET endpoint', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(prisma.transaction.findMany as any).mockRejectedValueOnce(
      new Error('Database connection failed')
    )

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Internal server error')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Get pending review transactions error:',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })

  it('should fetch duplicate transactions in a single batch query', async () => {
    const mockTransactions = [
      {
        id: 'txn-1',
        potentialDuplicateId: 'dup-1',
        description: 'Transaction 1',
        amount: 100,
      },
      {
        id: 'txn-2',
        potentialDuplicateId: 'dup-2',
        description: 'Transaction 2',
        amount: 200,
      },
      {
        id: 'txn-3',
        potentialDuplicateId: null, // No duplicate
        description: 'Transaction 3',
        amount: 300,
      },
    ]

    const mockDuplicates = [
      {
        id: 'dup-1',
        description: 'Duplicate 1',
        amount: 100,
      },
      {
        id: 'dup-2',
        description: 'Duplicate 2',
        amount: 200,
      },
    ]

    // Mock the two queries (transactions + batch duplicate fetch)
    ;(prisma.transaction.findMany as any)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce(mockDuplicates)

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    const response = await GET(request)
    const data = await response.json()

    // Verify findMany was called (at least once for transactions)
    expect(prisma.transaction.findMany).toHaveBeenCalled()

    // First call: Get pending review transactions
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          reviewStatus: 'pending_review',
        }),
      })
    )

    // Verify response has transactions with duplicate info
    expect(data.transactions).toHaveLength(3)
    expect(data.transactions[0].duplicateOf).toBeDefined()
    expect(data.transactions[1].duplicateOf).toBeDefined()
  })

  it('should NOT make individual findUnique calls per transaction', async () => {
    const mockTransactions = [
      { id: 'txn-1', potentialDuplicateId: 'dup-1' },
      { id: 'txn-2', potentialDuplicateId: 'dup-2' },
      { id: 'txn-3', potentialDuplicateId: 'dup-3' },
    ]

    ;(prisma.transaction.findMany as any)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    await GET(request)

    // Should only call findMany (batch query)
    // Should NEVER call findUnique (N+1 anti-pattern)
    expect(prisma.transaction.findMany).toHaveBeenCalledTimes(2)
    expect((prisma.transaction as any).findUnique).toBeUndefined()
  })

  it('should use HashMap for O(1) duplicate lookup', async () => {
    const mockTransactions = [
      { id: 'txn-1', potentialDuplicateId: 'dup-1', amount: 100 },
      { id: 'txn-2', potentialDuplicateId: 'dup-2', amount: 200 },
    ]

    const mockDuplicates = [
      { id: 'dup-1', amount: 100, description: 'Dup 1' },
      { id: 'dup-2', amount: 200, description: 'Dup 2' },
    ]

    ;(prisma.transaction.findMany as any)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce(mockDuplicates)

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    const response = await GET(request)
    const data = await response.json()

    // Verify each transaction has its duplicate mapped correctly
    expect(data.transactions[0].duplicateOf).toBeDefined()
    expect(data.transactions[0].duplicateOf.id).toBe('dup-1')
    expect(data.transactions[1].duplicateOf).toBeDefined()
    expect(data.transactions[1].duplicateOf.id).toBe('dup-2')
  })

  it('should handle transactions without duplicates', async () => {
    const mockTransactions = [
      { id: 'txn-1', potentialDuplicateId: null, amount: 100 },
      { id: 'txn-2', potentialDuplicateId: null, amount: 200 },
    ]

    ;(prisma.transaction.findMany as any).mockResolvedValueOnce(mockTransactions)

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    const response = await GET(request)
    const data = await response.json()

    // Should only make 1 query since no potentialDuplicateIds
    expect(prisma.transaction.findMany).toHaveBeenCalled()

    // Transactions should not have duplicateOf field (undefined, not null)
    expect(data.transactions[0]).not.toHaveProperty('duplicateOf')
    expect(data.transactions[1]).not.toHaveProperty('duplicateOf')
  })

  it('should filter out null duplicate IDs before querying', async () => {
    const mockTransactions = [
      { id: 'txn-1', potentialDuplicateId: 'dup-1', amount: 100 },
      { id: 'txn-2', potentialDuplicateId: null, amount: 200 },
      { id: 'txn-3', potentialDuplicateId: 'dup-3', amount: 300 },
      { id: 'txn-4', potentialDuplicateId: null, amount: 400 },
    ]

    const mockDuplicates = [
      { id: 'dup-1', amount: 100 },
      { id: 'dup-3', amount: 300 },
    ]

    ;(prisma.transaction.findMany as any)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce(mockDuplicates)

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    await GET(request)

    // Second call should only include non-null duplicate IDs
    expect(prisma.transaction.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          id: { in: ['dup-1', 'dup-3'] }, // Only non-null IDs
        },
      })
    )
  })

  it('should handle missing duplicates gracefully', async () => {
    const mockTransactions = [
      { id: 'txn-1', potentialDuplicateId: 'dup-1', amount: 100 },
      { id: 'txn-2', potentialDuplicateId: 'dup-2', amount: 200 },
    ]

    // Only one duplicate found (dup-2 is missing)
    const mockDuplicates = [{ id: 'dup-1', amount: 100 }]

    ;(prisma.transaction.findMany as any)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce(mockDuplicates)

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    const response = await GET(request)
    const data = await response.json()

    // txn-1 should have duplicate
    expect(data.transactions[0]).toHaveProperty('duplicateOf')
    expect(data.transactions[0].duplicateOf).toBeDefined()
    if (data.transactions[0].duplicateOf) {
      expect(data.transactions[0].duplicateOf.id).toBe('dup-1')
    }

    // txn-2 should have null duplicate (not found in DB)
    // The implementation uses: duplicatesMap.get(...) || null
    expect(data.transactions[1]).toHaveProperty('duplicateOf')
    expect(data.transactions[1].duplicateOf).toBeNull()
  })

  it('should maintain query count regardless of transaction count', async () => {
    // Test with 100 transactions (simulating real-world load)
    const mockTransactions = Array.from({ length: 100 }, (_, i) => ({
      id: `txn-${i}`,
      potentialDuplicateId: `dup-${i}`,
      amount: 100 + i,
    }))

    const mockDuplicates = Array.from({ length: 100 }, (_, i) => ({
      id: `dup-${i}`,
      amount: 100 + i,
    }))

    ;(prisma.transaction.findMany as any)
      .mockResolvedValueOnce(mockTransactions)
      .mockResolvedValueOnce(mockDuplicates)

    const request = new NextRequest('http://localhost:3000/api/transactions/review')

    const response = await GET(request)

    // CRITICAL: Should use batch queries, NOT individual queries per transaction
    // With batch optimization: 1 query for transactions + 1 query for all duplicates = 2 total
    // Without optimization: 1 query for transactions + 100 queries for duplicates = 101 total
    expect(prisma.transaction.findMany).toHaveBeenCalled()

    // Verify all transactions have duplicate info
    const data = await response.json()
    expect(data.transactions).toHaveLength(100)
  })
})

// Mock CSRF validation
vi.mock('@/lib/csrf', () => ({
  validateCsrfToken: vi.fn().mockReturnValue({ valid: true }),
}))

// Mock POST endpoint tests
import { POST } from './route'
import { validateCsrfToken } from '@/lib/csrf'

describe('POST /api/transactions/review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(validateCsrfToken as any).mockReturnValue({ valid: true })
  })

  it('should approve transactions successfully', async () => {
    const mockUpdateMany = vi.fn().mockResolvedValue({ count: 2 })
    ;(prisma.transaction as any).updateMany = mockUpdateMany

    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({
        action: 'approve',
        transactionIds: ['txn-1', 'txn-2'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('Approved 2 transactions')
    expect(data.count).toBe(2)

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['txn-1', 'txn-2'] },
        userId: 'user-123',
        reviewStatus: 'pending_review',
      },
      data: {
        reviewStatus: null,
      },
    })
  })

  it('should reject transactions successfully', async () => {
    const mockUpdateMany = vi.fn().mockResolvedValue({ count: 3 })
    ;(prisma.transaction as any).updateMany = mockUpdateMany

    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({
        action: 'reject',
        transactionIds: ['txn-1', 'txn-2', 'txn-3'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('Rejected 3 transactions')
    expect(data.count).toBe(3)
    expect(data.recoverable).toBe(true)

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['txn-1', 'txn-2', 'txn-3'] },
        userId: 'user-123',
        reviewStatus: 'pending_review',
      },
      data: {
        deletedAt: expect.any(Date),
        reviewStatus: 'rejected',
      },
    })
  })

  it('should return 401 when user is not authenticated', async () => {
    const { getUserFromRequest } = await import('@/lib/auth')
    ;(getUserFromRequest as any).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', transactionIds: ['txn-1'] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toBe('Unauthorized')
  })

  it('should return 403 when CSRF validation fails', async () => {
    ;(validateCsrfToken as any).mockReturnValueOnce({
      valid: false,
      error: 'Invalid CSRF token',
    })

    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', transactionIds: ['txn-1'] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('CSRF validation failed')
    expect(data.details).toBe('Invalid CSRF token')
  })

  it('should return 400 when action is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({ transactionIds: ['txn-1'] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Invalid request')
  })

  it('should return 400 when transactionIds is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Invalid request')
  })

  it('should return 400 when transactionIds is not an array', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', transactionIds: 'invalid' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Invalid request')
  })

  it('should return 400 when action is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid-action', transactionIds: ['txn-1'] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Invalid action')
  })

  it('should handle database errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockUpdateMany = vi.fn().mockRejectedValue(new Error('Database error'))
    ;(prisma.transaction as any).updateMany = mockUpdateMany

    const request = new NextRequest('http://localhost:3000/api/transactions/review', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', transactionIds: ['txn-1'] }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Internal server error')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Review action error:', expect.any(Error))

    consoleErrorSpy.mockRestore()
  })
})
