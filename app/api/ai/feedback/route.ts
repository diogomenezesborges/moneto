import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { validateRequest } from '@/lib/validate-request'
import { AIFeedbackSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body
    const { transactionId, suggestion, action, actualCategory } = await validateRequest(
      request,
      AIFeedbackSchema
    )

    // Verify transaction belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: user.userId,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Record the feedback
    await prisma.categorySuggestionFeedback.create({
      data: {
        transactionId,
        suggestedMajorCategory: suggestion.majorCategory,
        suggestedCategory: suggestion.category,
        suggestedTags: suggestion.tags || [],
        suggestedConfidence: suggestion.confidence,
        suggestedScore: suggestion.score || 0,
        suggestionSource: suggestion.source || 'unknown',
        action,
        actualMajorCategory:
          actualCategory?.majorCategory || (action === 'accept' ? suggestion.majorCategory : null),
        actualCategory:
          actualCategory?.category || (action === 'accept' ? suggestion.category : null),
        actualTags: actualCategory?.tags || (action === 'accept' ? suggestion.tags || [] : []),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    })
  } catch (error) {
    console.error('Feedback recording error:', error)
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 })
  }
}

// GET endpoint to retrieve learning insights
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get feedback statistics
    const stats = await prisma.categorySuggestionFeedback.groupBy({
      by: ['action', 'suggestionSource'],
      where: {
        transaction: {
          userId: user.userId,
        },
      },
      _count: true,
    })

    // Get most accurate patterns (accepted suggestions)
    const topPatterns = await prisma.categorySuggestionFeedback.findMany({
      where: {
        transaction: { userId: user.userId },
        action: 'accept',
      },
      include: {
        transaction: {
          select: {
            rawDescription: true,
          },
        },
      },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      stats,
      topPatterns: topPatterns.map((p: any) => ({
        description: p.transaction.rawDescription,
        category: `${p.actualMajorCategory} > ${p.actualCategory}`,
        tags: p.actualTags || [],
        source: p.suggestionSource,
        confidence: p.suggestedConfidence,
      })),
    })
  } catch (error) {
    console.error('Get feedback error:', error)
    return NextResponse.json({ error: 'Failed to get feedback stats' }, { status: 500 })
  }
}
