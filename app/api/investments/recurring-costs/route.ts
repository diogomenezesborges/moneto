/**
 * Recurring Costs API Route
 *
 * Handles CRUD operations for investment recurring costs.
 * Issue #114: Investment Tracking - Cost Transparency Enhancement
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/investments/recurring-costs - Fetch all recurring costs
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const costs = await prisma.recurringCost.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(costs)
  } catch (error) {
    console.error('Failed to fetch recurring costs:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring costs' }, { status: 500 })
  }
}

// POST /api/investments/recurring-costs - Create new recurring cost
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { holdingId, type, amount, frequency, startDate, endDate, notes } = body

    // Validation
    if (!type || !amount || !frequency || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, frequency, startDate' },
        { status: 400 }
      )
    }

    // If holdingId provided, verify it belongs to user
    if (holdingId) {
      const holding = await prisma.holding.findFirst({
        where: { id: holdingId, userId: user.userId },
      })
      if (!holding) {
        return NextResponse.json({ error: 'Holding not found or unauthorized' }, { status: 404 })
      }
    }

    const cost = await prisma.recurringCost.create({
      data: {
        userId: user.userId,
        holdingId: holdingId || null,
        type,
        amount,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null,
      },
    })

    return NextResponse.json(cost)
  } catch (error) {
    console.error('Failed to create recurring cost:', error)
    return NextResponse.json({ error: 'Failed to create recurring cost' }, { status: 500 })
  }
}
