/**
 * Testing Utilities for React Query Tests
 *
 * Provides wrappers and helpers for testing TanStack Query hooks.
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'

/**
 * Creates a React Query wrapper for testing hooks
 *
 * Usage:
 * ```typescript
 * const { result } = renderHook(() => useMyHook(), {
 *   wrapper: createWrapper(queryClient),
 * })
 * ```
 */
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient()
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = 'QueryClientWrapper'
  return Wrapper
}

/**
 * Creates a fresh QueryClient for each test
 *
 * Usage:
 * ```typescript
 * beforeEach(() => {
 *   queryClient = createTestQueryClient()
 * })
 * ```
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: Infinity, // Keep cache indefinitely in tests
      },
      mutations: {
        retry: false, // Disable retries in tests
      },
    },
  })
}

/**
 * Mock fetch response helper
 *
 * Usage:
 * ```typescript
 * global.fetch = mockFetch({ data: { id: 1 } })
 * ```
 */
export function mockFetch(response: any, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  })
}

/**
 * Mock fetch error helper
 *
 * Usage:
 * ```typescript
 * global.fetch = mockFetchError('Network error')
 * ```
 */
export function mockFetchError(message: string) {
  return vi.fn().mockRejectedValue(new Error(message))
}
