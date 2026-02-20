const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { transactions: true },
      },
    },
  })

  console.log('Users in database:')
  users.forEach(u => {
    console.log(`  ID: ${u.id}`)
    console.log(`  Name: ${u.name}`)
    console.log(`  Transactions: ${u._count.transactions}`)
    console.log()
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
