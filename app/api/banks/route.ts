import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import { BankCreateSchema, BankUpdateSchema, BankDeleteSchema } from '@/lib/validation'

// GET /api/banks - Get all banks
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get both system default banks (userId = null) and user custom banks
    const banks = await prisma.bank.findMany({
      where: {
        OR: [
          { userId: null }, // System defaults
          { userId: user.userId }, // User custom
        ],
      },
      orderBy: [
        { userId: 'asc' }, // System banks first (null comes first)
        { name: 'asc' },
      ],
    })

    // PERFORMANCE: Add HTTP caching headers for banks endpoint
    // Banks data is relatively static (system banks never change, user custom banks rarely change)
    // Cache for 1 hour on client/CDN, allow stale content for 24 hours while revalidating
    return NextResponse.json(
      { banks },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching banks:', error)
    return NextResponse.json({ error: 'Failed to fetch banks' }, { status: 500 })
  }
}

// POST /api/banks - Create a new bank
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, logo, color } = await validateRequest(req, BankCreateSchema)

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    // Check if bank with this slug already exists for this user
    const existing = await prisma.bank.findFirst({
      where: {
        userId: user.userId,
        slug,
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'A bank with this name already exists' }, { status: 400 })
    }

    const bank = await prisma.bank.create({
      data: {
        name,
        slug,
        logo: logo || null,
        color: color || null,
        userId: user.userId,
      },
    })

    return NextResponse.json({ bank }, { status: 201 })
  } catch (error) {
    console.error('Error creating bank:', error)
    return NextResponse.json({ error: 'Failed to create bank' }, { status: 500 })
  }
}

// PUT /api/banks - Update an existing bank
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, logo, color } = await validateRequest(req, BankUpdateSchema)

    // Check if the bank exists and belongs to the user (or is a system bank they're not allowed to edit)
    const existing = await prisma.bank.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Bank not found' }, { status: 404 })
    }

    // Only allow editing user's own banks, not system defaults
    if (existing.userId !== user.userId) {
      return NextResponse.json({ error: 'Cannot edit system default banks' }, { status: 403 })
    }

    // Generate new slug if name changed
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const bank = await prisma.bank.update({
      where: { id },
      data: {
        name,
        slug,
        logo: logo || null,
        color: color || null,
      },
    })

    return NextResponse.json({ bank })
  } catch (error) {
    console.error('Error updating bank:', error)
    return NextResponse.json({ error: 'Failed to update bank' }, { status: 500 })
  }
}

// DELETE /api/banks?id=xxx - Delete a bank
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const idParam = searchParams.get('id')

    // Validate ID parameter
    const validated = BankDeleteSchema.safeParse({ id: idParam })
    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validated.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { id } = validated.data

    // Check if the bank exists and belongs to the user
    const existing = await prisma.bank.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Bank not found' }, { status: 404 })
    }

    // Only allow deleting user's own banks, not system defaults
    if (existing.userId !== user.userId) {
      return NextResponse.json({ error: 'Cannot delete system default banks' }, { status: 403 })
    }

    await prisma.bank.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bank:', error)
    return NextResponse.json({ error: 'Failed to delete bank' }, { status: 500 })
  }
}
