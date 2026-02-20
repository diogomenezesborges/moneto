import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock transaction data
type MockTransaction = Record<string, any>

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getUserFromRequest: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  createRequestLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    bindings: vi.fn(() => ({})),
  })),
}))

vi.mock('@/lib/error-handler', () => ({
  handleApiError: vi.fn((error: { statusCode?: number; message: string }) => {
    const status = error.statusCode || 500
    return new Response(JSON.stringify({ error: { message: error.message } }), { status })
  }),
}))

vi.mock('@/lib/errors', () => ({
  AuthenticationError: class AuthenticationError extends Error {
    statusCode = 401
    constructor() {
      super('Authentication required')
      this.name = 'AuthenticationError'
    }
  },
}))

import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

function mockTransactions(data: MockTransaction[]) {
  vi.mocked(prisma.transaction.findMany).mockResolvedValue(data as never)
}

describe('GET /api/stats/savings-trend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue(null)

    const request = new NextRequest('http://localhost:3000/api/stats/savings-trend')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return monthly savings rate data', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 'user-1' })

    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    mockTransactions([
      { rawAmount: 3000, rawDate: new Date() },
      { rawAmount: -1500, rawDate: new Date() },
      { rawAmount: -500, rawDate: new Date() },
    ])

    const request = new NextRequest('http://localhost:3000/api/stats/savings-trend')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(1)
    expect(data[0].month).toBe(thisMonth)
    expect(data[0].income).toBe(3000)
    expect(data[0].expenses).toBe(2000)
    // Savings rate: ((3000 - 2000) / 3000) * 100 = 33.33%
    expect(data[0].savingsRate).toBeCloseTo(33.33, 1)
  })

  it('should handle months with no income (savingsRate = 0)', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 'user-1' })

    mockTransactions([{ rawAmount: -500, rawDate: new Date() }])

    const request = new NextRequest('http://localhost:3000/api/stats/savings-trend')
    const response = await GET(request)
    const data = await response.json()

    expect(data[0].savingsRate).toBe(0)
    expect(data[0].income).toBe(0)
    expect(data[0].expenses).toBe(500)
  })

  it('should return data sorted by month', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 'user-1' })

    const jan = new Date(2026, 0, 15)
    const feb = new Date(2026, 1, 15)

    mockTransactions([
      { rawAmount: 2000, rawDate: feb },
      { rawAmount: 3000, rawDate: jan },
      { rawAmount: -1000, rawDate: jan },
      { rawAmount: -800, rawDate: feb },
    ])

    const request = new NextRequest('http://localhost:3000/api/stats/savings-trend')
    const response = await GET(request)
    const data = await response.json()

    expect(data.length).toBe(2)
    expect(data[0].month).toBe('2026-01')
    expect(data[1].month).toBe('2026-02')
  })

  it('should return empty array when no transactions', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 'user-1' })
    mockTransactions([])

    const request = new NextRequest('http://localhost:3000/api/stats/savings-trend')
    const response = await GET(request)
    const data = await response.json()

    expect(data).toEqual([])
  })

  it('should handle Decimal amounts from Prisma', async () => {
    vi.mocked(getUserFromRequest).mockReturnValue({ userId: 'user-1' })

    // Prisma Decimal objects have toString/valueOf
    const decimalAmount = { toString: () => '5000', valueOf: () => 5000 }

    mockTransactions([{ rawAmount: decimalAmount, rawDate: new Date() }])

    const request = new NextRequest('http://localhost:3000/api/stats/savings-trend')
    const response = await GET(request)
    const data = await response.json()

    expect(data[0].income).toBe(5000)
  })
})
