/**
 * Tests for Bug #2: Infinite Loading State After Page Refresh
 *
 * Verifies that token verification logic correctly sets authChecked state
 * and prevents infinite loading screens.
 */

import { render, screen, waitFor } from '@testing-library/react'
import { useAuthStore } from '@/lib/stores/authStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomePage from './page'

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@/app/providers', () => ({
  Providers: ({ children }: any) => <div>{children}</div>,
}))

// Mock all feature components to avoid rendering complexity in tests
vi.mock('@/app/features/transactions/components/TransactionsFeature', () => ({
  TransactionsFeature: () => <div>Transactions Feature</div>,
}))

vi.mock('@/app/features/stats/components/StatsFeature', () => ({
  StatsFeature: () => <div>Stats Feature</div>,
}))

vi.mock('@/app/features/cash-flow/components/CashFlowFeature', () => ({
  CashFlowFeature: () => <div>Cash Flow Feature</div>,
}))

vi.mock('@/app/features/rules/components/RulesFeature', () => ({
  RulesFeature: () => <div>Rules Feature</div>,
}))

vi.mock('@/app/features/review/components/ReviewFeature', () => ({
  ReviewFeature: () => <div>Review Feature</div>,
}))

vi.mock('@/app/features/settings/components/SettingsFeature', () => ({
  SettingsFeature: () => <div>Settings Feature</div>,
}))

// Helper to render with QueryClient
function renderWithClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const result = render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>)
  return {
    ...result,
    rerender: (newComponent: React.ReactElement) =>
      result.rerender(
        <QueryClientProvider client={queryClient}>{newComponent}</QueryClientProvider>
      ),
  }
}

describe('Bug #2: Infinite Loading State After Page Refresh', () => {
  beforeEach(() => {
    // Reset auth store before each test
    useAuthStore.setState({
      token: null,
      user: null,
      authChecked: false,
      isAuthenticated: false,
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should set authChecked to true when no token exists', async () => {
    // Simulate no token in localStorage
    useAuthStore.setState({
      token: null,
      authChecked: false,
    })

    // Render the page
    renderWithClient(<HomePage />)

    // Wait for authChecked to be set to true
    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.authChecked).toBe(true)
    })
  })

  it('should verify token validity on mount', async () => {
    const mockToken = 'valid-token-12345'

    // Mock successful token verification
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: [] }),
    })

    // Set token in store (simulating rehydration)
    useAuthStore.setState({
      token: mockToken,
      user: { id: 'user-123', name: 'Test User', role: 'user' },
      authChecked: false,
      isAuthenticated: true,
    })

    renderWithClient(<HomePage />)

    // Verify token verification was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/transactions?limit=1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      )
    })

    // Verify authChecked was set to true
    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.authChecked).toBe(true)
    })
  })

  it('should logout and set authChecked on invalid token', async () => {
    const mockToken = 'invalid-token-12345'

    // Mock failed token verification
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    })

    // Set invalid token in store
    useAuthStore.setState({
      token: mockToken,
      user: { id: 'user-123', name: 'Test User', role: 'user' },
      authChecked: false,
      isAuthenticated: true,
    })

    renderWithClient(<HomePage />)

    // Wait for token verification to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify user was logged out
    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    // CRITICAL: Verify authChecked was set to true even after logout
    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.authChecked).toBe(true)
    })
  })

  it('should set authChecked to true even on network error', async () => {
    const mockToken = 'some-token-12345'

    // Mock network error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    useAuthStore.setState({
      token: mockToken,
      user: { id: 'user-123', name: 'Test User', role: 'user' },
      authChecked: false,
      isAuthenticated: true,
    })

    renderWithClient(<HomePage />)

    // Wait for token verification to fail
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // CRITICAL: Verify authChecked is ALWAYS set to true in finally block
    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.authChecked).toBe(true)
    })
  })

  it('should not show loading screen indefinitely', async () => {
    useAuthStore.setState({
      token: 'test-token',
      authChecked: false,
      isAuthenticated: true,
    })

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transactions: [] }),
    })

    renderWithClient(<HomePage />)

    // Should not show "Carregando..." indefinitely
    // Wait for authChecked to be set
    await waitFor(
      () => {
        const state = useAuthStore.getState()
        expect(state.authChecked).toBe(true)
      },
      { timeout: 2000 }
    )

    // The loading screen should disappear
    // (either showing login or dashboard)
    const loadingText = screen.queryByText(/Carregando/i)
    expect(loadingText).not.toBeInTheDocument()
  })

  it('should only run token verification once on mount', async () => {
    const mockToken = 'test-token-12345'

    // Mock both endpoints that the component calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/transactions?limit=1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        })
      }
      if (url.includes('/api/transactions/review')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        })
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`))
    })

    useAuthStore.setState({
      token: mockToken,
      authChecked: false,
      isAuthenticated: true,
    })

    const { rerender } = renderWithClient(<HomePage />)

    // Wait for token verification to complete
    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.authChecked).toBe(true)
    })

    const initialCallCount = (global.fetch as any).mock.calls.filter((call: any) =>
      call[0].includes('/api/transactions?limit=1')
    ).length

    // Should have called token verification exactly once
    expect(initialCallCount).toBe(1)

    // Rerender should not trigger another verification
    rerender(<HomePage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    const finalCallCount = (global.fetch as any).mock.calls.filter((call: any) =>
      call[0].includes('/api/transactions?limit=1')
    ).length

    // Still should only have been called once
    expect(finalCallCount).toBe(1)
  })

  it('should skip verification if authChecked is already true', async () => {
    // Mock endpoints - review endpoint will still be called for review count
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/transactions/review')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        })
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`))
    })

    // Simulate auth already checked
    useAuthStore.setState({
      token: 'test-token',
      authChecked: true, // Already checked
      isAuthenticated: true,
    })

    renderWithClient(<HomePage />)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Should not call token verification endpoint if auth already checked
    const verificationCalls = (global.fetch as any).mock.calls.filter((call: any) =>
      call[0].includes('/api/transactions?limit=1')
    )
    expect(verificationCalls.length).toBe(0)
  })
})
