import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'

// GET - Get transactions pending review
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Fetch pending review transactions (exclude soft-deleted)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        reviewStatus: 'pending_review',
        deletedAt: null, // Exclude soft-deleted transactions
      },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    })

    // PERFORMANCE FIX: Fetch all duplicate transactions in a SINGLE query instead of N+1
    // Collect all unique potential duplicate IDs
    const potentialDuplicateIds = transactions
      .map(t => t.potentialDuplicateId)
      .filter((id): id is string => id !== null)

    // Fetch all duplicates in one query
    const duplicates =
      potentialDuplicateIds.length > 0
        ? await prisma.transaction.findMany({
            where: { id: { in: potentialDuplicateIds } },
          })
        : []

    // Create a map for O(1) lookup
    const duplicatesMap = new Map(duplicates.map(d => [d.id, d]))

    // Map duplicates to transactions
    const transactionsWithDuplicateInfo = transactions.map(transaction => {
      if (transaction.potentialDuplicateId) {
        return {
          ...transaction,
          duplicateOf: duplicatesMap.get(transaction.potentialDuplicateId) || null,
        }
      }
      return transaction
    })

    // Calculate review progress
    const total = await prisma.transaction.count({
      where: { userId: user.userId, deletedAt: null },
    })
    const pending = transactionsWithDuplicateInfo.length
    const rejected = await prisma.transaction.count({
      where: { userId: user.userId, reviewStatus: 'rejected' },
    })
    const approved = total - pending - rejected

    return NextResponse.json({
      transactions: transactionsWithDuplicateInfo,
      progress: {
        total,
        pending,
        reviewed: approved + rejected,
        approved,
        rejected,
        percentComplete: total > 0 ? Math.round(((approved + rejected) / total) * 100) : 100,
      },
    })
  } catch (error) {
    console.error('Get pending review transactions error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Approve or reject transactions
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
    const { action, transactionIds } = body

    if (!action || !transactionIds || !Array.isArray(transactionIds)) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    if (action === 'approve') {
      // Set reviewStatus to null (approved) for selected transactions
      await prisma.transaction.updateMany({
        where: {
          id: { in: transactionIds },
          userId: user.userId,
          reviewStatus: 'pending_review',
        },
        data: {
          reviewStatus: null,
        },
      })

      return NextResponse.json({
        message: `Approved ${transactionIds.length} transactions`,
        count: transactionIds.length,
      })
    } else if (action === 'reject') {
      // Soft delete rejected transactions
      const result = await prisma.transaction.updateMany({
        where: {
          id: { in: transactionIds },
          userId: user.userId,
          reviewStatus: 'pending_review',
        },
        data: {
          deletedAt: new Date(),
          reviewStatus: 'rejected',
        },
      })

      return NextResponse.json({
        message: `Rejected ${result.count} transactions`,
        count: result.count,
        recoverable: true,
      })
    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Review action error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
