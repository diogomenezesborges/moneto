const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Find all transactions in review
  const reviewTransactions = await prisma.transaction.findMany({
    where: {
      reviewStatus: 'pending_review',
    },
    select: {
      id: true,
      rawDescription: true,
      origin: true,
    },
  })

  console.log(`Found ${reviewTransactions.length} transactions in review status`)

  if (reviewTransactions.length === 0) {
    console.log('No transactions to update')
    return
  }

  console.log('\nCurrent origins:')
  reviewTransactions.forEach(t => {
    console.log(`  ${t.rawDescription.substring(0, 50)} - Origin: ${t.origin}`)
  })

  // Update all to Comum
  const result = await prisma.transaction.updateMany({
    where: {
      reviewStatus: 'pending_review',
    },
    data: {
      origin: 'Comum',
    },
  })

  console.log(`\n✓ Updated ${result.count} transactions to origin: Comum`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
