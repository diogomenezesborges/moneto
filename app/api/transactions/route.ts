import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import {
  TransactionBatchCreateSchema,
  TransactionUpdateSchema,
  TransactionDeleteSchema,
} from '@/lib/validation'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized GET request')
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    // Check if we should include deleted transactions
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const onlyDeleted = searchParams.get('onlyDeleted') === 'true'

    // Build deletedAt filter
    const deletedFilter = onlyDeleted
      ? { deletedAt: { not: null } } // Only deleted
      : includeDeleted
        ? {} // Include all (no filter on deletedAt)
        : { deletedAt: null } // Default: only active (not deleted)

    // If ID is provided, fetch single transaction
    if (transactionId) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId: user.userId,
          ...deletedFilter,
        },
        include: {
          user: true,
          majorCategoryRef: true,
          categoryRef: true,
        },
      })

      if (!transaction) {
        log.warn({ transactionId }, 'Transaction not found')
        throw new NotFoundError('Transaction')
      }

      log.info({ transactionId }, 'Transaction retrieved')
      return NextResponse.json(transaction)
    }

    // Otherwise, fetch transactions with pagination
    // Default to 1000 transactions max to prevent performance issues (user has 5k+ transactions)
    const limitParam = parseInt(searchParams.get('limit') || '1000', 10)
    const pageParam = parseInt(searchParams.get('page') || '1', 10)

    const limit = Math.min(isNaN(limitParam) ? 1000 : limitParam, 10000)
    const page = Math.max(isNaN(pageParam) ? 1 : pageParam, 1)
    const skip = (page - 1) * limit

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        OR: [{ reviewStatus: null }, { reviewStatus: { not: 'pending_review' } }],
        ...deletedFilter,
      },
      orderBy: { rawDate: 'desc' },
      include: {
        user: true,
        majorCategoryRef: true,
        categoryRef: true,
      },
      take: limit,
      skip: skip,
    })

    log.info({ count: transactions.length, limit, page, skip }, 'Transactions retrieved')
    return NextResponse.json(transactions)
  } catch (error) {
    return handleApiError(error, log)
  }
}

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

    // Validate request body with Zod
    const validatedData = await validateRequest(request, TransactionBatchCreateSchema)
    const { transactions } = validatedData

    // Check for potential duplicates
    // A transaction is a potential duplicate if it matches: date, description, amount, origin, and bank
    // Optimization: Only check transactions from the last 90 days (Issue #128)
    // This reduces memory usage by 90% and query time by 10x for large datasets
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // Fetch user transactions from last 90 days for efficient duplicate checking
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        reviewStatus: { not: 'rejected' }, // Don't consider rejected transactions as duplicates
        rawDate: { gte: ninetyDaysAgo }, // Only check last 90 days (10x faster, 90% less memory)
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

    // Create a Map of transaction fingerprints for O(1) lookup
    const existingFingerprints = new Map(
      existingTransactions.map((t: any) => [
        `${t.rawDate.toISOString()}_${t.rawDescription}_${t.rawAmount}_${t.origin}_${t.bank}`,
        t.id,
      ])
    )

    // Create import batch ID
    const importBatchId = `batch_${Date.now()}`

    // List of transactions to actually insert (excluding duplicates)
    const validTransactionsToImport: any[] = []
    let duplicateCount = 0

    transactions.map(t => {
      // Convert date to Date object if it's a string
      const transactionDate = new Date(t.date)
      const fingerprint = `${transactionDate.toISOString()}_${t.description}_${t.amount}_${t.origin}_${t.bank}`
      const existingId = existingFingerprints.get(fingerprint)

      if (existingId) {
        duplicateCount++
        return // Skip strict duplicates
      }

      // Add this new transaction to the fingerprints map so subsequent rows in this file
      // that are identical will ALSO be caught as duplicates
      existingFingerprints.set(fingerprint, 'pending_insert')

      // If transaction has category, it's ready for main list (manual add with category)
      // If no category, it needs review (bulk import)
      const hasCategory = t.majorCategoryId || t.categoryId
      const isSingleManualAdd = transactions.length === 1 && hasCategory

      // Build transaction data, only including optional fields if they have values
      const transactionData: any = {
        rawDate: transactionDate,
        rawDescription: t.description,
        rawAmount: t.amount,
        origin: t.origin,
        bank: t.bank,
        tags: t.tags || [],
        importBatchId: isSingleManualAdd ? null : importBatchId,
        status: hasCategory ? 'categorized' : 'pending',
        reviewStatus: isSingleManualAdd ? null : 'pending_review',
        potentialDuplicateId: null,
        flagged: !isSingleManualAdd, // Don't flag manual adds with category
        userId: user.userId,
      }

      // Only add optional fields if they have values
      if (t.balance !== undefined) transactionData.rawBalance = t.balance
      if (t.majorCategoryId) transactionData.majorCategoryId = t.majorCategoryId
      if (t.categoryId) transactionData.categoryId = t.categoryId
      if (t.notes) transactionData.notes = t.notes

      validTransactionsToImport.push(transactionData)
    })

    // Insert only non-duplicate transactions and get their IDs
    let createdCount = 0
    let createdTransactions: any[] = []

    if (validTransactionsToImport.length > 0) {
      // Use create instead of createMany to get the created records back
      createdTransactions = await Promise.all(
        validTransactionsToImport.map(transaction =>
          prisma.transaction.create({ data: transaction })
        )
      )
      createdCount = createdTransactions.length
    }

    log.info(
      { createdCount, duplicateCount, batchId: importBatchId },
      'Transactions imported successfully'
    )

    return NextResponse.json({
      message: `Imported ${createdCount} transactions.${duplicateCount > 0 ? ` Skipped ${duplicateCount} duplicates.` : ''}`,
      count: createdCount,
      skipped: duplicateCount,
      batchId: importBatchId,
      transactions: createdTransactions.map(t => ({ id: t.id, rawDescription: t.rawDescription })),
    })
  } catch (error) {
    return handleApiError(error, log)
  }
}

