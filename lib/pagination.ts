import { NextRequest } from 'next/server'
import { z } from 'zod'

/**
 * Pagination Utilities
 *
 * Implements cursor-based pagination for efficient large dataset handling:
 * - Cursor points to a specific record (uses ID)
 * - More efficient than offset-based for large datasets
 * - Consistent results even when data changes
 */

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 1000
export const MIN_PAGE_SIZE = 1

/**
 * Pagination query parameters schema
 */
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

/**
 * Pagination metadata included in API responses
 */
export interface PaginationMeta {
  hasNextPage: boolean
  hasPreviousPage: boolean
  nextCursor: string | null
  previousCursor: string | null
  totalCount?: number // Optional, expensive to calculate
  pageSize: number
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

/**
 * Extract pagination parameters from request URL
 */
export function getPaginationParams(request: NextRequest): PaginationQuery {
  const { searchParams } = new URL(request.url)

  const params = {
    cursor: searchParams.get('cursor') || undefined,
    limit: searchParams.get('limit') || String(DEFAULT_PAGE_SIZE),
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  }

  // Validate with Zod
  const validated = PaginationQuerySchema.parse(params)
  return validated
}

/**
 * Create pagination metadata from query results
 */
export function createPaginationMeta<T extends { id: string }>(
  items: T[],
  requestedLimit: number,
  sortOrder: 'asc' | 'desc' = 'desc',
  totalCount?: number
): PaginationMeta {
  const hasNextPage = items.length > requestedLimit
  const hasPreviousPage = false // Cursor-based pagination doesn't easily support "previous"

  // If we have more items than requested, there's a next page
  const dataItems = hasNextPage ? items.slice(0, requestedLimit) : items

  // Next cursor is the ID of the last item
  const nextCursor = hasNextPage && dataItems.length > 0 ? dataItems[dataItems.length - 1].id : null

  return {
    hasNextPage,
    hasPreviousPage,
    nextCursor,
    previousCursor: null,
    totalCount,
    pageSize: dataItems.length,
  }
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T extends { id: string }>(
  items: T[],
  requestedLimit: number,
  sortOrder: 'asc' | 'desc' = 'desc',
  totalCount?: number
): PaginatedResponse<T> {
  const meta = createPaginationMeta(items, requestedLimit, sortOrder, totalCount)

  // Return only the requested number of items (slice off the extra one used for hasNextPage detection)
  const data = items.length > requestedLimit ? items.slice(0, requestedLimit) : items

  return {
    data,
    pagination: meta,
  }
}

/**
 * Generate Prisma cursor options for transactions
 */
export function getCursorOptions(params: PaginationQuery) {
  const { cursor, limit, sortOrder } = params

  // Fetch one extra item to determine if there's a next page
  const take = limit + 1

  return {
    take,
    skip: cursor ? 1 : 0, // Skip the cursor item itself
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      rawDate: sortOrder,
      id: sortOrder, // Secondary sort for stability
    },
  }
}

/**
 * Build pagination query string for next/previous pages
 */
export function buildPaginationUrl(
  baseUrl: string,
  cursor: string | null,
  limit: number,
  sortOrder: 'asc' | 'desc'
): string | null {
  if (!cursor) return null

  const url = new URL(baseUrl)
  url.searchParams.set('cursor', cursor)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('sortOrder', sortOrder)

  return url.toString()
}

/**
 * Offset-based pagination (simpler but less efficient for large datasets)
 * Use for smaller datasets or when cursor-based is not suitable
 */
export const OffsetPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export type OffsetPaginationQuery = z.infer<typeof OffsetPaginationQuerySchema>

export interface OffsetPaginationMeta {
  currentPage: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Extract offset pagination parameters
 */
export function getOffsetPaginationParams(request: NextRequest): OffsetPaginationQuery {
  const { searchParams } = new URL(request.url)

  const params = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || String(DEFAULT_PAGE_SIZE),
  }

  return OffsetPaginationQuerySchema.parse(params)
}

/**
 * Create offset pagination metadata
 */
export function createOffsetPaginationMeta(
  page: number,
  limit: number,
  totalCount: number
): OffsetPaginationMeta {
  const totalPages = Math.ceil(totalCount / limit)

  return {
    currentPage: page,
    pageSize: limit,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

/**
 * Calculate offset for Prisma query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: {
  cursor?: string
  limit?: number
  page?: number
}): {
  valid: boolean
  errors?: string[]
} {
  const errors: string[] = []

  if (params.limit !== undefined) {
    if (params.limit < MIN_PAGE_SIZE) {
      errors.push(`Limit must be at least ${MIN_PAGE_SIZE}`)
    }
    if (params.limit > MAX_PAGE_SIZE) {
      errors.push(`Limit cannot exceed ${MAX_PAGE_SIZE}`)
    }
  }

  if (params.page !== undefined && params.page < 1) {
    errors.push('Page must be at least 1')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
