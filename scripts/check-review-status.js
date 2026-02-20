const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const statusCounts = await prisma.transaction.groupBy({
    by: ['reviewStatus'],
    _count: true,
  })

  console.log('Review status counts:')
  statusCounts.forEach(s => {
    console.log(`  ${s.reviewStatus || 'null'}: ${s._count}`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