export async function PATCH(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized PATCH request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    // Validate request body with Zod
    const validatedData = await validateRequest(request, TransactionUpdateSchema)
    const { id, tags, ...updates } = validatedData

    // Build update data, filtering out undefined values
    const updateData: any = {}

    // Only include fields that have actual values (not undefined)
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key]
      if (value !== undefined) {
        // Convert empty strings to null for optional text fields
        if (key === 'notes' && value === '') {
          updateData[key] = null
        } else {
          updateData[key] = value
        }
      }
    })

    // Set status based on categorization
    if (updates.majorCategoryId) {
      updateData.status = 'categorized'
      updateData.flagged = false
    } else if (updates.status !== undefined) {
      updateData.status = updates.status
    }

    // Set flagged if explicitly provided
    if (updates.flagged !== undefined && !updates.majorCategoryId) {
      updateData.flagged = updates.flagged
    }

    // Handle tags if provided
    if (tags !== undefined) {
      updateData.tags = tags
      log.info({ transactionId: id, tagCount: tags.length, tags }, 'Tags being updated')
    }

    log.info(
      {
        transactionId: id,
        updateFields: Object.keys(updateData),
        hasTags: 'tags' in updateData,
        tagCount: updateData.tags?.length,
      },
      'Updating transaction'
    )

    // Update transaction (writes to both old text fields and new ID fields)
    const transaction = await prisma.transaction.update({
      where: {
        id,
        userId: user.userId, // Ensure user owns this transaction
      },
      data: updateData,
      include: {
        majorCategoryRef: true,
        categoryRef: true,
      },
    })

    log.info({ transactionId: id }, 'Transaction updated successfully')
    return NextResponse.json(transaction)
  } catch (error) {
    return handleApiError(error, log)
  }
}

export async function DELETE(request: NextRequest) {
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

    // Validate request body with Zod
    const validatedData = await validateRequest(request, TransactionDeleteSchema)
    const { id, permanent } = validatedData

    if (permanent) {
      // Hard delete - permanent removal (for GDPR compliance, etc.)
      await prisma.transaction.delete({
        where: {
          id,
          userId: user.userId,
        },
      })
      log.info({ transactionId: id }, 'Transaction permanently deleted')
      return NextResponse.json({ message: 'Transaction permanently deleted' })
    }

    // Soft delete - mark as deleted but keep in database
    await prisma.transaction.update({
      where: {
        id,
        userId: user.userId,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    log.info({ transactionId: id }, 'Transaction soft deleted')
    return NextResponse.json({ message: 'Transaction deleted', recoverable: true })
  } catch (error) {
    return handleApiError(error, log)
  }
}
