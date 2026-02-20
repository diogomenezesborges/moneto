const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDateFormat() {
  const transaction = await prisma.transaction.findFirst({
    orderBy: { rawDate: 'desc' },
  })

  if (transaction) {
    console.log('Latest transaction:')
    console.log('rawDate from DB:', transaction.rawDate)
    console.log('ISO format:', transaction.rawDate.toISOString())
    console.log(
      'pt-PT formatted:',
      transaction.rawDate.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    )
    console.log('Description:', transaction.rawDescription)
  }

  await prisma.$disconnect()
}

checkDateFormat()
