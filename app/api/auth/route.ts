import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword, signToken } from '@/lib/auth'
import { DEFAULT_RULES } from '@/lib/categories'
import { checkRateLimit } from '@/lib/rate-limiter'
import { validateRequest } from '@/lib/validate-request'
import { AuthRequestSchema } from '@/lib/validation'
import { generateCsrfResponse } from '@/lib/csrf'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { RateLimitError, AuthenticationError, ConflictError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    log.info('Auth request received')
    // Validate request body with Zod
    const validatedData = await validateRequest(request, AuthRequestSchema)

    // Rate limiting: 5 attempts per 10 seconds per IP
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `auth:${ip}`
    const rateLimit = await checkRateLimit(rateLimitKey, 5, 10 * 1000)

    if (!rateLimit.allowed) {
      log.warn({ ip, retryAfter: rateLimit.retryAfter }, 'Rate limit exceeded')
      throw new RateLimitError(
        `Too many attempts. Please try again in ${rateLimit.retryAfter} seconds.`
      )
    }

    if (validatedData.action === 'register') {
      const { name, pin } = validatedData

      // Check if user already exists (case-insensitive)
      const existingUser = await prisma.user.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      })

      if (existingUser) {
        log.warn({ name }, 'User already exists')
        throw new ConflictError('User already exists')
      }

      // Create new user
      const pinHash = await hashPassword(pin)
      const user = await prisma.user.create({
        data: { name, pinHash },
      })

      // Create default rules
      await prisma.rule.createMany({
        data: DEFAULT_RULES.map(rule => ({
          keyword: rule.keyword,
          majorCategory: rule.majorCategory,
          category: rule.category,
          subCategory: rule.subCategory,
          isDefault: true,
          userId: user.id,
        })),
      })

      const token = signToken(user.id)

      log.info({ userId: user.id, userName: user.name }, 'User registered successfully')

      // Generate CSRF token and set cookie
      return generateCsrfResponse({
        user: { id: user.id, name: user.name },
        token,
      })
    }

    if (validatedData.action === 'login') {
      const { name, pin } = validatedData

      // Find user by name if provided, otherwise get the first user (single-user mode)
      const user = name
        ? await prisma.user.findFirst({
            where: {
              name: {
                equals: name,
                mode: 'insensitive', // Case-insensitive search
              },
            },
          })
        : await prisma.user.findFirst()

      if (!user) {
        log.warn({ name }, 'User not found')
        throw new AuthenticationError('User not found')
      }

      // Verify PIN
      const isValidPin = await verifyPassword(pin, user.pinHash)
      if (!isValidPin) {
        log.warn({ userId: user.id }, 'Invalid PIN attempt')
        throw new AuthenticationError('Invalid PIN')
      }

      const token = signToken(user.id)

      log.info({ userId: user.id, userName: user.name }, 'User logged in successfully')

      // Generate CSRF token and set cookie
      return generateCsrfResponse({
        user: { id: user.id, name: user.name },
        token,
      })
    }

    // Logout action (no-op for now, handled client-side)
    if (validatedData.action === 'logout') {
      log.info('User logged out')
      return NextResponse.json({ message: 'Logged out successfully' })
    }

    log.warn('Invalid action')
    return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return handleApiError(error, log)
  }
}
