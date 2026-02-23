const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Cleanup old merged category records that don't have major category prefix in their ID
 * These are leftover from before the seed script was fixed
 */

const DUPLICATE_CATEGORY_NAMES = [
  'Prendas',
  'Cuidados Pessoais',
  'Subscrições',
  'Alimentação',
  'Transportes',
  'Casa',
  'Axl',
  'Lazer',
]

async function cleanup() {
  console.log('🧹 Cleaning up old merged category records...\n')

  for (const catName of DUPLICATE_CATEGORY_NAMES) {
    const cats = await prisma.category.findMany({
      where: { name: catName },
      select: { id: true, majorCategoryId: true },
    })

    console.log(`${catName}: ${cats.length} records found`)

    // Old IDs are like "cat_prendas", new IDs are like "cat_rendimento_extra_prendas"
    const oldRecords = cats.filter(c => {
      const parts = c.id.split('_')
      // Old format: cat_<slug> (2 parts)
      // New format: cat_<major>_<slug> (3+ parts)
      return parts.length === 2
    })

    if (oldRecords.length > 0) {
      console.log(`  ❌ Deleting ${oldRecords.length} old merged record(s):`)
      for (const old of oldRecords) {
        console.log(`     - ${old.id}`)
        await prisma.category.delete({ where: { id: old.id } })
      }
    } else {
      console.log(`  ✓ No old records to delete`)
    }
    console.log('')
  }

  console.log('✅ Cleanup complete!')
}

cleanup()
  .catch(e => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
