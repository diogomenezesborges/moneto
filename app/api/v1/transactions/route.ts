import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import { validateCsrfToken } from '@/lib/csrf'
import { addVersionMetadata } from '@/lib/api-version'
import { getPaginationParams, createPaginatedResponse, getCursorOptions } from '@/lib/pagination'
import {
  TransactionBatchCreateSchema,
  TransactionUpdateSchema,
  TransactionDeleteSchema,
} from '@/lib/validation'

/**
 * GET /api/v1/transactions
 * Fetch transactions with cursor-based pagination
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    // If ID is provided, fetch single transaction (no pagination)
    if (transactionId) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId: user.userId,
        },
        include: {
          user: true,
          majorCategoryRef: true,
          categoryRef: true,
        },
      })

      if (!transaction) {
        return NextResponse.json({ message: 'Transaction not found' }, { status: 404 })
      }

      const response = NextResponse.json(transaction)
      return addVersionMetadata(response, 'v1')
    }

    // Get pagination parameters
    const paginationParams = getPaginationParams(request)
    const cursorOptions = getCursorOptions(paginationParams)

    // Fetch transactions with pagination
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        OR: [{ reviewStatus: null }, { reviewStatus: { not: 'pending_review' } }],
      },
      ...cursorOptions,
      include: {
        user: true,
        majorCategoryRef: true,
        categoryRef: true,
      },
    })

    // Create paginated response
    const paginatedData = createPaginatedResponse(
      transactions,
      paginationParams.limit,
      paginationParams.sortOrder
    )

    const response = NextResponse.json(paginatedData)
    return addVersionMetadata(response, 'v1')
  } catch (error) {
    console.error('[Transactions GET v1] Error:', error)
    return NextResponse.json(
      {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/transactions
 * Create/import transactions (same as v0, with CSRF and Zod validation)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body with Zod
    const validatedData = await validateRequest(request, TransactionBatchCreateSchema)
    const { transactions } = validatedData

    // Check for potential duplicates
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        reviewStatus: { not: 'rejected' },
      },
      select: {
        id: true,
        rawDate: true,
        rawDescription: true,
        rawAmount: true,
        origin: true,
        bank: true,
      },
    })

    // Create fingerprint map
    const existingFingerprints = new Map(
      existingTransactions.map((t: any) => [
        `${t.rawDate.toISOString()}_${t.rawDescription}_${t.rawAmount}_${t.origin}_${t.bank}`,
        t.id,
      ])
    )

    const importBatchId = `batch_${Date.now()}`
    const validTransactionsToImport: any[] = []
    let duplicateCount = 0

    transactions.forEach(t => {
      const transactionDate = new Date(t.date)
      const fingerprint = `${transactionDate.toISOString()}_${t.description}_${t.amount}_${t.origin}_${t.bank}`
      const existingId = existingFingerprints.get(fingerprint)

      if (existingId) {
        duplicateCount++
        return
      }

      existingFingerprints.set(fingerprint, 'pending_insert')

      validTransactionsToImport.push({
        rawDate: transactionDate,
        rawDescription: t.description,
        rawAmount: t.amount,
        rawBalance: t.balance,
        origin: t.origin,
        bank: t.bank,
        importBatchId,
        status: 'pending',
        reviewStatus: 'pending_review',
        potentialDuplicateId: null,
        flagged: true,
        userId: user.userId,
      })
    })

    let createdCount = 0
    let createdTransactions: any[] = []

    if (validTransactionsToImport.length > 0) {
      createdTransactions = await Promise.all(
        validTransactionsToImport.map(transaction =>
          prisma.transaction.create({ data: transaction })
        )
      )
      createdCount = createdTransactions.length
    }

    const response = NextResponse.json({
      message: `Imported ${createdCount} transactions.${duplicateCount > 0 ? ` Skipped ${duplicateCount} duplicates.` : ''}`,
      count: createdCount,
      skipped: duplicateCount,
      batchId: importBatchId,
      transactions: createdTransactions.map(t => ({ id: t.id, rawDescription: t.rawDescription })),
    })
    return addVersionMetadata(response, 'v1')
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/v1/transactions
 * Update transaction (same as v0, with CSRF and Zod validation)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body with Zod
    const validatedData = await validateRequest(request, TransactionUpdateSchema)
    const { id, tags, ...updates } = validatedData

    const updateData: any = {
      ...updates,
      status: updates.majorCategoryId ? 'categorized' : updates.status || 'pending',
      flagged: updates.majorCategoryId ? false : updates.flagged,
    }

    if (tags !== undefined) {
      updateData.tags = tags
    }

    const transaction = await prisma.transaction.update({
      where: {
        id,
        userId: user.userId,
      },
      data: updateData,
      include: {
        majorCategoryRef: true,
        categoryRef: true,
      },
    })

    const response = NextResponse.json(transaction)
    return addVersionMetadata(response, 'v1')
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/transactions
 * Delete transaction (same as v0, with CSRF and Zod validation)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body with Zod
    const validatedData = await validateRequest(request, TransactionDeleteSchema)
    const { id } = validatedData

    await prisma.transaction.delete({
      where: {
        id,
        userId: user.userId,
      },
    })

    const response = NextResponse.json({ message: 'Transaction deleted' })
    return addVersionMetadata(response, 'v1')
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
