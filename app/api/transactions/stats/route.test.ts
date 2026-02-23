/**
 * Tests for Bug #8: Stats Endpoint Memory Optimization
 *
 * Verifies that stats calculation uses database aggregation
 * instead of loading all transactions into memory.
 */

import { GET } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn().mockResolvedValue({ userId: 'user-123' }),
}))

describe('Bug #8: Stats Endpoint Memory Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should use database aggregation instead of findMany', async () => {
    // Mock aggregation responses
    ;(prisma.transaction.count as any).mockResolvedValue(100)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: 50000 } }) // Income
      .mockResolvedValueOnce({ _sum: { rawAmount: -30000 } }) // Expenses
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([
        { majorCategory: 'Alimentação', _sum: { rawAmount: -5000 } },
        { majorCategory: 'Transporte', _sum: { rawAmount: -3000 } },
      ]) // Category groups
      .mockResolvedValueOnce([
        { origin: 'Personal', _sum: { rawAmount: 25000 } },
        { origin: 'Joint', _sum: { rawAmount: 25000 } },
      ]) // Origin groups
      .mockResolvedValueOnce([
        { status: 'finalized', _count: { status: 90 } },
        { status: 'pending', _count: { status: 10 } },
      ]) // Status counts
    ;(prisma.$queryRaw as any).mockResolvedValue([
      { month: '2026-01', income: 25000, expenses: 15000 },
      { month: '2026-02', income: 25000, expenses: 15000 },
    ])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    const response = await GET(request)
    const data = await response.json()

    // CRITICAL: Should NOT use findMany (memory inefficient)
    expect(prisma.transaction.findMany).not.toHaveBeenCalled()

    // CRITICAL: Should use count for total transactions
    expect(prisma.transaction.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-123',
          deletedAt: null,
        }),
      })
    )

    // CRITICAL: Should use aggregate for income/expenses
    expect(prisma.transaction.aggregate).toHaveBeenCalledTimes(2)

    // CRITICAL: Should use groupBy for category/origin/status
    expect(prisma.transaction.groupBy).toHaveBeenCalledTimes(3)

    // CRITICAL: Should use raw query for monthly aggregation
    expect(prisma.$queryRaw).toHaveBeenCalled()

    // Verify response structure
    expect(data).toEqual({
      totalIncome: 50000,
      totalExpenses: 30000,
      netBalance: 20000,
      totalTransactions: 100,
      byCategory: {
        Alimentação: -5000,
        Transporte: -3000,
      },
      byOrigin: {
        Personal: 25000,
        Joint: 25000,
      },
      byMonth: {
        '2026-01': { income: 25000, expenses: 15000 },
        '2026-02': { income: 25000, expenses: 15000 },
      },
      statusCounts: {
        finalized: 90,
        pending: 10,
      },
    })
  })

  it('should handle user with no transactions', async () => {
    ;(prisma.transaction.count as any).mockResolvedValue(0)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: null } })
      .mockResolvedValueOnce({ _sum: { rawAmount: null } })
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    ;(prisma.$queryRaw as any).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      totalTransactions: 0,
      byCategory: {},
      byOrigin: {},
      byMonth: {},
      statusCounts: {},
    })
  })

  it('should handle only income transactions', async () => {
    ;(prisma.transaction.count as any).mockResolvedValue(10)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: 10000 } }) // Income
      .mockResolvedValueOnce({ _sum: { rawAmount: null } }) // No expenses
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ origin: 'Personal', _sum: { rawAmount: 10000 } }])
      .mockResolvedValueOnce([{ status: 'finalized', _count: { status: 10 } }])
    ;(prisma.$queryRaw as any).mockResolvedValue([{ month: '2026-01', income: 10000, expenses: 0 }])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(data.totalIncome).toBe(10000)
    expect(data.totalExpenses).toBe(0)
    expect(data.netBalance).toBe(10000)
  })

  it('should handle only expense transactions', async () => {
    ;(prisma.transaction.count as any).mockResolvedValue(10)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: null } }) // No income
      .mockResolvedValueOnce({ _sum: { rawAmount: -8000 } }) // Expenses
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([{ majorCategory: 'Alimentação', _sum: { rawAmount: -8000 } }])
      .mockResolvedValueOnce([{ origin: 'Joint', _sum: { rawAmount: -8000 } }])
      .mockResolvedValueOnce([{ status: 'finalized', _count: { status: 10 } }])
    ;(prisma.$queryRaw as any).mockResolvedValue([{ month: '2026-01', income: 0, expenses: 8000 }])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(data.totalIncome).toBe(0)
    expect(data.totalExpenses).toBe(8000)
    expect(data.netBalance).toBe(-8000)
  })

  it('should filter out soft-deleted transactions', async () => {
    ;(prisma.transaction.count as any).mockResolvedValue(50)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: 5000 } })
      .mockResolvedValueOnce({ _sum: { rawAmount: -3000 } })
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    ;(prisma.$queryRaw as any).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    await GET(request)

    // Verify all queries exclude deletedAt: null
    expect(prisma.transaction.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )

    expect(prisma.transaction.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )

    expect(prisma.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )
  })

  it('should run aggregations in parallel for performance', async () => {
    const startTime = Date.now()

    // Mock all responses with slight delays
    ;(prisma.transaction.count as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(100), 50))
    )
    ;(prisma.transaction.aggregate as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ _sum: { rawAmount: 1000 } }), 50))
    )
    ;(prisma.transaction.groupBy as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 50))
    )
    ;(prisma.$queryRaw as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 50))
    )

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    await GET(request)

    const duration = Date.now() - startTime

    // If queries ran sequentially, duration would be ~350ms (7 queries × 50ms)
    // With Promise.all, duration should be ~50-100ms (parallel execution)
    expect(duration).toBeLessThan(200)
  })

  it('should handle null category names correctly', async () => {
    ;(prisma.transaction.count as any).mockResolvedValue(5)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: 1000 } })
      .mockResolvedValueOnce({ _sum: { rawAmount: -500 } })
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([
        { majorCategory: 'Alimentação', _sum: { rawAmount: -300 } },
        { majorCategory: null, _sum: { rawAmount: -200 } }, // Uncategorized
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    ;(prisma.$queryRaw as any).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    const response = await GET(request)
    const data = await response.json()

    // Null categories should be filtered out
    expect(data.byCategory).toEqual({
      Alimentação: -300,
      // null should NOT appear in the result
    })
  })

  it('should calculate net balance correctly', async () => {
    ;(prisma.transaction.count as any).mockResolvedValue(20)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: 100000 } }) // Income
      .mockResolvedValueOnce({ _sum: { rawAmount: -75000 } }) // Expenses
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    ;(prisma.$queryRaw as any).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(data.totalIncome).toBe(100000)
    expect(data.totalExpenses).toBe(75000) // Absolute value
    expect(data.netBalance).toBe(25000) // 100000 - 75000
  })

  it('should handle multiple months correctly', async () => {
    ;(prisma.transaction.count as any).mockResolvedValue(100)
    ;(prisma.transaction.aggregate as any)
      .mockResolvedValueOnce({ _sum: { rawAmount: 10000 } })
      .mockResolvedValueOnce({ _sum: { rawAmount: -6000 } })
    ;(prisma.transaction.groupBy as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    ;(prisma.$queryRaw as any).mockResolvedValue([
      { month: '2025-12', income: 3000, expenses: 2000 },
      { month: '2026-01', income: 4000, expenses: 2500 },
      { month: '2026-02', income: 3000, expenses: 1500 },
    ])

    const request = new NextRequest('http://localhost:3000/api/transactions/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(Object.keys(data.byMonth)).toHaveLength(3)
    expect(data.byMonth['2026-01']).toEqual({ income: 4000, expenses: 2500 })
  })
})
