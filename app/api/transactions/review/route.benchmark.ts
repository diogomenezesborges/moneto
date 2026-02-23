/**
 * Benchmark for Bug #5: N+1 Query Performance Optimization
 *
 * Compares performance between:
 * - OLD: Promise.all with individual findUnique calls (N+1 pattern)
 * - NEW: Single batch query with HashMap lookup
 *
 * Run with: npx tsx app/api/transactions/review/route.benchmark.ts
 */

interface Transaction {
  id: string
  potentialDuplicateId: string | null
  description: string
  amount: number
}

interface Duplicate {
  id: string
  description: string
  amount: number
}

// ============================================================================
// OLD APPROACH (N+1 Anti-Pattern)
// ============================================================================

async function oldApproach_N_Plus_1(
  transactions: Transaction[],
  findUnique: (id: string) => Promise<Duplicate | null>
): Promise<any[]> {
  const start = performance.now()

  const transactionsWithDuplicateInfo = await Promise.all(
    transactions.map(async transaction => {
      if (transaction.potentialDuplicateId) {
        const duplicateOf = await findUnique(transaction.potentialDuplicateId)
        return { ...transaction, duplicateOf }
      }
      return transaction
    })
  )

  const duration = performance.now() - start
  return [transactionsWithDuplicateInfo, duration]
}

// ============================================================================
// NEW APPROACH (Batch Query + HashMap)
// ============================================================================

async function newApproach_BatchQuery(
  transactions: Transaction[],
  findMany: (ids: string[]) => Promise<Duplicate[]>
): Promise<any[]> {
  const start = performance.now()

  // PERFORMANCE FIX: Fetch all duplicate transactions in a SINGLE query
  const potentialDuplicateIds = transactions
    .map(t => t.potentialDuplicateId)
    .filter((id): id is string => id !== null)

  const duplicates = potentialDuplicateIds.length > 0 ? await findMany(potentialDuplicateIds) : []

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

  const duration = performance.now() - start
  return [transactionsWithDuplicateInfo, duration]
}

// ============================================================================
// Mock Database Functions
// ============================================================================

function createMockDatabase(duplicates: Duplicate[]) {
  const duplicatesMap = new Map(duplicates.map(d => [d.id, d]))
  let queryCount = 0

  return {
    // Old approach: Individual queries
    findUnique: async (id: string): Promise<Duplicate | null> => {
      queryCount++
      // Simulate database latency
      await new Promise(resolve => setTimeout(resolve, 1))
      return duplicatesMap.get(id) || null
    },

    // New approach: Batch query
    findMany: async (ids: string[]): Promise<Duplicate[]> => {
      queryCount++
      // Simulate database latency
      await new Promise(resolve => setTimeout(resolve, 2))
      return ids.map(id => duplicatesMap.get(id)).filter((d): d is Duplicate => d !== null)
    },

    getQueryCount: () => queryCount,
    resetQueryCount: () => {
      queryCount = 0
    },
  }
}

// ============================================================================
// Benchmark Runner
// ============================================================================

