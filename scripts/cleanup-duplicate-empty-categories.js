const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Remove duplicate categories that have 0 subcategories
 * Keep only the categories with subcategories
 */

async function cleanup() {
  console.log('🧹 Cleaning up duplicate categories with 0 subcategories...\n')

  // Get all categories grouped by name
  const allCategories = await prisma.category.findMany({
    include: {
      subCategories: true,
      majorCategory: true,
    },
    orderBy: { name: 'asc' },
  })

  // Group by category name
  const grouped = {}
  allCategories.forEach(cat => {
    if (!grouped[cat.name]) {
      grouped[cat.name] = []
    }
    grouped[cat.name].push(cat)
  })

  let deletedCount = 0

  // For each category name, if there are duplicates, keep only ones with subcategories
  for (const [catName, categories] of Object.entries(grouped)) {
    if (categories.length > 1) {
      console.log(`\n${catName}: ${categories.length} instances found`)

      // Find categories with subcategories and those without
      const withSubs = categories.filter(c => c.subCategories.length > 0)
      const withoutSubs = categories.filter(c => c.subCategories.length === 0)

      if (withoutSubs.length > 0) {
        console.log(`  Found ${withoutSubs.length} empty duplicate(s)`)

        for (const emptyCat of withoutSubs) {
          console.log(
            `  ❌ Deleting: ${emptyCat.id} (${emptyCat.majorCategory.name} > ${emptyCat.name}, 0 subs)`
          )
          await prisma.category.delete({ where: { id: emptyCat.id } })
          deletedCount++
        }
      } else {
        console.log(`  ✓ All instances have subcategories, keeping all`)
      }
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} empty duplicate categories.`)
}

cleanup()
  .catch(e => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
