import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { TransactionRestoreSchema, TransactionBulkDeleteSchema } from '@/lib/validation'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors'

// GET - Get soft-deleted (trashed) transactions
export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized GET request to trash')
      throw new AuthenticationError()
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        deletedAt: { not: null }, // Only deleted transactions
      },
      orderBy: { deletedAt: 'desc' },
      include: {
        majorCategoryRef: true,
        categoryRef: true,
      },
    })

    log.info({ count: transactions.length }, 'Trashed transactions retrieved')
    return NextResponse.json(transactions)
  } catch (error) {
    return handleApiError(error, log)
  }
}

// POST - Restore soft-deleted transaction(s)
export async function POST(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized POST request to trash')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    const body = await request.json()

    // Support both single restore and bulk restore
    if (body.id && typeof body.id === 'string') {
      // Single restore - validate id format
      const parseResult = TransactionRestoreSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 })
      }

      const { id } = parseResult.data

      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId: user.userId,
          deletedAt: { not: null },
        },
      })

      if (!transaction) {
        throw new NotFoundError('Deleted transaction')
      }

      await prisma.transaction.update({
        where: { id },
        data: {
          deletedAt: null,
          // Reset review status if it was rejected
          reviewStatus:
            transaction.reviewStatus === 'rejected' ? 'pending_review' : transaction.reviewStatus,
        },
      })

      log.info({ transactionId: id }, 'Transaction restored')
      return NextResponse.json({ message: 'Transaction restored', id })
    } else if (body.ids && Array.isArray(body.ids)) {
      // Bulk restore - validate ids
      const ids = body.ids.filter((id: unknown) => typeof id === 'string')
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No valid transaction IDs provided' }, { status: 400 })
      }

      const result = await prisma.transaction.updateMany({
        where: {
          id: { in: ids },
          userId: user.userId,
          deletedAt: { not: null },
        },
        data: {
          deletedAt: null,
        },
      })

      log.info({ count: result.count }, 'Transactions restored')
      return NextResponse.json({
        message: `Restored ${result.count} transactions`,
        count: result.count,
      })
    }

    return NextResponse.json({ error: 'Invalid request body - provide id or ids' }, { status: 400 })
  } catch (error) {
    return handleApiError(error, log)
  }
}

// DELETE - Permanently delete trashed transaction(s)
export async function DELETE(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized DELETE request to trash')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    const body = await request.json()

    // Validate request body
    const parseResult = TransactionBulkDeleteSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { ids } = parseResult.data

    // Permanently delete - only allow deleting already soft-deleted items
    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: ids },
        userId: user.userId,
        deletedAt: { not: null }, // Only delete items that are already in trash
      },
    })

    log.info({ count: result.count }, 'Transactions permanently deleted from trash')
    return NextResponse.json({
      message: `Permanently deleted ${result.count} transactions`,
      count: result.count,
    })
  } catch (error) {
    return handleApiError(error, log)
  }
}
