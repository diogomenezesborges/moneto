/**
 * Investment Review [ID] API Route
 *
 * Handles operations on individual investment review entries.
 * Issue #114: Investment Tracking - Decision Journal Enhancement
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// DELETE /api/investments/reviews/[id] - Delete an investment review
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

    // Verify review belongs to user
    const review = await prisma.investmentReview.findFirst({
      where: { id, userId: user.userId },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Investment review not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.investmentReview.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete investment review:', error)
    return NextResponse.json({ error: 'Failed to delete investment review' }, { status: 500 })
  }
}
