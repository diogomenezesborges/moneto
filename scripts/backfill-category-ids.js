/**
 * Backfill script to populate category ID fields for existing transactions
 * This migrates from text-based categories to ID-based categories
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Cache for category lookups
let categoryCache = null

async function loadCategoryCache() {
  const [majors, categories, subCategories] = await Promise.all([
    prisma.majorCategory.findMany({ where: { userId: null } }),
    prisma.category.findMany({ where: { userId: null } }),
    prisma.subCategory.findMany({ where: { userId: null } }),
  ])

  categoryCache = {
    majorByName: new Map(majors.map(m => [m.name, { id: m.id, slug: m.slug }])),
    categoryByName: new Map(
      categories.map(c => [c.name, { id: c.id, slug: c.slug, majorId: c.majorCategoryId }])
    ),
    subCategoryByName: new Map(
      subCategories.map(s => [s.name, { id: s.id, slug: s.slug, categoryId: s.categoryId }])
    ),
  }

  console.log(
    `✓ Loaded category cache: ${majors.length} majors, ${categories.length} categories, ${subCategories.length} subcategories`
  )
}

function namesToIds(majorName, categoryName, subCategoryName) {
  const result = {}

  if (majorName) {
    const major = categoryCache.majorByName.get(majorName)
    if (major) {
      result.majorCategoryId = major.id
    }
  }

  if (categoryName) {
    const category = categoryCache.categoryByName.get(categoryName)
    if (category) {
      result.categoryId = category.id
    }
  }

  if (subCategoryName) {
    const subCategory = categoryCache.subCategoryByName.get(subCategoryName)
    if (subCategory) {
      result.subCategoryId = subCategory.id
    }
  }

  return result
}

async function backfillCategoryIds() {
  console.log('🔄 Starting category ID backfill...\n')

  // Load category cache
  await loadCategoryCache()

  // Find all transactions with text categories but missing ID fields
  const transactionsToBackfill = await prisma.transaction.findMany({
    where: {
      OR: [
        // Has majorCategory text but missing ID
        {
          AND: [{ majorCategory: { not: null } }, { majorCategoryId: null }],
        },
        // Has category text but missing ID
        {
          AND: [{ category: { not: null } }, { categoryId: null }],
        },
        // Has subCategory text but missing ID
        {
          AND: [{ subCategory: { not: null } }, { subCategoryId: null }],
        },
      ],
    },
    select: {
      id: true,
      majorCategory: true,
      category: true,
      subCategory: true,
      majorCategoryId: true,
      categoryId: true,
      subCategoryId: true,
    },
  })

  console.log(`Found ${transactionsToBackfill.length} transactions to backfill\n`)

  if (transactionsToBackfill.length === 0) {
    console.log('✅ No transactions need backfilling!')
    return
  }

  let successCount = 0
  let partialCount = 0
  let failCount = 0
  const unmatchedCategories = new Set()

  for (const transaction of transactionsToBackfill) {
    const categoryIds = namesToIds(
      transaction.majorCategory,
      transaction.category,
      transaction.subCategory
    )

    // Check if we found all the IDs for the text categories provided
    const hasAllIds =
      (!transaction.majorCategory || categoryIds.majorCategoryId) &&
      (!transaction.category || categoryIds.categoryId) &&
      (!transaction.subCategory || categoryIds.subCategoryId)

    if (!hasAllIds) {
      // Track unmatched categories for reporting
      if (transaction.majorCategory && !categoryIds.majorCategoryId) {
        unmatchedCategories.add(`Major: "${transaction.majorCategory}"`)
      }
      if (transaction.category && !categoryIds.categoryId) {
        unmatchedCategories.add(`Category: "${transaction.category}"`)
      }
      if (transaction.subCategory && !categoryIds.subCategoryId) {
        unmatchedCategories.add(`SubCategory: "${transaction.subCategory}"`)
      }
    }

    // Update the transaction with whatever IDs we found
    try {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: categoryIds,
      })

      if (Object.keys(categoryIds).length === 0) {
        failCount++
      } else if (!hasAllIds) {
        partialCount++
      } else {
        successCount++
      }
    } catch (error) {
      console.error(`  ❌ Failed to update transaction ${transaction.id}:`, error.message)
      failCount++
    }
  }

  console.log('\n📊 Backfill Results:')
  console.log(`   ✅ Success (all IDs matched): ${successCount}`)
  console.log(`   ⚠️  Partial (some IDs matched): ${partialCount}`)
  console.log(`   ❌ Failed (no IDs matched): ${failCount}`)
  console.log(`   📝 Total processed: ${transactionsToBackfill.length}`)

  if (unmatchedCategories.size > 0) {
    console.log('\n⚠️  Unmatched categories found:')
    Array.from(unmatchedCategories)
      .sort()
      .forEach(cat => {
        console.log(`   - ${cat}`)
      })
    console.log('\n💡 These categories may need to be added to the taxonomy or corrected.')
  }

  console.log('\n✅ Backfill complete!')
}

backfillCategoryIds()
  .catch(e => {
    console.error('❌ Backfill failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
