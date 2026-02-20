/**
 * Generate stable taxonomy with IDs and slugs for all 3 tiers
 * This creates the ML-ready, future-proof category structure
 */

import { MAJOR_CATEGORIES, SUBCATEGORIES } from '../lib/categories'

// Helper to create URL-safe slugs
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, '') // Trim underscores
}

// Generate unique IDs
function generateId(prefix: string, slug: string): string {
  return `${prefix}_${slug}`
}

interface SubCategoryData {
  id: string
  slug: string
  name: string
}

interface CategoryData {
  id: string
  slug: string
  name: string
  subCategories: SubCategoryData[]
}

interface MajorCategoryData {
  id: string
  slug: string
  name: string
  emoji: string
  categories: CategoryData[]
}

// Generate the complete taxonomy
export function generateTaxonomy(): MajorCategoryData[] {
  const taxonomy: MajorCategoryData[] = []

  for (const major of MAJOR_CATEGORIES) {
    const majorSlug = createSlug(major.name)
    const majorData: MajorCategoryData = {
      id: major.id, // Already have IDs for major categories
      slug: major.slug, // Already have slugs
      name: major.name,
      emoji: major.emoji,
      categories: [],
    }

    // Process each category (2nd tier)
    for (const categoryName of major.subcategories) {
      const categorySlug = createSlug(categoryName)
      const categoryData: CategoryData = {
        id: generateId('cat', categorySlug),
        slug: categorySlug,
        name: categoryName,
        subCategories: [],
      }

      // Process subcategories (3rd tier)
      const subCategoryNames = SUBCATEGORIES[categoryName] || []
      for (const subCategoryName of subCategoryNames) {
        const subCategorySlug = createSlug(subCategoryName)
        categoryData.subCategories.push({
          id: generateId('sub', subCategorySlug),
          slug: subCategorySlug,
          name: subCategoryName,
        })
      }

      majorData.categories.push(categoryData)
    }

    taxonomy.push(majorData)
  }

  return taxonomy
}

// Generate and print the taxonomy
if (require.main === module) {
  const taxonomy = generateTaxonomy()
  console.log(JSON.stringify(taxonomy, null, 2))

  // Stats
  const totalMajor = taxonomy.length
  const totalCategories = taxonomy.reduce((sum, m) => sum + m.categories.length, 0)
  const totalSubCategories = taxonomy.reduce(
    (sum, m) => sum + m.categories.reduce((catSum, c) => catSum + c.subCategories.length, 0),
    0
  )

  console.error(`\n📊 Taxonomy Stats:`)
  console.error(`   Major Categories: ${totalMajor}`)
  console.error(`   Categories: ${totalCategories}`)
  console.error(`   SubCategories: ${totalSubCategories}`)
  console.error(`   Total: ${totalMajor + totalCategories + totalSubCategories}`)
}

export default generateTaxonomy
