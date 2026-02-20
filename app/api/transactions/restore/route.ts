import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import { TransactionDeleteSchema } from '@/lib/validation'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors'

/**
 * POST /api/transactions/restore
 * Restore a soft-deleted transaction
 */
export async function POST(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized POST /restore request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    // Validate request body with Zod (reuse TransactionDeleteSchema for id)
    const validatedData = await validateRequest(request, TransactionDeleteSchema)
    const { id } = validatedData

    // Check transaction exists and is deleted
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: user.userId,
        deletedAt: { not: null },
      },
    })

    if (!transaction) {
      log.warn({ transactionId: id }, 'Transaction not found in trash')
      throw new NotFoundError('Transaction not found in trash')
    }

    // Restore transaction by clearing deletedAt
    const restoredTransaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
      },
      include: {
        majorCategoryRef: true,
        categoryRef: true,
      },
    })

    log.info({ transactionId: id }, 'Transaction restored successfully')
    return NextResponse.json(restoredTransaction)
  } catch (error) {
    return handleApiError(error, log)
  }
}
