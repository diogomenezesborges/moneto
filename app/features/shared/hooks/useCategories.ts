/**
 * useCategories Hook
 *
 * Fetches and manages category taxonomy data.
 */

'use client'

import { useState, useEffect } from 'react'

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

interface UseCategoriesProps {
  token: string
  isAuthenticated: boolean
}

export function useCategories({ token, isAuthenticated }: UseCategoriesProps) {
  const [taxonomy, setTaxonomy] = useState<MajorCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !token) return

    const loadTaxonomy = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/categories/manage', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setTaxonomy(data.taxonomy || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load categories'
        setError(errorMessage)
        console.error('Failed to load taxonomy:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTaxonomy()
  }, [token, isAuthenticated])

  // Extract all major categories
  const majorCategories = taxonomy.map(mc => ({
    id: mc.id,
    name: mc.name,
    nameEn: mc.nameEn,
    emoji: mc.emoji,
    slug: mc.slug,
  }))

  // Extract all categories (flattened)
  const allCategories = taxonomy.flatMap(mc =>
    mc.categories.map(cat => ({
      ...cat,
      majorCategoryId: mc.id,
      majorCategoryName: mc.name,
    }))
  )

  // Get categories for a specific major category
  const getCategoriesForMajor = (majorCategoryId: string) => {
    const major = taxonomy.find(mc => mc.id === majorCategoryId)
    return major?.categories || []
  }

  return {
    taxonomy,
    majorCategories,
    allCategories,
    loading,
    error,
    getCategoriesForMajor,
  }
}
