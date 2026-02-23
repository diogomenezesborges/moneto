import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const whereClause = {
      userId: user.userId,
      deletedAt: null, // Exclude soft-deleted transactions
    }

    // PERFORMANCE FIX: Use database aggregation instead of loading all transactions into memory
    // This reduces memory usage from O(n) to O(1) and leverages database indexing

    // Run all aggregations in parallel for better performance
    const [
      totalTransactions,
      incomeAggregate,
      expensesAggregate,
      categoryGroups,
      originGroups,
      statusCounts,
      monthlyData,
    ] = await Promise.all([
      // Total transaction count
      prisma.transaction.count({ where: whereClause }),

      // Total income (rawAmount > 0)
      prisma.transaction.aggregate({
        where: { ...whereClause, rawAmount: { gt: 0 } },
        _sum: { rawAmount: true },
      }),

      // Total expenses (rawAmount < 0)
      prisma.transaction.aggregate({
        where: { ...whereClause, rawAmount: { lt: 0 } },
        _sum: { rawAmount: true },
      }),

      // Group by major category
      prisma.transaction.groupBy({
        by: ['majorCategory'],
        where: whereClause,
        _sum: { rawAmount: true },
      }),

      // Group by origin
      prisma.transaction.groupBy({
        by: ['origin'],
        where: whereClause,
        _sum: { rawAmount: true },
      }),

      // Group by status
      prisma.transaction.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true },
      }),

      // For monthly aggregation, we need to fetch rawDate and rawAmount
      // Unfortunately Prisma doesn't support date extraction in groupBy yet,
      // so we use a raw query for this specific aggregation
      prisma.$queryRaw<Array<{ month: string; income: number; expenses: number }>>`
        SELECT
          TO_CHAR("rawDate", 'YYYY-MM') as month,
          COALESCE(SUM(CASE WHEN "rawAmount" > 0 THEN "rawAmount" ELSE 0 END), 0)::float as income,
          COALESCE(SUM(CASE WHEN "rawAmount" < 0 THEN ABS("rawAmount") ELSE 0 END), 0)::float as expenses
        FROM "Transaction"
        WHERE "userId" = ${user.userId}
          AND "deletedAt" IS NULL
        GROUP BY TO_CHAR("rawDate", 'YYYY-MM')
        ORDER BY month ASC
      `,
    ])

    // Process aggregated results
    const totalIncome = incomeAggregate._sum.rawAmount || 0
    const totalExpenses = Math.abs(expensesAggregate._sum.rawAmount || 0)

    // Convert category groups to record
    const byCategory = categoryGroups.reduce(
      (acc, item) => {
        if (item.majorCategory) {
          acc[item.majorCategory] = item._sum.rawAmount || 0
        }
        return acc
      },
      {} as Record<string, number>
    )

    // Convert origin groups to record
    const byOrigin = originGroups.reduce(
      (acc, item) => {
        acc[item.origin] = item._sum.rawAmount || 0
        return acc
      },
      {} as Record<string, number>
    )

    // Convert monthly data to record
    const byMonth = monthlyData.reduce(
      (acc, item) => {
        acc[item.month] = {
          income: item.income,
          expenses: item.expenses,
        }
        return acc
      },
      {} as Record<string, { income: number; expenses: number }>
    )

    // Convert status counts to record
    const statusCountsRecord = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status
        return acc
      },
      {} as Record<string, number>
    )

    const stats = {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      totalTransactions,
      byCategory,
      byOrigin,
      byMonth,
      statusCounts: statusCountsRecord,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
