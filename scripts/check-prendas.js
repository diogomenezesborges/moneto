const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const cats = await prisma.category.findMany({
    where: { name: 'Prendas' },
    include: {
      majorCategory: true,
      subCategories: true,
    },
  })

  console.log('Categories named "Prendas":')
  console.log(JSON.stringify(cats, null, 2))

  await prisma.$disconnect()
}

check()
