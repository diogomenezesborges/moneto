import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionIds } = await request.json()

    // Get the transactions to analyze
    const transactionsToAnalyze = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.userId,
      },
    })

    const suggestions = []

    for (const transaction of transactionsToAnalyze) {
      // Skip if already categorized
      if (transaction.majorCategory && transaction.category) {
        suggestions.push({
          transactionId: transaction.id,
          suggestion: null,
        })
        continue
      }

      // Find similar categorized transactions
      // Strategy: Look for transactions with similar description and/or amount
      const similarTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.userId,
          majorCategory: { not: null },
          category: { not: null },
          OR: [
            // Exact description match (case-insensitive)
            {
              rawDescription: {
                equals: transaction.rawDescription,
                mode: 'insensitive',
              },
            },
            // Partial description match (contains key parts)
            {
              rawDescription: {
                contains: transaction.rawDescription.split(' ')[0], // First word
                mode: 'insensitive',
              },
            },
            // Exact amount match
            {
              rawAmount: transaction.rawAmount,
            },
          ],
        },
        orderBy: {
          rawDate: 'desc', // Most recent first
        },
        take: 10, // Limit to 10 most recent matches
      })

      if (similarTransactions.length === 0) {
        suggestions.push({
          transactionId: transaction.id,
          suggestion: null,
        })
        continue
      }

      // Calculate confidence based on match quality
      let bestMatch: (typeof similarTransactions)[0] | null = null
      let highestScore = 0

      for (const similar of similarTransactions) {
        let score = 0

        // Exact description match = high score
        if (similar.rawDescription.toLowerCase() === transaction.rawDescription.toLowerCase()) {
          score += 50
        } else if (
          similar.rawDescription.toLowerCase().includes(transaction.rawDescription.toLowerCase()) ||
          transaction.rawDescription.toLowerCase().includes(similar.rawDescription.toLowerCase())
        ) {
          score += 25
        }

        // Exact amount match = high score
        if (similar.rawAmount === transaction.rawAmount) {
          score += 30
        } else if (
          Math.abs(similar.rawAmount - transaction.rawAmount) / Math.abs(transaction.rawAmount) <
          0.05
        ) {
          // Within 5% = medium score
          score += 15
        }

        // Recency bonus (last 6 months)
        const monthsAgo =
          (Date.now() - new Date(similar.rawDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
        if (monthsAgo < 6) {
          score += 10
        }

        if (score > highestScore) {
          highestScore = score
          bestMatch = similar
        }
      }

      // Determine confidence level
      let confidence: 'high' | 'medium' | 'low' = 'low'
      if (highestScore >= 60) {
        confidence = 'high'
      } else if (highestScore >= 30) {
        confidence = 'medium'
      }

      // Count how many similar transactions have the same category
      const categoryCount = similarTransactions.filter(
        (t: any) =>
          t.majorCategory === bestMatch?.majorCategory && t.category === bestMatch?.category
      ).length

      suggestions.push({
        transactionId: transaction.id,
        suggestion: bestMatch
          ? {
              majorCategory: bestMatch.majorCategory,
              category: bestMatch.category,
              confidence,
              matchCount: categoryCount,
              sampleDescription: bestMatch.rawDescription,
              score: highestScore,
            }
          : null,
      })
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to suggest categories' }, { status: 500 })
  }
}
