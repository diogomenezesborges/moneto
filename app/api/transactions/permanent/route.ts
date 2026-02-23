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
 * DELETE /api/transactions/permanent
 * Permanently delete a soft-deleted transaction (hard delete)
 */
export async function DELETE(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized DELETE /permanent request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    // Validate request body with Zod
    const validatedData = await validateRequest(request, TransactionDeleteSchema)
    const { id } = validatedData

    // Check transaction exists and is already soft-deleted
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: user.userId,
        deletedAt: { not: null }, // Only allow permanent delete of already soft-deleted transactions
      },
    })

    if (!transaction) {
      log.warn({ transactionId: id }, 'Transaction not found in trash')
      throw new NotFoundError('Transaction not found in trash')
    }

    // Hard delete the transaction
    await prisma.transaction.delete({
      where: {
        id,
      },
    })

    log.info({ transactionId: id }, 'Transaction permanently deleted')
    return NextResponse.json({ message: 'Transaction permanently deleted' })
  } catch (error) {
    return handleApiError(error, log)
  }
}
