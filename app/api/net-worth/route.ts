import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError } from '@/lib/errors'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Net Worth Calculation
 *
 * Net Worth = Account Balances (latest rawBalance per bank/origin) + Investment Value - Liabilities
 *
 * Data sources:
 * - Bank account balances: Latest rawBalance from transactions per bank/origin
 * - Investment holdings: Current value from holdings (units * price)
 *
 * Issue #198: Net Worth Calculation and Tracking
 */

export interface NetWorthBreakdown {
  /** Sum of latest bank account balances */
  accountBalances: number
  /** Sum of investment current values */
  investmentValue: number
  /** Total net worth */
  netWorth: number
  /** Per-account breakdown */
  accounts: Array<{
    bank: string
    origin: string
    balance: number
    lastTransactionDate: string
  }>
  /** Per-holding breakdown */
  holdings: Array<{
    id: string
    name: string
    type: string
    currentValue: number | null
    totalCost: number
  }>
  /** Monthly snapshots for historical tracking */
  history: Array<{
    month: string
    netWorth: number
    accountBalances: number
    investmentValue: number
  }>
}

/**
 * GET /api/net-worth
 * Calculate and return the current net worth and historical data
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized GET request to net-worth')
      throw new AuthenticationError()
    }

    // Run queries in parallel for performance
    const [latestBalances, holdingsData, monthlyBalances] = await Promise.all([
      // 1. Get the latest balance per bank+origin combination
      // Uses a subquery to find the most recent transaction with a balance for each account
      prisma.$queryRaw<
        Array<{
          bank: string
          origin: string
          balance: number
          last_date: Date
        }>
      >`
        SELECT DISTINCT ON (t.bank, t.origin)
          t.bank,
          t.origin,
          t."rawBalance"::float as balance,
          t."rawDate" as last_date
        FROM "transactions" t
        WHERE t."userId" = ${user.userId}
          AND t."deletedAt" IS NULL
          AND t."rawBalance" IS NOT NULL
        ORDER BY t.bank, t.origin, t."rawDate" DESC, t."createdAt" DESC
      `,

      // 2. Get all active holdings with their transactions for value calculation
      prisma.holding.findMany({
        where: {
          userId: user.userId,
          isActive: true,
        },
        include: {
          transactions: {
            orderBy: { date: 'asc' },
          },
        },
      }),

      // 3. Get monthly balance snapshots (last balance per month per account)
      prisma.$queryRaw<
        Array<{
          month: string
          total_balance: number
        }>
      >`
        WITH monthly_balances AS (
          SELECT DISTINCT ON (TO_CHAR(t."rawDate", 'YYYY-MM'), t.bank, t.origin)
            TO_CHAR(t."rawDate", 'YYYY-MM') as month,
            t.bank,
            t.origin,
            t."rawBalance"::float as balance
          FROM "transactions" t
          WHERE t."userId" = ${user.userId}
            AND t."deletedAt" IS NULL
            AND t."rawBalance" IS NOT NULL
          ORDER BY TO_CHAR(t."rawDate", 'YYYY-MM'), t.bank, t.origin, t."rawDate" DESC, t."createdAt" DESC
        )
        SELECT
          month,
          SUM(balance)::float as total_balance
        FROM monthly_balances
        GROUP BY month
        ORDER BY month ASC
      `,
    ])

    // Calculate account balances total
    const accountBalances = latestBalances.reduce((sum, acc) => sum + (acc.balance || 0), 0)

    // Calculate holdings values
    const holdingsBreakdown = holdingsData.map(holding => {
      let totalUnits = new Decimal(0)
      let totalCost = new Decimal(0)

      holding.transactions.forEach(tx => {
        const units = new Decimal(tx.units)
        const pricePerUnit = new Decimal(tx.pricePerUnit)
        const fees = new Decimal(tx.fees)

        if (tx.type === 'BUY') {
          totalUnits = totalUnits.add(units)
          totalCost = totalCost.add(units.mul(pricePerUnit)).add(fees)
        } else if (tx.type === 'SELL') {
          totalUnits = totalUnits.sub(units)
          const avgCost = totalCost.div(totalUnits.add(units))
          totalCost = totalCost.sub(units.mul(avgCost)).sub(fees)
        }
      })

      const currentPrice = holding.manualPrice ? new Decimal(holding.manualPrice) : null
      const currentValue = currentPrice ? totalUnits.mul(currentPrice).toNumber() : null

      return {
        id: holding.id,
        name: holding.name,
        type: holding.type,
        currentValue,
        totalCost: totalCost.toNumber(),
      }
    })

    // Sum investment values (only holdings with current prices)
    const investmentValue = holdingsBreakdown.reduce((sum, h) => sum + (h.currentValue ?? 0), 0)

    // Calculate net worth
    const netWorth = accountBalances + investmentValue

    // Build historical data - combine monthly balances with investment cost as proxy
    // (Investment snapshots would need a separate table for true historical tracking)
    const totalInvestmentCost = holdingsBreakdown.reduce((sum, h) => sum + h.totalCost, 0)

    const history = monthlyBalances.map(mb => ({
      month: mb.month,
      netWorth: mb.total_balance + totalInvestmentCost,
      accountBalances: mb.total_balance,
      investmentValue: totalInvestmentCost,
    }))

    const accounts = latestBalances.map(acc => ({
      bank: acc.bank,
      origin: acc.origin,
      balance: acc.balance,
      lastTransactionDate:
        acc.last_date instanceof Date ? acc.last_date.toISOString() : String(acc.last_date),
    }))

    const response: NetWorthBreakdown = {
      accountBalances,
      investmentValue,
      netWorth,
      accounts,
      holdings: holdingsBreakdown,
      history,
    }

    log.info(
      { netWorth, accounts: accounts.length, holdings: holdingsBreakdown.length },
      'Net worth calculated'
    )
    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, log)
  }
}
