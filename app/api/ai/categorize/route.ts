import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { suggestCategoryWithAI, isGeminiConfigured } from '@/lib/gemini'
import { MAJOR_CATEGORIES } from '@/lib/categories'
import { validateCsrfToken } from '@/lib/csrf'
import { validateRequest } from '@/lib/validate-request'
import { AICategorizeSchema } from '@/lib/validation'

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
    const { transactionIds, useAI = true } = await validateRequest(request, AICategorizeSchema)

    // Get transactions to categorize
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.userId,
      },
    })

    // Get historical context for AI learning
    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        majorCategory: { not: null },
        category: { not: null },
      },
      select: {
        rawDescription: true,
        majorCategory: true,
        category: true,
        subCategory: true,
      },
      orderBy: { rawDate: 'desc' },
      take: 100, // Last 100 categorized transactions for context
    })

    const suggestions = []

    for (const transaction of transactions) {
      // Skip already categorized
      if (transaction.majorCategory && transaction.category) {
        suggestions.push({
          transactionId: transaction.id,
          suggestion: null,
          reason: 'Already categorized',
        })
        continue
      }

      try {
        if (useAI && isGeminiConfigured()) {
          // Use AI categorization
          const aiSuggestion = await suggestCategoryWithAI(
            {
              description: transaction.rawDescription,
              amount: transaction.rawAmount,
              date: transaction.rawDate,
            },
            historicalTransactions.map((h: any) => ({
              description: h.rawDescription,
              majorCategory: h.majorCategory!,
              category: h.category!,
              subCategory: h.subCategory || undefined,
            })),
            MAJOR_CATEGORIES
          )

          suggestions.push({
            transactionId: transaction.id,
            suggestion: {
              majorCategory: aiSuggestion.majorCategory,
              category: aiSuggestion.category,
              subCategory: aiSuggestion.subCategory,
              confidence: aiSuggestion.confidence,
              score: aiSuggestion.score,
              reasoning: aiSuggestion.reasoning,
              source: 'ai',
            },
          })
        } else {
          // Fallback to pattern matching (existing logic)
          const similar = historicalTransactions.find(
            (h: any) =>
              h.rawDescription.toLowerCase().includes(transaction.rawDescription.toLowerCase()) ||
              transaction.rawDescription.toLowerCase().includes(h.rawDescription.toLowerCase())
          )

          if (similar) {
            suggestions.push({
              transactionId: transaction.id,
              suggestion: {
                majorCategory: similar.majorCategory,
                category: similar.category,
                subCategory: similar.subCategory,
                confidence: 'medium',
                score: 60,
                reasoning: 'Based on similar transaction pattern',
                source: 'pattern',
              },
            })
          } else {
            suggestions.push({
              transactionId: transaction.id,
              suggestion: null,
            })
          }
        }
      } catch (error) {
        console.error(`Error categorizing transaction ${transaction.id}:`, error)
        suggestions.push({
          transactionId: transaction.id,
          suggestion: null,
          error: 'AI categorization failed, try pattern matching',
        })
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('AI categorization error:', error)
    return NextResponse.json({ error: 'Failed to categorize transactions' }, { status: 500 })
  }
}
