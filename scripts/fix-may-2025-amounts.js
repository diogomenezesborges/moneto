const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixMay2025Amounts() {
  try {
    // Find all transactions from May 2025
    const startDate = new Date('2025-05-01')
    const endDate = new Date('2025-06-01')

    const transactions = await prisma.transaction.findMany({
      where: {
        rawDate: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { rawDate: 'asc' },
    })

    console.log(`Found ${transactions.length} transactions in May 2025`)
    console.log('')

    let updated = 0
    let alreadyNegative = 0

    for (const tx of transactions) {
      if (tx.rawAmount > 0) {
        // Convert to negative
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { rawAmount: -tx.rawAmount },
        })
        console.log(
          `✅ Updated: ${tx.rawDate.toISOString().split('T')[0]} - ${tx.rawDescription} - ${tx.rawAmount} → ${-tx.rawAmount}`
        )
        updated++
      } else {
        console.log(
          `⏭️  Already negative: ${tx.rawDate.toISOString().split('T')[0]} - ${tx.rawDescription} - ${tx.rawAmount}`
        )
        alreadyNegative++
      }
    }

    console.log('')
    console.log(`Done! Updated ${updated} transactions, ${alreadyNegative} were already negative.`)
  } catch (error) {
    console.error('Error fixing amounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMay2025Amounts()
