/**
 * Recurring Cost [ID] API Route
 *
 * Handles operations on individual recurring costs.
 * Issue #114: Investment Tracking - Cost Transparency Enhancement
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// DELETE /api/investments/recurring-costs/[id] - Delete a recurring cost
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify cost belongs to user
    const cost = await prisma.recurringCost.findFirst({
      where: { id, userId: user.userId },
    })

    if (!cost) {
      return NextResponse.json(
        { error: 'Recurring cost not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.recurringCost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete recurring cost:', error)
    return NextResponse.json({ error: 'Failed to delete recurring cost' }, { status: 500 })
  }
}