async function runBenchmark(transactionCount: number, duplicatePercentage: number = 0.7) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(
    `Benchmarking with ${transactionCount} transactions (${duplicatePercentage * 100}% with duplicates)`
  )
  console.log('='.repeat(70))

  // Generate test data
  const transactions: Transaction[] = Array.from({ length: transactionCount }, (_, i) => ({
    id: `txn-${i}`,
    potentialDuplicateId: Math.random() < duplicatePercentage ? `dup-${i}` : null,
    description: `Transaction ${i}`,
    amount: 100 + i,
  }))

  const duplicates: Duplicate[] = Array.from({ length: transactionCount }, (_, i) => ({
    id: `dup-${i}`,
    description: `Duplicate ${i}`,
    amount: 100 + i,
  }))

  const duplicateCount = transactions.filter(t => t.potentialDuplicateId !== null).length

  console.log(`\nGenerated ${transactionCount} transactions:`)
  console.log(`  - With duplicates: ${duplicateCount}`)
  console.log(`  - Without duplicates: ${transactionCount - duplicateCount}`)

  // ============================
  // OLD APPROACH (N+1)
  // ============================

  const db1 = createMockDatabase(duplicates)
  const [result1, duration1] = await oldApproach_N_Plus_1(transactions, db1.findUnique)
  const queryCount1 = db1.getQueryCount()

  console.log(`\n🔴 OLD APPROACH (N+1 Anti-Pattern):`)
  console.log(`  - Query count: ${queryCount1} (1 + ${duplicateCount})`)
  console.log(`  - Duration: ${duration1.toFixed(2)}ms`)
  console.log(`  - Avg time per query: ${(duration1 / queryCount1).toFixed(2)}ms`)

  // ============================
  // NEW APPROACH (Batch + HashMap)
  // ============================

  const db2 = createMockDatabase(duplicates)
  const [result2, duration2] = await newApproach_BatchQuery(transactions, db2.findMany)
  const queryCount2 = db2.getQueryCount()

  console.log(`\n🟢 NEW APPROACH (Batch Query + HashMap):`)
  console.log(`  - Query count: ${queryCount2} (always 1, regardless of transaction count)`)
  console.log(`  - Duration: ${duration2.toFixed(2)}ms`)
  console.log(`  - Avg time per query: ${(duration2 / queryCount2).toFixed(2)}ms`)

  // ============================
  // COMPARISON
  // ============================

  const queryReduction = ((queryCount1 - queryCount2) / queryCount1) * 100
  const speedup = duration1 / duration2
  const timeReduction = ((duration1 - duration2) / duration1) * 100

  console.log(`\n📊 PERFORMANCE IMPROVEMENT:`)
  console.log(
    `  - Query reduction: ${queryReduction.toFixed(1)}% (${queryCount1} → ${queryCount2})`
  )
  console.log(`  - Speedup: ${speedup.toFixed(2)}x faster`)
  console.log(
    `  - Time reduction: ${timeReduction.toFixed(1)}% (${duration1.toFixed(2)}ms → ${duration2.toFixed(2)}ms)`
  )

  // ============================
  // VERIFICATION
  // ============================

  console.log(`\n✅ VERIFICATION:`)
  console.log(`  - Results match: ${JSON.stringify(result1) === JSON.stringify(result2)}`)
  console.log(`  - Result count: ${result1.length}`)

  return {
    transactionCount,
    duplicateCount,
    oldQueries: queryCount1,
    newQueries: queryCount2,
    oldDuration: duration1,
    newDuration: duration2,
    queryReduction,
    speedup,
    timeReduction,
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('\n')
  console.log('█'.repeat(70))
  console.log('█ BUG #5: N+1 QUERY OPTIMIZATION BENCHMARK')
  console.log('█ Review Endpoint Performance Comparison')
  console.log('█'.repeat(70))

  const results = []

  // Run benchmarks with different transaction counts
  results.push(await runBenchmark(10, 0.7))
  results.push(await runBenchmark(50, 0.7))
  results.push(await runBenchmark(100, 0.7))
  results.push(await runBenchmark(500, 0.7))
  results.push(await runBenchmark(1000, 0.7))

  // Summary table
  console.log(`\n\n${'='.repeat(70)}`)
  console.log('BENCHMARK SUMMARY')
  console.log('='.repeat(70))
  console.log(
    '\n| Transactions | Duplicates | Old Queries | New Queries | Query Reduction | Speedup |'
  )
  console.log('|-------------|-----------|-------------|-------------|-----------------|---------|')

  results.forEach(r => {
    console.log(
      `| ${String(r.transactionCount).padStart(11)} | ${String(r.duplicateCount).padStart(9)} | ${String(r.oldQueries).padStart(11)} | ${String(r.newQueries).padStart(11)} | ${(r.queryReduction.toFixed(1) + '%').padStart(15)} | ${(r.speedup.toFixed(2) + 'x').padStart(7)} |`
    )
  })

  console.log('\n')
  console.log('✅ CONCLUSION:')
  console.log('The NEW approach maintains constant query count (1) regardless of data size,')
  console.log('while the OLD approach scales linearly (N+1). This fix eliminates a critical')
  console.log('performance bottleneck in the Review endpoint.')
  console.log('\n')
}

// Run benchmark
main().catch(console.error)
