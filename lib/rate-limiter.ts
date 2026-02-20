/**
 * Redis-based rate limiter using Upstash
 * Prevents brute force attacks on authentication
 * Falls back to in-memory implementation for development when Redis is not configured
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Environment configuration
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// In-memory fallback for development
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes (only for in-memory fallback)
let cleanupInterval: NodeJS.Timeout | null = null
if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  console.warn(
    '⚠️  Redis not configured - using in-memory rate limiter (NOT SUITABLE FOR PRODUCTION)'
  )
  cleanupInterval = setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of Array.from(rateLimitMap.entries())) {
        if (now > entry.resetTime) {
          rateLimitMap.delete(key)
        }
      }
    },
    10 * 60 * 1000
  )
}

// Initialize Redis-based rate limiter if credentials are available
let redisRateLimiter: Ratelimit | null = null

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })

    redisRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 s'),
      analytics: true,
      prefix: 'moneto_ratelimit',
    })

    console.log('✅ Redis-based rate limiter initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Redis rate limiter:', error)
    console.warn('⚠️  Falling back to in-memory rate limiter')
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param maxRequests - Maximum requests allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 10 seconds)
 * @returns Object with allowed status and optional retryAfter
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 10 * 1000 // 10 seconds
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Use Redis-based rate limiter if available
  if (redisRateLimiter) {
    try {
      const { success, reset } = await redisRateLimiter.limit(identifier)

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000)
        return { allowed: false, retryAfter }
      }

      return { allowed: true }
    } catch (error) {
      console.error('❌ Redis rate limiter error:', error)
      console.warn('⚠️  Falling back to in-memory rate limiter for this request')
      // Fall through to in-memory implementation
    }
  }

  // In-memory fallback implementation
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry) {
    // First request
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true }
  }

  if (now > entry.resetTime) {
    // Window expired, reset
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true }
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  entry.count++
  return { allowed: true }
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or administrative purposes
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  if (redisRateLimiter) {
    try {
      // Upstash Ratelimit doesn't expose a direct reset method
      // We'll need to work with the underlying Redis instance
      // For now, just log and clear from memory if using fallback
      console.log(`Rate limit reset requested for: ${identifier}`)
    } catch (error) {
      console.error('Error resetting rate limit:', error)
    }
  }

  // Always clear from in-memory cache
  rateLimitMap.delete(identifier)
}

// Cleanup on module unload (for graceful shutdown)
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
    }
  })
}
