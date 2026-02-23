/**
 * Category Mapper - 2-Level Taxonomy (Major → Category)
 * Handles bidirectional mapping between names and IDs
 * Subcategories removed - use tags instead!
 */

import { prisma } from './db'

// Cache for performance
let categoryCache: {
  majorByName: Map<
    string,
    {
      id: string
      slug: string
      nameEn: string | null
      budgetCategory: string | null
      sortOrder: number
      emoji: string | null
    }
  >
  categoryByKey: Map<
    string,
    {
      id: string
      slug: string
      majorId: string
      nameEn: string | null
      icon: string | null
      sortOrder: number
    }
  >

  majorById: Map<
    string,
    {
      name: string
      slug: string
      nameEn: string | null
      budgetCategory: string | null
      sortOrder: number
      emoji: string | null
    }
  >
  categoryById: Map<
    string,
    {
      name: string
      slug: string
      majorId: string
      nameEn: string | null
      icon: string | null
      sortOrder: number
    }
  >

  lastRefresh: number
} | null = null

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Refresh the category cache from database
 */
async function refreshCache() {
  const [majors, categories] = await Promise.all([
    prisma.majorCategory.findMany({ where: { userId: null }, orderBy: { sortOrder: 'asc' } }),
    prisma.category.findMany({ where: { userId: null }, orderBy: { sortOrder: 'asc' } }),
  ])

  // For categoryByKey, we use majorId+name as key to handle duplicate names across majors
  const categoryByKey = new Map<
    string,
    {
      id: string
      slug: string
      majorId: string
      nameEn: string | null
      icon: string | null
      sortOrder: number
    }
  >()
  for (const c of categories) {
    const key = `${c.majorCategoryId}|${c.name}`
    categoryByKey.set(key, {
      id: c.id,
      slug: c.slug,
      majorId: c.majorCategoryId,
      nameEn: c.nameEn,
      icon: c.icon,
      sortOrder: c.sortOrder,
    })
  }

  categoryCache = {
    majorByName: new Map(
      majors.map(m => [
        m.name,
        {
          id: m.id,
          slug: m.slug,
          nameEn: m.nameEn,
          budgetCategory: m.budgetCategory,
          sortOrder: m.sortOrder,
          emoji: m.emoji,
        },
      ])
    ),
    categoryByKey,

    majorById: new Map(
      majors.map(m => [
        m.id,
        {
          name: m.name,
          slug: m.slug,
          nameEn: m.nameEn,
          budgetCategory: m.budgetCategory,
          sortOrder: m.sortOrder,
          emoji: m.emoji,
        },
      ])
    ),
    categoryById: new Map(
      categories.map(c => [
        c.id,
        {
          name: c.name,
          slug: c.slug,
          majorId: c.majorCategoryId,
          nameEn: c.nameEn,
          icon: c.icon,
          sortOrder: c.sortOrder,
        },
      ])
    ),

    lastRefresh: Date.now(),
  }
}

/**
 * Get cache, refreshing if needed
 */
async function getCache() {
  if (!categoryCache || Date.now() - categoryCache.lastRefresh > CACHE_TTL) {
    await refreshCache()
  }
  return categoryCache!
}

/**
 * Convert category names to IDs (2-level only)
 */
export async function namesToIds(
  majorName?: string | null,
  categoryName?: string | null
): Promise<{
  majorCategoryId?: string | null
  categoryId?: string | null
}> {
  if (!majorName && !categoryName) {
    return {}
  }

  const cache = await getCache()

  const result: {
    majorCategoryId?: string | null
    categoryId?: string | null
  } = {}

  if (majorName) {
    const major = cache.majorByName.get(majorName)
    result.majorCategoryId = major?.id || null

    // Only look up category if we have a major (to use composite key)
    if (major && categoryName) {
      const key = `${major.id}|${categoryName}`
      const category = cache.categoryByKey.get(key)
      result.categoryId = category?.id || null
    }
  }

  return result
}

/**
 * Convert IDs to category names (2-level only)
 */
export async function idsToNames(
  majorId?: string | null,
  categoryId?: string | null
): Promise<{
  majorCategory?: string | null
  category?: string | null
}> {
  if (!majorId && !categoryId) {
    return {}
  }

  const cache = await getCache()

  const result: {
    majorCategory?: string | null
    category?: string | null
  } = {}

  if (majorId) {
    const major = cache.majorById.get(majorId)
    result.majorCategory = major?.name || null
  }

  if (categoryId) {
    const category = cache.categoryById.get(categoryId)
    result.category = category?.name || null
  }

  return result
}

/**
 * Get all categories with IDs (2-level only, for dropdowns)
 */
export async function getAllCategoriesWithIds() {
  const cache = await getCache()

  const taxonomy: Array<{
    id: string
    name: string
    nameEn: string | null
    slug: string
    emoji: string | null
    budgetCategory: string | null
    sortOrder: number
    categories: Array<{
      id: string
      name: string
      nameEn: string | null
      slug: string
      icon: string | null
      sortOrder: number
    }>
  }> = []

  // Sort majors by sortOrder
  const sortedMajors = Array.from(cache.majorById.entries()).sort(
    (a, b) => a[1].sortOrder - b[1].sortOrder
  )

  for (const [majorId, major] of sortedMajors) {
    const categoriesForMajor = Array.from(cache.categoryById.entries())
      .filter(([_, cat]) => cat.majorId === majorId)
      .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
      .map(([catId, cat]) => ({
        id: catId,
        name: cat.name,
        nameEn: cat.nameEn,
        slug: cat.slug,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      }))

    taxonomy.push({
      id: majorId,
      name: major.name,
      nameEn: major.nameEn,
      slug: major.slug,
      emoji: major.emoji,
      budgetCategory: major.budgetCategory,
      sortOrder: major.sortOrder,
      categories: categoriesForMajor,
    })
  }

  return taxonomy
}

/**
 * Force refresh the cache
 */
export async function refreshCategoryCache() {
  await refreshCache()
}
