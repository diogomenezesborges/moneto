/**
 * Manually add the missing "Monetário" subcategory
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addMonetario() {
  console.log('Adding missing "Monetário" subcategory...\n')

  // Create the subcategory under Prendas
  const sub = await prisma.subCategory.upsert({
    where: { id: 'sub_monetario' },
    update: {
      name: 'Monetário',
      slug: 'monetario',
    },
    create: {
      id: 'sub_monetario',
      categoryId: 'cat_prendas', // Points to Prendas under Rendimento Extra
      slug: 'monetario',
      name: 'Monetário',
      userId: null,
    },
  })

  console.log('✅ Created subcategory:', sub)

  await prisma.$disconnect()
}

addMonetario()
