import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { validateRequest } from '@/lib/validate-request'
import {
  CategoryManageCreateSchema,
  CategoryManageUpdateSchema,
  CategoryManageDeleteSchema,
} from '@/lib/validation'

// Helper to create slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// GET /api/categories/manage - Get full taxonomy for management UI
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch 2-tier taxonomy (no subcategories)
    const majorCategories = await prisma.majorCategory.findMany({
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ taxonomy: majorCategories })
  } catch (error) {
    console.error('Error fetching taxonomy for management:', error)
    return NextResponse.json({ error: 'Failed to fetch taxonomy' }, { status: 500 })
  }
}

// POST /api/categories/manage - Create new category
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body
    const { type, majorCategoryId, name, nameEn, icon } = await validateRequest(
      request,
      CategoryManageCreateSchema
    )

    if (type === 'category') {
      const slug = createSlug(name)
      const id = `cat_custom_${slug}_${Date.now()}`

      const category = await prisma.category.create({
        data: {
          id,
          slug,
          name,
          nameEn: nameEn || null,
          icon: icon || null,
          majorCategoryId,
          userId: null,
        },
      })

      return NextResponse.json({ success: true, category })
    }

    return NextResponse.json({ error: 'Invalid type or missing majorCategoryId' }, { status: 400 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

// PATCH /api/categories/manage - Update category name
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body
    const { type, id, name, nameEn, icon } = await validateRequest(
      request,
      CategoryManageUpdateSchema
    )

    if (type === 'category') {
      await prisma.category.update({
        where: { id },
        data: {
          name,
          nameEn: nameEn || undefined,
          icon: icon || undefined,
          slug: createSlug(name),
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE /api/categories/manage - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body
    const { type, id } = await validateRequest(request, CategoryManageDeleteSchema)

    if (type === 'category') {
      await prisma.category.delete({
        where: { id },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
