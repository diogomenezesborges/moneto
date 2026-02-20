import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

// Known example/placeholder secrets that should NEVER be used in production
const FORBIDDEN_SECRETS = [
  'your_very_long_random_secret_here',
  'your-super-secret-jwt-key-minimum-32-characters',
  'your_csrf_secret_minimum_32_characters_long',
  'change-this-to-a-secure-random-string',
  'your-secret-key-minimum-32-characters',
  'example-secret-do-not-use-in-production',
  'test-secret-for-development-only-32chars',
]

// Patterns that indicate weak/example secrets
const WEAK_SECRET_PATTERNS = [
  /^(your|change|example|test|demo|dev|placeholder)/i,
  /secret.*here$/i,
  /minimum.*characters$/i,
  /do.?not.?use/i,
  /^[a-z-]+$/i, // All lowercase with dashes only (likely placeholder)
]

/**
 * Check if a secret has sufficient entropy
 * Accounts for different encoding formats (hex, base64, raw)
 */
function hasLowEntropy(secret: string): boolean {
  const uniqueChars = new Set(secret).size

  // Hex-encoded secrets (0-9, a-f) have max 16 unique chars but are secure if long enough
  const isHexEncoded = /^[0-9a-f]+$/i.test(secret)
  if (isHexEncoded) {
    // For hex, require at least 64 chars (32 bytes = 256 bits)
    return secret.length < 64
  }

  // Base64-encoded secrets have 64 possible chars
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(secret)
  if (isBase64) {
    // For base64, require at least 43 chars (32 bytes = 256 bits)
    return secret.length < 43
  }

  // For other formats, check unique character count
  // 20 unique chars provides good entropy for human-readable secrets
  return uniqueChars < 16
}

function validateJWTSecret(secret: string): void {
  const isProduction = process.env.NODE_ENV === 'production'

  // Check against known forbidden secrets
  if (FORBIDDEN_SECRETS.includes(secret)) {
    const error = `JWT_SECRET is set to a known example/placeholder value. ${isProduction ? 'This is FORBIDDEN in production.' : 'Please generate a secure random secret.'}`
    if (isProduction) {
      throw new Error(`FATAL: ${error}`)
    }
    console.warn(`⚠️  WARNING: ${error}`)
    return // Don't do further checks for known bad values
  }

  // Check against weak patterns (production only - fail hard)
  if (isProduction) {
    for (const pattern of WEAK_SECRET_PATTERNS) {
      if (pattern.test(secret)) {
        throw new Error(
          `FATAL: JWT_SECRET appears to be a placeholder or weak secret (matched pattern: ${pattern}). ` +
            'Generate a secure random secret using: openssl rand -base64 48'
        )
      }
    }

    // Check entropy (basic check - production only)
    if (hasLowEntropy(secret)) {
      throw new Error(
        `FATAL: JWT_SECRET appears to have insufficient entropy. ` +
          'Generate a cryptographically secure random secret using: openssl rand -base64 48'
      )
    }
  } else {
    // In development, just warn about weak patterns
    for (const pattern of WEAK_SECRET_PATTERNS) {
      if (pattern.test(secret)) {
        console.warn(
          `⚠️  WARNING: JWT_SECRET appears to be a placeholder. ` +
            'Generate a secure secret for production: openssl rand -base64 48'
        )
        return
      }
    }

    // Warn about low entropy in development
    if (hasLowEntropy(secret)) {
      console.warn(
        `⚠️  WARNING: JWT_SECRET may have low entropy. ` +
          'Consider using a more random secret: openssl rand -base64 48'
      )
    }
  }
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is required but not set')
  }

  if (secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters long for security')
  }

  // Validate secret is not an example/weak value
  validateJWTSecret(secret)

  return secret
}

const JWT_SECRET = getJWTSecret()

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export function getUserFromRequest(request: NextRequest): { userId: string } | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  // Allow dev token to bypass authentication ONLY in development
  if (process.env.NODE_ENV === 'development' && token === 'dev-token-no-auth') {
    console.warn('⚠️  Dev authentication bypass used - THIS ONLY WORKS IN DEVELOPMENT')
    return { userId: 'cmj95p60f0000xweq4znl3xbp' }
  }

  return verifyToken(token)
}
