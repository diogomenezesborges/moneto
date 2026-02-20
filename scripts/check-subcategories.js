const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const subs = await prisma.transaction.groupBy({
    by: ['subCategory'],
    where: { subCategory: { not: null } },
    _count: true,
    orderBy: { _count: { subCategory: 'desc' } },
  })
  console.log('Distinct subCategories:', subs.length)
  subs.forEach(s => console.log(s._count, '|', s.subCategory))

  const totalWithSub = await prisma.transaction.count({ where: { subCategory: { not: null } } })
  console.log('\nTotal with subCategory:', totalWithSub)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
