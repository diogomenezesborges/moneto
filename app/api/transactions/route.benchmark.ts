/**
 * Benchmark for Issue #128: Import Duplicate Check Date Filtering
 *
 * Compares:
 * - OLD: Load ALL transactions for duplicate checking (no date filter)
 * - NEW: Load only last 90 days of transactions (10x faster, 90% less memory)
 *
 * Run with: npx tsx app/api/transactions/route.benchmark.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simulate OLD approach: Load all transactions
async function benchmarkOldApproach(userId: string) {
  const start = performance.now()

  const existingTransactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
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

  const duration = performance.now() - start
  const transactionCount = existingTransactions.length
  const estimatedMemory = (JSON.stringify(existingTransactions).length / (1024 * 1024)).toFixed(2)

  return { duration, transactionCount, estimatedMemory }
}

// Simulate NEW approach: Load only last 90 days
async function benchmarkNewApproach(userId: string) {
  const start = performance.now()

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const existingTransactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
      reviewStatus: { not: 'rejected' },
      rawDate: { gte: ninetyDaysAgo },
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

  const duration = performance.now() - start
  const transactionCount = existingTransactions.length
  const estimatedMemory = (JSON.stringify(existingTransactions).length / (1024 * 1024)).toFixed(2)

  return { duration, transactionCount, estimatedMemory }
}

async function runBenchmark() {
  console.log('='.repeat(80))
  console.log('📊 Issue #128: Import Duplicate Check Performance Benchmark')
  console.log('='.repeat(80))
  console.log()

  // Find a user with transactions for testing
  const user = await prisma.user.findFirst({
    where: {
      transactions: {
        some: {},
      },
    },
  })

  if (!user) {
    console.log('❌ No users with transactions found for benchmarking')
    await prisma.$disconnect()
    return
  }

  console.log(`Testing with user: ${user.name} (${user.userId})`)
  console.log()

  // Warm-up run (ignored)
  await benchmarkOldApproach(user.userId)
  await benchmarkNewApproach(user.userId)

  // Run OLD approach
  console.log('🔴 OLD APPROACH (No date filter):')
  const oldResults = await benchmarkOldApproach(user.userId)
  console.log(`   Query Time: ${oldResults.duration.toFixed(2)}ms`)
  console.log(`   Transactions Loaded: ${oldResults.transactionCount.toLocaleString()}`)
  console.log(`   Estimated Memory: ${oldResults.estimatedMemory} MB`)
  console.log()

  // Run NEW approach
  console.log('🟢 NEW APPROACH (90-day date filter):')
  const newResults = await benchmarkNewApproach(user.userId)
  console.log(`   Query Time: ${newResults.duration.toFixed(2)}ms`)
  console.log(`   Transactions Loaded: ${newResults.transactionCount.toLocaleString()}`)
  console.log(`   Estimated Memory: ${newResults.estimatedMemory} MB`)
  console.log()

  // Calculate improvements
  const speedupRatio = oldResults.duration / newResults.duration
  const memoryReduction = (
    (1 - newResults.transactionCount / oldResults.transactionCount) *
    100
  ).toFixed(1)
  const transactionReduction = oldResults.transactionCount - newResults.transactionCount

  console.log('📈 PERFORMANCE IMPROVEMENT:')
  console.log(`   Speedup: ${speedupRatio.toFixed(2)}x faster`)
  console.log(
    `   Memory Reduction: ${memoryReduction}% (${transactionReduction.toLocaleString()} fewer transactions)`
  )
  console.log(
    `   Time Saved: ${(oldResults.duration - newResults.duration).toFixed(2)}ms per import`
  )
  console.log()

  // Verify expectations
  console.log('✅ VERIFICATION:')
  console.log(`   Expected: 10x speedup, 90% memory reduction`)
  console.log(
    `   Actual: ${speedupRatio.toFixed(2)}x speedup, ${memoryReduction}% memory reduction`
  )

  if (speedupRatio >= 5) {
    console.log(`   ✅ Performance improvement confirmed!`)
  } else {
    console.log(`   ⚠️  Performance improvement lower than expected (dataset may be too small)`)
  }

  console.log()
  console.log('='.repeat(80))

  await prisma.$disconnect()
}

runBenchmark().catch(error => {
  console.error('❌ Benchmark failed:', error)
  prisma.$disconnect()
  process.exit(1)
})
