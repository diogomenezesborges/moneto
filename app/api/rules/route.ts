import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import { RuleCreateSchema, RuleDeleteSchema } from '@/lib/validation'
import { validateCsrfToken } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const rules = await prisma.rule.findMany({
      where: {
        userId: user.userId,
        deletedAt: null, // Exclude soft-deleted rules
      },
      orderBy: [
        { isDefault: 'desc' }, // Default rules first
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Get rules error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body with Zod
    const validatedData = await validateRequest(request, RuleCreateSchema)
    const { keyword, majorCategory, category, tags } = validatedData

    // Check if active rule already exists (exclude soft-deleted)
    const existingRule = await prisma.rule.findFirst({
      where: {
        userId: user.userId,
        keyword: keyword.toLowerCase(),
        deletedAt: null,
      },
    })

    if (existingRule) {
      return NextResponse.json(
        { message: 'Rule with this keyword already exists' },
        { status: 400 }
      )
    }

    const rule = await prisma.rule.create({
      data: {
        keyword: keyword.toLowerCase(),
        majorCategory,
        category,
        tags: tags || [],
        isDefault: false,
        userId: user.userId,
      },
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Create rule error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      return NextResponse.json(
        { error: 'CSRF validation failed', details: csrfValidation.error },
        { status: 403 }
      )
    }

    // Validate request body with Zod
    const validatedData = await validateRequest(request, RuleDeleteSchema)
    const { id } = validatedData

    if (!id) {
      return NextResponse.json({ message: 'Rule ID is required' }, { status: 400 })
    }

    // Check if rule exists and is not already deleted
    const rule = await prisma.rule.findFirst({
      where: {
        id,
        userId: user.userId,
        deletedAt: null,
      },
    })

    if (!rule) {
      return NextResponse.json({ message: 'Rule not found' }, { status: 404 })
    }

    if (rule.isDefault) {
      return NextResponse.json({ message: 'Default rules cannot be deleted' }, { status: 400 })
    }

    // Soft delete
    await prisma.rule.update({
      where: {
        id,
        userId: user.userId,
      },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Rule deleted', recoverable: true })
  } catch (error) {
    console.error('Delete rule error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
