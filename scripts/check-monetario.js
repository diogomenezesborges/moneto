const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const subs = await prisma.subCategory.findMany({
    where: {
      OR: [{ name: 'Monetário' }, { name: { contains: 'Monet', mode: 'insensitive' } }],
    },
  })

  console.log('SubCategories matching "Monetário":')
  console.log(JSON.stringify(subs, null, 2))

  // Also check transactions
  const txs = await prisma.transaction.findMany({
    where: { subCategory: 'Monetário' },
    select: {
      id: true,
      majorCategory: true,
      category: true,
      subCategory: true,
    },
    take: 5,
  })

  console.log('\nTransactions with "Monetário":')
  console.log(JSON.stringify(txs, null, 2))

  await prisma.$disconnect()
}

check()
