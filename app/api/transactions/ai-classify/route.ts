import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { classifyTransaction, classifyTransactionBatch } from '@/lib/ai-classifier'
import { validateCsrfToken } from '@/lib/csrf'

/**
 * POST /api/transactions/ai-classify
 * Use AI to classify pending transactions (2-level: Major → Category + tags)
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

    const body = await request.json()
    const { transactionId, batchMode } = body

    // Single transaction classification
    if (transactionId && !batchMode) {
      const transaction = await prisma.transaction.findUnique({
        where: {
          id: transactionId,
          userId: user.userId,
        },
      })

      if (!transaction) {
        return NextResponse.json({ message: 'Transaction not found' }, { status: 404 })
      }

      // Get historical context (similar descriptions)
      const historicalTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.userId,
          status: 'categorized',
          majorCategoryId: { not: null },
        },
        select: {
          rawDescription: true,
          majorCategoryId: true,
          categoryId: true,
          tags: true,
        },
        orderBy: { rawDate: 'desc' },
        take: 10,
      })

      // Filter for similar descriptions
      const similarHistory = historicalTransactions
        .filter(
          (h: any) =>
            h.rawDescription
              .toLowerCase()
              .includes(transaction.rawDescription.toLowerCase().split(' ')[0]) ||
            transaction.rawDescription
              .toLowerCase()
              .includes(h.rawDescription.toLowerCase().split(' ')[0])
        )
        .map((h: any) => ({
          description: h.rawDescription,
          majorCategoryId: h.majorCategoryId!,
          categoryId: h.categoryId!,
          tags: h.tags || [],
        }))

      // Classify with AI
      const classification = await classifyTransaction(
        {
          description: transaction.rawDescription,
          amount: transaction.rawAmount,
          date: transaction.rawDate,
          bank: transaction.bank,
        },
        similarHistory
      )

      // Update transaction with AI classification
      const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          // ID fields (primary)
          majorCategoryId: classification.majorCategoryId,
          categoryId: classification.categoryId,
          // Tags (replaces subcategory)
          tags: classification.tags || [],
          // AI metadata
          classifierConfidence: classification.confidence,
          classifierReasoning: classification.reasoning,
          classifierVersion: classification.version,
          status: 'categorized',
          flagged: classification.confidence < 0.7, // Flag low-confidence classifications
        },
      })

      return NextResponse.json({
        message: 'Transaction classified with AI',
        transaction: updated,
        classification,
      })
    }

    // Batch mode: classify all pending transactions
    if (batchMode) {
      const pendingTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.userId,
          status: 'pending',
        },
        select: {
          id: true,
          rawDescription: true,
          rawAmount: true,
          rawDate: true,
          bank: true,
        },
        take: 50, // Limit to 50 to avoid excessive API costs
      })

      if (pendingTransactions.length === 0) {
        return NextResponse.json({
          message: 'No pending transactions to classify',
          classified: 0,
        })
      }

      // Classify batch
      const classifications = await classifyTransactionBatch(
        pendingTransactions.map((t: any) => ({
          id: t.id,
          description: t.rawDescription,
          amount: t.rawAmount,
          date: t.rawDate,
          bank: t.bank,
        }))
      )

      // Update all classified transactions
      let successCount = 0
      let lowConfidenceCount = 0

      for (const [txId, classification] of Array.from(classifications.entries())) {
        await prisma.transaction.update({
          where: { id: txId },
          data: {
            majorCategoryId: classification.majorCategoryId,
            categoryId: classification.categoryId,
            tags: classification.tags || [],
            classifierConfidence: classification.confidence,
            classifierReasoning: classification.reasoning,
            classifierVersion: classification.version,
            status: 'categorized',
            flagged: classification.confidence < 0.7,
          },
        })

        successCount++
        if (classification.confidence < 0.7) {
          lowConfidenceCount++
        }
      }

      return NextResponse.json({
        message: `Classified ${successCount} transactions with AI`,
        classified: successCount,
        lowConfidence: lowConfidenceCount,
        total: pendingTransactions.length,
      })
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('AI classification error:', error)
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
