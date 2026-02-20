import pino from 'pino'
import { NextRequest } from 'next/server'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    env: process.env.NODE_ENV || 'development',
  },
})

export function createRequestLogger(request: NextRequest) {
  const correlationId =
    request.headers.get('x-correlation-id') ||
    request.headers.get('x-request-id') ||
    crypto.randomUUID()

  return logger.child({
    correlationId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
  })
}

// Redact sensitive fields
export function redactSensitive(obj: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'jwt', 'authorization']
  const redacted: Record<string, any> = { ...obj }

  for (const key in redacted) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key])
    }
  }

  return redacted
}
