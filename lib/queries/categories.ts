/**
 * Category Queries (TanStack Query)
 *
 * Hooks for fetching category taxonomy data.
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore, getAuthHeaders } from '@/lib/stores/authStore'

// Types
export interface Category {
  id: string
  name: string
  nameEn?: string | null
  slug: string
  icon?: string | null
}

export interface MajorCategory {
  id: string
  name: string
  nameEn?: string | null
  emoji?: string | null
  slug: string
  budgetCategory?: string | null
  categories: Category[]
}

export interface TaxonomyResponse {
  taxonomy: MajorCategory[]
}

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  taxonomy: () => [...categoryKeys.all, 'taxonomy'] as const,
}

/**
 * Fetch category taxonomy
 */
async function fetchTaxonomy(): Promise<TaxonomyResponse> {
  const response = await fetch('/api/categories/manage', {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }

  return response.json()
}

/**
 * Hook to fetch category taxonomy
 */
export function useCategories() {
  const { isAuthenticated, token } = useAuthStore()

  const query = useQuery({
    queryKey: categoryKeys.taxonomy(),
    queryFn: fetchTaxonomy,
    enabled: isAuthenticated && !!token,
    // Categories rarely change, cache longer
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Derived data
  const taxonomy = query.data?.taxonomy || []

  const majorCategories = taxonomy.map(mc => ({
    id: mc.id,
    name: mc.name,
    nameEn: mc.nameEn,
    emoji: mc.emoji,
    slug: mc.slug,
  }))

  const allCategories = taxonomy.flatMap(mc =>
    mc.categories.map(cat => ({
      ...cat,
      majorCategoryId: mc.id,
      majorCategoryName: mc.name,
    }))
  )

  const getCategoriesForMajor = (majorCategoryId: string) => {
    const major = taxonomy.find(mc => mc.id === majorCategoryId)
    return major?.categories || []
  }

  return {
    ...query,
    taxonomy,
    majorCategories,
    allCategories,
    getCategoriesForMajor,
  }
}
