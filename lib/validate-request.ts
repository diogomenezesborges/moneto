import { NextRequest, NextResponse } from 'next/server'
import { type ZodSchema, ZodError } from 'zod'

/**
 * Validates the request body against a Zod schema
 * Returns validated data or throws a NextResponse with error details
 */
export async function validateRequest<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json()
    const validated = schema.parse(body)
    return validated
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const zodError = error as ZodError<T>
      const errors = zodError.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))

      throw NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      )
    }

    // JSON parse error
    throw NextResponse.json(
      {
        error: 'Invalid JSON in request body',
      },
      { status: 400 }
    )
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T>(request: NextRequest, schema: ZodSchema<T>): T {
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}

    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const validated = schema.parse(params)
    return validated
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const zodError = error as ZodError<T>
      const errors = zodError.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))

      throw NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: errors,
        },
        { status: 400 }
      )
    }

    throw NextResponse.json(
      {
        error: 'Invalid query parameters',
      },
      { status: 400 }
    )
  }
}

/**
 * Safe validation wrapper that catches NextResponse throws
 * Use this in try-catch blocks in API routes
 */
export function safeValidation<T>(validationFn: () => T | Promise<T>): Promise<T> {
  return Promise.resolve(validationFn()).catch(error => {
    if (error instanceof NextResponse) {
      throw error
    }
    throw NextResponse.json(
      {
        error: 'Validation error',
        details: error.message,
      },
      { status: 400 }
    )
  })
}
