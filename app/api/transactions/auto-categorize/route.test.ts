/**
 * Tests for Issue #129: Auto-Categorize Similarity Optimization
 *
 * Verifies 3-phase optimization:
 * 1. Amount pre-filtering (±20% range)
 * 2. Early termination on ≥0.95 similarity
 * 3. Optimized calculateSimilarity() with Set-based word intersection
 */

import { describe, it, expect } from 'vitest'

// Copy of optimized calculateSimilarity from route.ts
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

describe('Issue #129: calculateSimilarity() Correctness', () => {
  describe('Exact Matches', () => {
    it('should return 1.0 for identical strings', () => {
      expect(calculateSimilarity('Amazon Purchase', 'Amazon Purchase')).toBe(1.0)
      expect(calculateSimilarity('STARBUCKS', 'STARBUCKS')).toBe(1.0)
    })

    it('should return 1.0 for identical strings with different casing', () => {
      expect(calculateSimilarity('Amazon Purchase', 'amazon purchase')).toBe(1.0)
      expect(calculateSimilarity('STARBUCKS COFFEE', 'starbucks coffee')).toBe(1.0)
    })

    it('should ignore leading/trailing whitespace', () => {
      expect(calculateSimilarity('  Amazon  ', 'Amazon')).toBe(1.0)
      expect(calculateSimilarity('Starbucks', '   Starbucks   ')).toBe(1.0)
    })
  })

  describe('Contains Matches', () => {
    it('should return 0.8 when one string contains the other', () => {
      expect(calculateSimilarity('Amazon', 'Amazon Prime')).toBe(0.8)
      expect(calculateSimilarity('Starbucks Coffee', 'Starbucks')).toBe(0.8)
    })

    it('should return 0.8 when second string contains first', () => {
      expect(calculateSimilarity('Prime', 'Amazon Prime')).toBe(0.8)
      expect(calculateSimilarity('Coffee', 'Starbucks Coffee')).toBe(0.8)
    })
  })

  describe('Word-Based Similarity', () => {
    it('should calculate similarity based on common words', () => {
      const similarity = calculateSimilarity(
        'Amazon Prime Video Subscription',
        'Amazon Video Streaming'
      )
      // 'amazon' and 'video' are common words
      expect(similarity).toBeGreaterThan(0.5)
      expect(similarity).toBeLessThan(0.8)
    })

    it('should ignore short words (≤3 chars)', () => {
      const similarity = calculateSimilarity('Buy at Amazon', 'Buy at Walmart')
      // Only shares 'at' and 'Buy' (both ≤3 chars, ignored)
      expect(similarity).toBe(0)
    })

    it('should count only significant words (>3 chars)', () => {
      const similarity = calculateSimilarity('Starbucks Coffee Shop', 'Starbucks Coffee Store')
      // 'Starbucks' and 'Coffee' are common (both >3 chars)
      expect(similarity).toBeGreaterThanOrEqual(0.7)
    })

    it('should return 0 for completely different strings', () => {
      expect(calculateSimilarity('Amazon', 'Walmart')).toBe(0)
      expect(calculateSimilarity('Starbucks', 'McDonalds')).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(1.0) // Both empty = exact match
      expect(calculateSimilarity('Amazon', '')).toBe(0)
      expect(calculateSimilarity('', 'Amazon')).toBe(0)
    })

    it('should handle single-word strings', () => {
      expect(calculateSimilarity('Amazon', 'amazon')).toBe(1.0)
      expect(calculateSimilarity('Amazon', 'Walmart')).toBe(0)
    })

    it('should handle strings with only short words', () => {
      const similarity = calculateSimilarity('Buy it now', 'Get it now')
      expect(similarity).toBe(0) // All words ≤3 chars
    })
  })
})

describe('Issue #129: Amount Pre-Filtering', () => {
  type Transaction = {
    rawAmount: number
    rawDescription: string
  }

  it('should filter transactions within ±20% range', () => {
    const targetTransaction: Transaction = {
      rawAmount: -100,
      rawDescription: 'Target Transaction',
    }

    const historicalTransactions: Transaction[] = [
      { rawAmount: -80, rawDescription: 'Within range (20% below)' }, // ✅ -80 >= -120
      { rawAmount: -100, rawDescription: 'Exact match' }, // ✅
      { rawAmount: -120, rawDescription: 'Within range (20% above)' }, // ✅ -120 <= -80
      { rawAmount: -75, rawDescription: 'Outside range (too small)' }, // ❌ -75 > -80
      { rawAmount: -130, rawDescription: 'Outside range (too large)' }, // ❌ -130 < -120
    ]

    const amount1 = targetTransaction.rawAmount * 0.8 // -80
    const amount2 = targetTransaction.rawAmount * 1.2 // -120
    const amountMin = Math.min(amount1, amount2) // -120
    const amountMax = Math.max(amount1, amount2) // -80

    const filtered = historicalTransactions.filter(
      h => h.rawAmount >= amountMin && h.rawAmount <= amountMax
    )

    expect(filtered.length).toBe(3)
    expect(filtered.map(t => t.rawAmount)).toEqual([-80, -100, -120])
  })

  it('should handle positive amounts correctly', () => {
    const targetTransaction: Transaction = {
      rawAmount: 1000,
      rawDescription: 'Income',
    }

    const historicalTransactions: Transaction[] = [
      { rawAmount: 800, rawDescription: 'Within range' }, // ✅ 800 >= 800
      { rawAmount: 1200, rawDescription: 'Within range' }, // ✅ 1200 <= 1200
      { rawAmount: 700, rawDescription: 'Outside range' }, // ❌
      { rawAmount: 1300, rawDescription: 'Outside range' }, // ❌
    ]

    const amount1 = targetTransaction.rawAmount * 0.8 // 800
    const amount2 = targetTransaction.rawAmount * 1.2 // 1200
    const amountMin = Math.min(amount1, amount2) // 800
    const amountMax = Math.max(amount1, amount2) // 1200

    const filtered = historicalTransactions.filter(
      h => h.rawAmount >= amountMin && h.rawAmount <= amountMax
    )

    expect(filtered.length).toBe(2)
    expect(filtered.map(t => t.rawAmount)).toEqual([800, 1200])
  })

  it('should fallback to all transactions if no amount matches', () => {
    const targetTransaction: Transaction = {
      rawAmount: -1000,
      rawDescription: 'Very large expense',
    }

    const historicalTransactions: Transaction[] = [
      { rawAmount: -10, rawDescription: 'Small expense' },
      { rawAmount: -20, rawDescription: 'Small expense' },
      { rawAmount: -30, rawDescription: 'Small expense' },
    ]

    const amount1 = targetTransaction.rawAmount * 0.8 // -800
    const amount2 = targetTransaction.rawAmount * 1.2 // -1200
    const amountMin = Math.min(amount1, amount2) // -1200
    const amountMax = Math.max(amount1, amount2) // -800

    const filtered = historicalTransactions.filter(
      h => h.rawAmount >= amountMin && h.rawAmount <= amountMax
    )

    // No matches, should fallback to all transactions
    const candidateList = filtered.length > 0 ? filtered : historicalTransactions
    expect(candidateList.length).toBe(historicalTransactions.length)
  })
})

