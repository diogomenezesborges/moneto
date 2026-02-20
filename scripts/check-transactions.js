const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.transaction.count()
  console.log(`Total transactions: ${count}`)

  if (count > 0) {
    const sample = await prisma.transaction.findMany({
      take: 5,
      orderBy: { rawDate: 'desc' },
      select: {
        id: true,
        rawDate: true,
        rawDescription: true,
        rawAmount: true,
        majorCategory: true,
        category: true,
        subCategory: true,
      },
    })
    console.log('\nSample transactions:')
    console.log(JSON.stringify(sample, null, 2))
  }

  const users = await prisma.user.count()
  console.log(`\nTotal users: ${users}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
