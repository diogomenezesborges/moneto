const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateComumToCouple() {
  console.log('🔄 Updating "Comum" to "Couple" in all transactions...\n')

  try {
    // Update all transactions with origin "Comum" to "Couple"
    const result = await prisma.transaction.updateMany({
      where: {
        origin: 'Comum',
      },
      data: {
        origin: 'Couple',
      },
    })

    console.log(`✅ Updated ${result.count} transactions from "Comum" to "Couple"`)

    // Show a sample of updated transactions
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        origin: 'Couple',
      },
      take: 5,
      orderBy: {
        rawDate: 'desc',
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

    if (updatedTransactions.length > 0) {
      console.log('\n📋 Sample of transactions with "Couple" origin:')
      updatedTransactions.forEach(t => {
        console.log(
          `  - ${t.rawDate.toISOString().split('T')[0]} | ${t.bank} | ${t.rawDescription} | €${t.rawAmount} | Origin: ${t.origin}`
        )
      })
    }

    // Count transactions by origin
    console.log('\n📊 Transaction count by origin:')
    const origins = await prisma.transaction.groupBy({
      by: ['origin'],
      _count: {
        origin: true,
      },
    })

    origins.forEach(({ origin, _count }) => {
      console.log(`  ${origin}: ${_count.origin} transactions`)
    })
  } catch (error) {
    console.error('❌ Error updating transactions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateComumToCouple().catch(error => {
  console.error(error)
  process.exit(1)
})
