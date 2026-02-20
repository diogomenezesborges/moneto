import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import { HoldingCreateSchema } from '@/lib/validation'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError } from '@/lib/errors'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * GET /api/investments/holdings
 * Fetches all holdings for the authenticated user with calculated metrics
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized GET request')
      throw new AuthenticationError()
    }

    // Fetch holdings with related transactions for calculations
    const holdings = await prisma.holding.findMany({
      where: {
        userId: user.userId,
        isActive: true, // Only active holdings by default
      },
      include: {
        transactions: {
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate metrics for each holding
    const holdingsWithMetrics = holdings.map(holding => {
      let totalUnits = new Decimal(0)
      let totalCost = new Decimal(0)

      // Calculate total units and average cost from transactions
      holding.transactions.forEach(tx => {
        const units = new Decimal(tx.units)
        const pricePerUnit = new Decimal(tx.pricePerUnit)
        const fees = new Decimal(tx.fees)

        if (tx.type === 'BUY') {
          totalUnits = totalUnits.add(units)
          totalCost = totalCost.add(units.mul(pricePerUnit)).add(fees)
        } else if (tx.type === 'SELL') {
          totalUnits = totalUnits.sub(units)
          // For cost, reduce proportionally based on units sold
          const avgCost = totalCost.div(totalUnits.add(units))
          totalCost = totalCost.sub(units.mul(avgCost)).sub(fees)
        }
      })

      const averageCost = totalUnits.gt(0) ? totalCost.div(totalUnits).toNumber() : 0

      // For current value calculation, we'll need the current price
      // This will be enhanced in Issue #107 with live price fetching
      const currentPrice = holding.manualPrice ? new Decimal(holding.manualPrice) : null
      const currentValue = currentPrice ? totalUnits.mul(currentPrice).toNumber() : null
      const gainLoss = currentValue ? currentValue - totalCost.toNumber() : null
      const gainLossPercent =
        gainLoss && totalCost.gt(0) ? (gainLoss / totalCost.toNumber()) * 100 : null

      return {
        ...holding,
        // Remove transactions from response (already processed)
        transactions: undefined,
        // Add calculated fields
        totalUnits: totalUnits.toNumber(),
        averageCost,
        totalCost: totalCost.toNumber(),
        currentPrice: currentPrice?.toNumber() || null,
        currentValue,
        gainLoss,
        gainLossPercent,
      }
    })

    log.info({ count: holdingsWithMetrics.length }, 'Holdings retrieved')
    return NextResponse.json(holdingsWithMetrics)
  } catch (error) {
    return handleApiError(error, log)
  }
}

/**
 * POST /api/investments/holdings
 * Creates a new holding for the authenticated user
 */
export async function POST(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized POST request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    // Validate request body
    const validatedData = await validateRequest(request, HoldingCreateSchema)

    // Create holding
    const holding = await prisma.holding.create({
      data: {
        ...validatedData,
        userId: user.userId,
      },
    })

    log.info({ holdingId: holding.id, name: holding.name }, 'Holding created')
    return NextResponse.json(holding, { status: 201 })
  } catch (error) {
    return handleApiError(error, log)
  }
}
