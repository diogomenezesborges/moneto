import { NextResponse } from 'next/server'
import { Logger } from 'pino'
import { AppError } from './errors'
import { ZodError } from 'zod'

export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    correlationId?: string
  }
}

export function handleApiError(
  error: unknown,
  log: Logger
): NextResponse<ErrorResponse> | NextResponse {
  // Extract correlation ID from logger context
  const correlationId = (log as any).bindings?.()?.correlationId

  // If already a NextResponse (e.g., from validateRequest), return it directly
  if (error instanceof NextResponse) {
    return error
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    log.warn({ err: error, issues: error.issues }, 'Validation error')
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
          correlationId,
        },
      },
      { status: 400 }
    )
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn'
    log[logLevel]({ err: error, code: error.code, statusCode: error.statusCode }, error.message)

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details }),
          correlationId,
        },
      },
      { status: error.statusCode }
    )
  }

  // Handle unknown errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  const errorStack = error instanceof Error ? error.stack : undefined

  log.error(
    {
      err: error,
      message: errorMessage,
      stack: errorStack,
    },
    'Unexpected error'
  )

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        correlationId,
      },
    },
    { status: 500 }
  )
}
