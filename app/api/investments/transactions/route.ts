import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import { InvestmentTransactionCreateSchema } from '@/lib/validation'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors'

/**
 * GET /api/investments/transactions
 * Fetches all investment transactions for the authenticated user
 * Can filter by holdingId via query param
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized GET request')
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const holdingId = searchParams.get('holdingId')

    // Build where clause
    const where: any = {
      holding: {
        userId: user.userId, // Ensure user can only see their own transactions
      },
    }

    // Filter by specific holding if provided
    if (holdingId) {
      where.holdingId = holdingId
    }

    // Fetch transactions with holding details
    const transactions = await prisma.investmentTransaction.findMany({
      where,
      include: {
        holding: {
          select: {
            id: true,
            name: true,
            ticker: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    log.info({ count: transactions.length, holdingId }, 'Investment transactions retrieved')
    return NextResponse.json(transactions)
  } catch (error) {
    return handleApiError(error, log)
  }
}

/**
 * POST /api/investments/transactions
 * Creates a new investment transaction (BUY or SELL)
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
    const validatedData = await validateRequest(request, InvestmentTransactionCreateSchema)

    // Verify holding exists and belongs to user
    const holding = await prisma.holding.findFirst({
      where: {
        id: validatedData.holdingId,
        userId: user.userId,
      },
    })

    if (!holding) {
      log.warn({ holdingId: validatedData.holdingId }, 'Holding not found or unauthorized')
      throw new NotFoundError('Holding')
    }

    // Create transaction
    const transaction = await prisma.investmentTransaction.create({
      data: validatedData,
      include: {
        holding: {
          select: {
            id: true,
            name: true,
            ticker: true,
            type: true,
          },
        },
      },
    })

    log.info(
      {
        transactionId: transaction.id,
        holdingId: holding.id,
        type: transaction.type,
        units: transaction.units,
      },
      'Investment transaction created'
    )
    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    return handleApiError(error, log)
  }
}
