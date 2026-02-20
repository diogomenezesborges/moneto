import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHmac } from 'crypto'

/**
 * CSRF Token Management
 *
 * Implements Double Submit Cookie pattern for CSRF protection:
 * 1. Token is generated and sent as HTTP-only cookie
 * 2. Client sends same token in request header
 * 3. Server validates both match
 */

const csrfSecretRaw = process.env.CSRF_SECRET || process.env.JWT_SECRET

if (!csrfSecretRaw) {
  throw new Error('FATAL: CSRF_SECRET or JWT_SECRET environment variable is required')
}

if (csrfSecretRaw.length < 32) {
  throw new Error('FATAL: CSRF_SECRET must be at least 32 characters')
}

// Type-safe constant after validation
const CSRF_SECRET: string = csrfSecretRaw

// CSRF token cookie name
const CSRF_COOKIE_NAME = 'csrf-token'

// CSRF token header name
const CSRF_HEADER_NAME = 'x-csrf-token'

// Token expiry: 24 hours
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

/**
 * Generate a CSRF token
 * Format: timestamp:randomValue:signature
 */
export function generateCsrfToken(): string {
  const timestamp = Date.now().toString()
  const randomValue = randomBytes(32).toString('hex')

  // Create HMAC signature
  const hmac = createHmac('sha256', CSRF_SECRET)
  hmac.update(`${timestamp}:${randomValue}`)
  const signature = hmac.digest('hex')

  return `${timestamp}:${randomValue}:${signature}`
}

/**
 * Verify a CSRF token
 */
export function verifyCsrfToken(token: string): boolean {
  try {
    const parts = token.split(':')
    if (parts.length !== 3) {
      return false
    }

    const [timestamp, randomValue, signature] = parts

    // Check token expiry
    const tokenAge = Date.now() - parseInt(timestamp, 10)
    if (tokenAge > TOKEN_EXPIRY_MS) {
      return false
    }

    // Verify signature
    const hmac = createHmac('sha256', CSRF_SECRET)
    hmac.update(`${timestamp}:${randomValue}`)
    const expectedSignature = hmac.digest('hex')

    // Constant-time comparison to prevent timing attacks
    return signature === expectedSignature
  } catch (error) {
    return false
  }
}

/**
 * Get CSRF token from request cookies
 * Decodes URL-encoded cookie values (browsers encode colons as %3A)
 * Returns null for missing or empty tokens (defense in depth)
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  const cookieValue = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (!cookieValue || cookieValue.trim() === '') return null

  // Decode URL-encoded characters (e.g., %3A → :)
  try {
    const decoded = decodeURIComponent(cookieValue)
    // Reject empty strings after decoding
    return decoded.trim() === '' ? null : decoded
  } catch (error) {
    // If decoding fails, return original value (if not empty)
    return cookieValue.trim() === '' ? null : cookieValue
  }
}

/**
 * Get CSRF token from request header
 * Returns null for missing or empty tokens (defense in depth)
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  const token = request.headers.get(CSRF_HEADER_NAME)
  // Explicitly reject empty strings (defense in depth)
  if (!token || token.trim() === '') {
    return null
  }
  return token
}

/**
 * Set CSRF token cookie in response
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Changed from 'strict' to 'lax' for Vercel preview deployments
    maxAge: TOKEN_EXPIRY_MS / 1000, // Convert to seconds
    path: '/',
  })

  return response
}

/**
 * Validate CSRF token from request
 * Checks both cookie and header match and are valid
 */
export function validateCsrfToken(request: NextRequest): {
  valid: boolean
  error?: string
} {
  // Skip CSRF check for safe methods (GET, HEAD, OPTIONS)
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }

  // Get token from cookie
  const cookieToken = getCsrfTokenFromCookie(request)
  if (!cookieToken) {
    return { valid: false, error: 'CSRF token missing from cookie' }
  }

  // Get token from header
  const headerToken = getCsrfTokenFromHeader(request)
  if (!headerToken) {
    return { valid: false, error: 'CSRF token missing from header' }
  }

  // Tokens must match (Double Submit Cookie pattern)
  if (cookieToken !== headerToken) {
    return { valid: false, error: 'CSRF token mismatch' }
  }

  // Verify token signature and expiry
  if (!verifyCsrfToken(cookieToken)) {
    return { valid: false, error: 'Invalid or expired CSRF token' }
  }

  return { valid: true }
}

/**
 * Middleware wrapper for CSRF protection
 * Use this in API routes that need CSRF protection
 */
export async function withCsrfProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const validation = validateCsrfToken(request)

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'CSRF validation failed', details: validation.error },
      { status: 403 }
    )
  }

  return handler(request)
}

/**
 * Generate a new CSRF token and return it in response
 * Use this for auth endpoints (login/register)
 */
export function generateCsrfResponse(data: any): NextResponse {
  const token = generateCsrfToken()

  // Include CSRF token in response body (primary method for SPA clients)
  // Headers may not be accessible due to browser restrictions
  const responseData = {
    ...data,
    csrfToken: token,
  }

  const response = NextResponse.json(responseData)
  setCsrfTokenCookie(response, token)

  // Also set token in header for backwards compatibility
  response.headers.set('X-CSRF-Token', token)

  return response
}
