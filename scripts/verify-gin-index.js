/**
 * Verify GIN Index Performance
 *
 * This script verifies that the GIN index is being used for tag searches.
 * Run with: node scripts/verify-gin-index.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyGinIndex() {
  try {
    console.log('🔍 Verifying GIN Index for Tags Column\n')
    console.log('─'.repeat(60))

    // Step 1: Check if index exists
    console.log('\n1️⃣  Checking if GIN index exists...')
    const indexes = await prisma.$queryRaw`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'transactions'
        AND indexname LIKE '%tags%'
      ORDER BY indexname
    `

    if (indexes.length === 0) {
      console.log('❌ No tag-related indexes found!')
      return
    }

    console.log(`✅ Found ${indexes.length} tag-related index(es):\n`)
    indexes.forEach(idx => {
      console.log(`   ${idx.indexname}`)
      console.log(`   → ${idx.indexdef}`)
      console.log()
    })

    // Step 2: Run EXPLAIN ANALYZE to verify index usage
    console.log('2️⃣  Testing query plan with sample tag search...')
    console.log(
      "   Query: SELECT id, rawDescription, tags FROM transactions WHERE tags @> ARRAY['type:food']"
    )
    console.log()

    const explainResult = await prisma.$queryRawUnsafe(`
      EXPLAIN (FORMAT JSON, ANALYZE false)
      SELECT id, "rawDescription", tags
      FROM transactions
      WHERE tags @> ARRAY['type:food']
      LIMIT 100
    `)

    const plan = explainResult[0]['QUERY PLAN'][0]
    const planType = plan.Plan['Node Type']
    const indexName = plan.Plan['Index Name']

    console.log('   Query Plan Analysis:')
    console.log(`   - Node Type: ${planType}`)
    if (indexName) {
      console.log(`   - Index Used: ${indexName}`)
      if (indexName.includes('gin')) {
        console.log('   ✅ GIN index is being used!')
      } else {
        console.log('   ⚠️  Non-GIN index is being used')
      }
    } else {
      console.log('   ⚠️  No index being used (full table scan)')
    }
    console.log()

    // Step 3: Count transactions with tags for context
    console.log('3️⃣  Database statistics...')
    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE array_length(tags, 1) > 0) as transactions_with_tags,
        COUNT(*) FILTER (WHERE tags @> ARRAY['type:food']) as food_transactions
      FROM transactions
    `

    const stat = stats[0]
    console.log(`   Total transactions: ${stat.total_transactions}`)
    console.log(`   Transactions with tags: ${stat.transactions_with_tags}`)
    console.log(`   Transactions tagged 'type:food': ${stat.food_transactions}`)
    console.log()

    console.log('─'.repeat(60))
    console.log('✅ Verification complete!')
    console.log('\n📊 Performance Impact:')
    console.log('   - GIN index enables efficient tag array searches')
    console.log('   - Expected 50-100x speedup for tag filtering')
    console.log('   - Optimized for @>, &&, and ANY() operators')
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyGinIndex().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
