import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateRequest } from '@/lib/validate-request'
import { HoldingUpdateSchema, HoldingDeleteSchema } from '@/lib/validation'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError, NotFoundError } from '@/lib/errors'

/**
 * PATCH /api/investments/holdings/[id]
 * Updates an existing holding
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized PATCH request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    const { id } = await params
    const validatedData = await validateRequest(request, HoldingUpdateSchema)

    // Verify holding exists and belongs to user
    const existingHolding = await prisma.holding.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    })

    if (!existingHolding) {
      log.warn({ holdingId: id }, 'Holding not found or unauthorized')
      throw new NotFoundError('Holding')
    }

    // Update holding
    const { id: _id, ...updateData } = validatedData
    const holding = await prisma.holding.update({
      where: { id },
      data: {
        ...updateData,
        // If manual price is being updated, set timestamp
        ...(updateData.manualPrice !== undefined && {
          manualPriceAt: new Date(),
        }),
      },
    })

    log.info({ holdingId: holding.id, name: holding.name }, 'Holding updated')
    return NextResponse.json(holding)
  } catch (error) {
    return handleApiError(error, log)
  }
}

/**
 * DELETE /api/investments/holdings/[id]
 * Soft-deletes a holding (sets isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized DELETE request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    const { id } = await params

    // Verify holding exists and belongs to user
    const existingHolding = await prisma.holding.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    })

    if (!existingHolding) {
      log.warn({ holdingId: id }, 'Holding not found or unauthorized')
      throw new NotFoundError('Holding')
    }

    // Soft delete: set isActive = false
    await prisma.holding.update({
      where: { id },
      data: { isActive: false },
    })

    log.info({ holdingId: id }, 'Holding soft-deleted')
    return NextResponse.json({ success: true, message: 'Holding deleted' })
  } catch (error) {
    return handleApiError(error, log)
  }
}
