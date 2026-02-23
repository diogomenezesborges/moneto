/**
 * Investment Reviews API Route
 *
 * Handles CRUD operations for investment decision journal entries.
 * Issue #114: Investment Tracking - Decision Journal Enhancement
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/investments/reviews - Fetch all investment reviews
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviews = await prisma.investmentReview.findMany({
      where: { userId: user.userId },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Failed to fetch investment reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch investment reviews' }, { status: 500 })
  }
}

// POST /api/investments/reviews - Create new investment review
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, reviewType, notes, decisions, attachedHoldings } = body

    // Validation
    if (!date || !reviewType || !notes || !decisions || !Array.isArray(decisions)) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 })
    }

    if (decisions.length === 0) {
      return NextResponse.json({ error: 'At least one decision is required' }, { status: 400 })
    }

    // Verify attached holdings belong to user (if any)
    if (attachedHoldings && Array.isArray(attachedHoldings) && attachedHoldings.length > 0) {
      const holdings = await prisma.holding.findMany({
        where: {
          id: { in: attachedHoldings },
          userId: user.userId,
        },
      })

      if (holdings.length !== attachedHoldings.length) {
        return NextResponse.json(
          { error: 'Some attached holdings not found or unauthorized' },
          { status: 400 }
        )
      }
    }

    const review = await prisma.investmentReview.create({
      data: {
        userId: user.userId,
        date: new Date(date),
        reviewType,
        notes,
        decisions,
        attachedHoldings: attachedHoldings || [],
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Failed to create investment review:', error)
    return NextResponse.json({ error: 'Failed to create investment review' }, { status: 500 })
  }
}
