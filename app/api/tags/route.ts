import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateCsrfToken } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError, AuthorizationError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized GET request')
      throw new AuthenticationError()
    }

    // Get all tag definitions
    const tags = await prisma.tagDefinition.findMany({
      orderBy: [{ namespace: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    })

    log.info({ count: tags.length }, 'Tags retrieved')
    return NextResponse.json({ tags })
  } catch (error) {
    return handleApiError(error, log)
  }
}

export async function POST(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized POST request')
      throw new AuthenticationError()
    }

    // CSRF protection
    const csrfValidation = validateCsrfToken(request)
    if (!csrfValidation.valid) {
      log.warn({ error: csrfValidation.error }, 'CSRF validation failed')
      throw new AuthorizationError('CSRF validation failed')
    }

    const body = await request.json()
    const { namespace, value, label, labelEn, color } = body

    if (!namespace || !value || !label) {
      return NextResponse.json(
        { message: 'namespace, value, and label are required' },
        { status: 400 }
      )
    }

    // Create or update tag definition
    const tag = await prisma.tagDefinition.upsert({
      where: {
        namespace_value: { namespace, value },
      },
      update: { label, labelEn, color },
      create: { namespace, value, label, labelEn, color },
    })

    log.info({ namespace, value, label }, 'Tag created/updated')
    return NextResponse.json({ tag })
  } catch (error) {
    return handleApiError(error, log)
  }
}

// Get tags for a specific transaction
export async function PATCH(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ message: 'transactionId is required' }, { status: 400 })
    }

    const body = await request.json()
    const { tags } = body

    if (!Array.isArray(tags)) {
      return NextResponse.json({ message: 'tags must be an array' }, { status: 400 })
    }

    // Update transaction tags
    const transaction = await prisma.transaction.update({
      where: {
        id: transactionId,
        userId: user.userId,
      },
      data: { tags },
    })

    log.info({ transactionId, tagCount: tags.length }, 'Transaction tags updated')
    return NextResponse.json({ transaction })
  } catch (error) {
    return handleApiError(error, log)
  }
}
