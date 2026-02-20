import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { MAJOR_CATEGORIES, SUBCATEGORIES } from '@/lib/categories'
import { getAllCategoriesWithIds } from '@/lib/category-mapper'

// GET /api/categories - Get all categories (default + custom)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get ID-based taxonomy (NEW)
    const taxonomyWithIds = await getAllCategoriesWithIds()

    // Build a complete taxonomy by merging defaults (for backward compatibility)
    const taxonomy: Record<string, Record<string, string[]>> = {}

    // Start with defaults from lib/categories.ts
    for (const major of MAJOR_CATEGORIES) {
      taxonomy[major.name] = {}

      for (const cat of major.subcategories) {
        const subCats = SUBCATEGORIES[cat] || []
        taxonomy[major.name][cat] = [...subCats]
      }
    }

    return NextResponse.json({
      // NEW: ID-based taxonomy
      taxonomyWithIds,
      // OLD: Text-based taxonomy (backward compatibility)
      taxonomy,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
