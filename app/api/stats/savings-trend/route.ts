import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError } from '@/lib/errors'

export interface SavingsTrendPoint {
  month: string
  savingsRate: number
  income: number
  expenses: number
}

/**
 * GET /api/stats/savings-trend
 *
 * Returns monthly savings rate data for the last 12 months.
 * Savings Rate = ((income - expenses) / income) * 100
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = getUserFromRequest(request)
    if (!user) {
      throw new AuthenticationError()
    }

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        deletedAt: null,
        rawDate: { gte: twelveMonthsAgo },
      },
      select: {
        rawAmount: true,
        rawDate: true,
      },
      orderBy: { rawDate: 'asc' },
    })

    // Group by month
    const monthlyData: Record<string, { income: number; expenses: number }> = {}

    for (const t of transactions) {
      const date = new Date(t.rawDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 }
      }

      const amount = typeof t.rawAmount === 'object' ? Number(t.rawAmount) : t.rawAmount

      if (amount > 0) {
        monthlyData[monthKey].income += amount
      } else {
        monthlyData[monthKey].expenses += Math.abs(amount)
      }
    }

    // Convert to sorted array with savings rate
    const trend: SavingsTrendPoint[] = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        savingsRate:
          data.income > 0
            ? Math.round(((data.income - data.expenses) / data.income) * 10000) / 100
            : 0,
      }))

    return NextResponse.json(trend)
  } catch (error) {
    return handleApiError(error, log)
  }
}