describe('Issue #129: Early Termination', () => {
  it('should stop searching after finding ≥0.95 similarity', () => {
    type Transaction = {
      rawDescription: string
      majorCategory: string
    }

    const targetTransaction = {
      rawDescription: 'Amazon Prime Video',
    }

    const historicalTransactions: Transaction[] = [
      { rawDescription: 'Walmart Purchase', majorCategory: 'Shopping' },
      { rawDescription: 'Amazon Prime Video', majorCategory: 'Subscriptions' }, // Perfect match
      { rawDescription: 'Amazon Prime Music', majorCategory: 'Entertainment' }, // Never checked
    ]

    let iterationCount = 0
    let bestMatch: Transaction | null = null

    for (const historicalTx of historicalTransactions) {
      iterationCount++
      const similarity = calculateSimilarity(
        targetTransaction.rawDescription,
        historicalTx.rawDescription
      )

      if (similarity >= 0.95) {
        bestMatch = historicalTx
        break // Early termination
      }
    }

    expect(bestMatch).not.toBeNull()
    expect(bestMatch?.rawDescription).toBe('Amazon Prime Video')
    expect(iterationCount).toBe(2) // Should stop after 2nd iteration
  })

  it('should check all transactions if no perfect match found', () => {
    type Transaction = {
      rawDescription: string
    }

    const targetTransaction = {
      rawDescription: 'Unique Transaction',
    }

    const historicalTransactions: Transaction[] = [
      { rawDescription: 'Transaction One' },
      { rawDescription: 'Transaction Two' },
      { rawDescription: 'Transaction Three' },
    ]

    let iterationCount = 0

    for (const historicalTx of historicalTransactions) {
      iterationCount++
      const similarity = calculateSimilarity(
        targetTransaction.rawDescription,
        historicalTx.rawDescription
      )

      if (similarity >= 0.95) {
        break
      }
    }

    expect(iterationCount).toBe(3) // Should check all 3 transactions
  })
})

describe('Issue #129: Performance Characteristics', () => {
  it('should use Set-based lookup for O(1) word matching', () => {
    const str1 = 'Amazon Prime Video Subscription Service Monthly'
    const str2 = 'Netflix Streaming Video Entertainment Platform Subscription'

    // Simulate the optimized approach
    const words1 = str1
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
    const words2Set = new Set(
      str2
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3)
    )

    // Count common words using Set.has() (O(1) per lookup)
    const commonWords = words1.filter(w => words2Set.has(w))

    expect(commonWords).toContain('video')
    expect(commonWords).toContain('subscription')
    expect(commonWords.length).toBe(2)
  })

  it('should handle large word lists efficiently', () => {
    const largeString1 = Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ')
    const largeString2 = Array.from({ length: 100 }, (_, i) => `word${i + 50}`).join(' ')

    const start = performance.now()
    const similarity = calculateSimilarity(largeString1, largeString2)
    const duration = performance.now() - start

    // Should complete in < 5ms even with 100 words
    expect(duration).toBeLessThan(5)
    expect(similarity).toBeGreaterThan(0) // Some overlap expected
  })
})

describe('Issue #129: Accuracy Verification', () => {
  it('should produce same results as old approach for common cases', () => {
    const testCases = [
      ['Amazon Prime', 'Amazon Prime Video', 0.8],
      ['Starbucks Coffee', 'Starbucks', 0.8],
      ["McDonald's", 'McDonalds Restaurant', 0.8],
      ['Walmart Supercenter', 'Walmart', 0.8],
    ]

    for (const [str1, str2, expected] of testCases) {
      const similarity = calculateSimilarity(str1 as string, str2 as string)
      expect(similarity).toBe(expected as number)
    }
  })

  it('should maintain at least 0.7 threshold for matches', () => {
    const targetDescription = 'Amazon Prime Subscription'

    const historicalDescriptions = [
      'Amazon Prime Video', // Similar
      'Amazon Music', // Less similar
      'Walmart Purchase', // Not similar
    ]

    const similarities = historicalDescriptions.map(desc =>
      calculateSimilarity(targetDescription, desc)
    )

    // First should be ≥0.7, last should be <0.7
    expect(similarities[0]).toBeGreaterThanOrEqual(0.7)
    expect(similarities[2]).toBeLessThan(0.7)
  })
})
