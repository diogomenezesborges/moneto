import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors'

/**
 * DELETE /api/investments/transactions/[id]
 * Permanently deletes an investment transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized DELETE request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    const { id } = await params

    // Verify transaction exists and belongs to user
    const existingTransaction = await prisma.investmentTransaction.findFirst({
      where: {
        id,
        holding: {
          userId: user.userId, // Ensure user owns the holding
        },
      },
      include: {
        holding: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existingTransaction) {
      log.warn({ transactionId: id }, 'Transaction not found or unauthorized')
      throw new NotFoundError('Investment transaction')
    }

    // Delete transaction
    await prisma.investmentTransaction.delete({
      where: { id },
    })

    log.info(
      {
        transactionId: id,
        holdingId: existingTransaction.holdingId,
        holdingName: existingTransaction.holding.name,
      },
      'Investment transaction deleted'
    )
    return NextResponse.json({
      success: true,
      message: 'Investment transaction deleted',
    })
  } catch (error) {
    return handleApiError(error, log)
  }
}
