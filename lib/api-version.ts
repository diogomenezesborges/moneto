import { NextRequest, NextResponse } from 'next/server'

/**
 * API Versioning Utilities
 *
 * Implements URL-based versioning for backward compatibility:
 * - /api/v1/resource → Version 1
 * - /api/v2/resource → Version 2
 * - /api/resource    → Latest version (redirects to current stable)
 */

export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2', // Future
  LATEST: 'v1', // Current stable version
} as const

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS]

/**
 * Extract API version from request URL
 * Returns null if no version specified (unversioned endpoint)
 */
export function getApiVersion(request: NextRequest): ApiVersion | null {
  const { pathname } = new URL(request.url)

  // Match /api/v1/, /api/v2/, etc.
  const versionMatch = pathname.match(/^\/api\/(v\d+)\//)

  if (versionMatch) {
    return versionMatch[1] as ApiVersion
  }

  return null
}

/**
 * Check if requested API version is supported
 */
export function isSupportedVersion(version: string | null): boolean {
  if (!version) return true // Unversioned endpoints are always supported
  return Object.values(API_VERSIONS).includes(version as ApiVersion)
}

/**
 * Get the latest API version
 */
export function getLatestVersion(): ApiVersion {
  return API_VERSIONS.LATEST
}

/**
 * Create a response for unsupported API version
 */
export function unsupportedVersionResponse(requestedVersion: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Unsupported API version',
      requestedVersion,
      supportedVersions: Object.values(API_VERSIONS).filter((v, i, arr) => arr.indexOf(v) === i), // Unique values
      latestVersion: API_VERSIONS.LATEST,
      message: `API version '${requestedVersion}' is not supported. Please use one of the supported versions.`,
    },
    { status: 400 }
  )
}

/**
 * Create a deprecation warning header
 */
export function addDeprecationHeader(
  response: NextResponse,
  version: ApiVersion,
  deprecationDate: string,
  sunsetDate: string,
  migrationGuideUrl?: string
): NextResponse {
  const headers = new Headers(response.headers)

  headers.set('X-API-Deprecated', 'true')
  headers.set('X-API-Deprecation-Date', deprecationDate)
  headers.set('X-API-Sunset-Date', sunsetDate)
  headers.set('X-API-Current-Version', version)
  headers.set('X-API-Latest-Version', API_VERSIONS.LATEST)

  if (migrationGuideUrl) {
    headers.set('X-API-Migration-Guide', migrationGuideUrl)
  }

  // Also add standard Deprecation and Sunset headers (RFC 8594)
  headers.set('Deprecation', `date="${deprecationDate}"`)
  headers.set('Sunset', sunsetDate)

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Middleware wrapper for API versioning
 */
export function withVersioning(
  request: NextRequest,
  handlers: {
    [K in ApiVersion]?: (request: NextRequest) => Promise<NextResponse>
  },
  defaultHandler?: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const version = getApiVersion(request)

  // Check if version is supported
  if (version && !isSupportedVersion(version)) {
    return Promise.resolve(unsupportedVersionResponse(version))
  }

  // Route to version-specific handler
  if (version && handlers[version]) {
    return handlers[version]!(request)
  }

  // Use default handler if provided
  if (defaultHandler) {
    return defaultHandler(request)
  }

  // No handler found
  return Promise.resolve(
    NextResponse.json(
      {
        error: 'Not implemented',
        message: `No handler found for API version: ${version || 'unversioned'}`,
      },
      { status: 501 }
    )
  )
}

/**
 * Add API version metadata to response
 */
export function addVersionMetadata(response: NextResponse, version: ApiVersion): NextResponse {
  const headers = new Headers(response.headers)

  headers.set('X-API-Version', version)
  headers.set('X-API-Latest-Version', API_VERSIONS.LATEST)

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * Create a response that redirects to the latest API version
 */
export function latestVersionRedirect(request: NextRequest): NextResponse {
  const { pathname, search } = new URL(request.url)

  // Replace /api/ with /api/v{latest}/
  const newPath = pathname.replace(/^\/api\//, `/api/${API_VERSIONS.LATEST}/`)

  return NextResponse.redirect(new URL(newPath + search, request.url), 308) // Permanent redirect
}

/**
 * Parse API version from Accept header (optional, for header-based versioning)
 * Example: Accept: application/vnd.moneto.v1+json
 */
export function getVersionFromHeader(request: NextRequest): ApiVersion | null {
  const accept = request.headers.get('Accept')

  if (!accept) return null

  const versionMatch = accept.match(/application\/vnd\.moneto\.(v\d+)\+json/)

  if (versionMatch) {
    return versionMatch[1] as ApiVersion
  }

  return null
}

/**
 * Version comparison utility
 */
export function compareVersions(v1: string, v2: string): number {
  const v1Num = parseInt(v1.replace('v', ''), 10)
  const v2Num = parseInt(v2.replace('v', ''), 10)
  return v1Num - v2Num
}

/**
 * Check if version is deprecated
 */
export function isDeprecated(version: ApiVersion): boolean {
  // Currently no versions are deprecated
  // In the future, we might deprecate v1 when v2 is stable
  return false
}

/**
 * Get deprecation info for a version
 */
export function getDeprecationInfo(version: ApiVersion): {
  isDeprecated: boolean
  deprecationDate?: string
  sunsetDate?: string
  migrationGuide?: string
} {
  // Example deprecation schedule (commented out for now)
  /*
  if (version === 'v1') {
    return {
      isDeprecated: true,
      deprecationDate: '2026-06-01',
      sunsetDate: '2026-12-01',
      migrationGuide: 'https://github.com/your-username/moneto/wiki/API-v1-to-v2-Migration'
    }
  }
  */

  return {
    isDeprecated: false,
  }
}
