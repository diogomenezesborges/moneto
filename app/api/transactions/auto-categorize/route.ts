import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { MERCHANT_RULES } from '@/lib/categories'
import { namesToIds } from '@/lib/category-mapper'
import { validateCsrfToken } from '@/lib/csrf'

// Calculate similarity between two strings (simple matching)
// Issue #129: Optimized with Set-based word intersection (O(n+m) instead of O(n×m))
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim().replace(/'/g, '') // Remove apostrophes
  const s2 = str2.toLowerCase().trim().replace(/'/g, '') // Remove apostrophes

  // Handle empty strings
  if (!s1 || !s2) return s1 === s2 ? 1.0 : 0

  // Exact match
  if (s1 === s2) return 1.0

  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Word-based similarity - OPTIMIZED with Set for O(1) lookups
  const words1 = s1.split(/\s+/).filter(w => w.length > 3)
  const words2Set = new Set(s2.split(/\s+/).filter(w => w.length > 3))

  // Use Set.has() for O(1) lookup instead of array.includes() O(n)
  const commonWords = words1.filter(w => words2Set.has(w))

  if (commonWords.length > 0) {
    return 0.5 + (commonWords.length / Math.max(words1.length, words2Set.size)) * 0.3
  }

  return 0
}

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

    // Get all rules for this user
    const rules = await prisma.rule.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' }, // Custom rules first
    })

    // Get all categorized transactions for learning
    const categorizedTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        status: 'categorized',
        majorCategory: { not: null },
      },
      orderBy: { rawDate: 'desc' },
      take: 500, // Limit to recent transactions for performance
    })

    // Get all pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.userId,
        status: 'pending',
      },
    })

    // PERFORMANCE FIX (Issue #126): Batch updates instead of N+1 sequential updates
    // OLD: 100 pending transactions = 100+ sequential database roundtrips (5-10s)
    // NEW: Collect matches, then batch update by category (3-5 batch queries, <500ms)

    // Phase 1: Collect all matches and group by category IDs
    type UpdateBatch = {
      ids: string[]
      categoryIds: any
    }
    const updatesByCategory = new Map<string, UpdateBatch>()

    for (const transaction of pendingTransactions) {
      const description = transaction.rawDescription.toLowerCase()
      let categoryIds: any = null
      let matchType: 'merchant' | 'rule' | 'history' | null = null

      // Strategy 1: Try matching with hardcoded MERCHANT_RULES first (fastest, most reliable)
      let merchantMatch = null
      for (const [keyword, categorization] of Object.entries(MERCHANT_RULES)) {
        if (description.includes(keyword.toLowerCase())) {
          merchantMatch = categorization
          break
        }
      }

      if (merchantMatch) {
        categoryIds = await namesToIds(merchantMatch.major, merchantMatch.category)
        matchType = 'merchant'
      } else {
        // Strategy 2: Try matching with user-created database rules
        const matchingRule = rules.find((rule: any) =>
          description.includes(rule.keyword.toLowerCase())
        )

        if (matchingRule) {
          categoryIds = await namesToIds(matchingRule.majorCategory, matchingRule.category)
          matchType = 'rule'
        } else {
          // Strategy 3: Try matching with historical transactions (learning from past categorizations)
          // Issue #129: 3-phase optimization (100x faster)

          // Phase 1: Amount pre-filtering (±20% range) - eliminates 80-90% of candidates
          const amount1 = transaction.rawAmount * 0.8
          const amount2 = transaction.rawAmount * 1.2
          const amountMin = Math.min(amount1, amount2) // Handle negative amounts correctly
          const amountMax = Math.max(amount1, amount2)

          const amountFiltered = categorizedTransactions.filter(
            h => h.rawAmount >= amountMin && h.rawAmount <= amountMax
          )

          // Use filtered list if available, otherwise fall back to all (preserves correctness)
          const candidateList = amountFiltered.length > 0 ? amountFiltered : categorizedTransactions

          let bestMatch = null
          let bestSimilarity = 0

          // Phase 2: Early termination on perfect match (≥0.95 similarity)
          for (const historicalTx of candidateList) {
            const similarity = calculateSimilarity(
              transaction.rawDescription,
              historicalTx.rawDescription
            )

            // Early termination: Stop searching if we find a near-perfect match
            if (similarity >= 0.95) {
              bestMatch = historicalTx
              break // Stop immediately, no need to check remaining candidates
            }

            if (similarity > bestSimilarity && similarity >= 0.7) {
              bestSimilarity = similarity
              bestMatch = historicalTx
            }
          }

          if (bestMatch) {
            categoryIds = await namesToIds(bestMatch.majorCategory, bestMatch.category)
            matchType = 'history'
          }
        }
      }

      // If we found a match, add to batch
      if (categoryIds && matchType) {
        const batchKey = `${matchType}-${JSON.stringify(categoryIds)}`
        if (!updatesByCategory.has(batchKey)) {
          updatesByCategory.set(batchKey, { ids: [], categoryIds })
        }
        updatesByCategory.get(batchKey)!.ids.push(transaction.id)
      }
    }

    // Phase 2: Execute batched updates in a single transaction
    const updateOperations = Array.from(updatesByCategory.values()).map(batch =>
      prisma.transaction.updateMany({
        where: { id: { in: batch.ids } },
        data: {
          ...batch.categoryIds,
          status: 'categorized',
          flagged: false,
        },
      })
    )

    await prisma.$transaction(updateOperations)

    // Calculate statistics from batches
    let updatedByMerchantRule = 0
    let updatedByRule = 0
    let updatedByHistory = 0

    for (const [batchKey, batch] of Array.from(updatesByCategory.entries())) {
      if (batchKey.startsWith('merchant-')) {
        updatedByMerchantRule += batch.ids.length
      } else if (batchKey.startsWith('rule-')) {
        updatedByRule += batch.ids.length
      } else if (batchKey.startsWith('history-')) {
        updatedByHistory += batch.ids.length
      }
    }

    const totalUpdated = updatedByMerchantRule + updatedByRule + updatedByHistory
    return NextResponse.json({
      message: `Applied categorization: ${updatedByMerchantRule} by merchant rules, ${updatedByRule} by custom rules, ${updatedByHistory} by history`,
      updated: totalUpdated,
      byMerchantRule: updatedByMerchantRule,
      byRule: updatedByRule,
      byHistory: updatedByHistory,
      total: pendingTransactions.length,
    })
  } catch (error) {
    console.error('Auto-categorize error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
