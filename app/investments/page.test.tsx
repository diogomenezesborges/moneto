/**
 * Tests for Investments Page
 *
 * Issue #209: Fix broken navigation items (Cash Flow, Investments return 404)
 *
 * Verifies that the standalone investments page:
 * - Renders without crashing
 * - Renders the InvestmentsFeature component
 * - Handles dark mode toggle correctly
 * - Handles logout functionality
 * - Initializes from localStorage correctly
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import InvestmentsPage from './page'

// Mock Next.js router
const mockPush = vi.fn()
const mockRouter = { push: mockPush }

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock InvestmentsFeature component
vi.mock('@/app/features/investments', () => ({
  InvestmentsFeature: ({ token }: { token: string }) => (
    <div data-testid="investments-feature">Investments Feature (token: {token})</div>
  ),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Moon: () => <div>Moon</div>,
  Sun: () => <div>Sun</div>,
  FileText: () => <div>FileText</div>,
  Wallet: () => <div>Wallet</div>,
  Sparkles: () => <div>Sparkles</div>,
}))

describe('InvestmentsPage', () => {
  let localStorageMock: { [key: string]: string }

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock = {}

    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key]
      }),
      clear: vi.fn(() => {
        localStorageMock = {}
      }),
      length: 0,
      key: vi.fn(),
    } as Storage

    // Reset document.documentElement.classList
    document.documentElement.classList.remove('dark')

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render without crashing', async () => {
    localStorageMock['token'] = 'test-token-123'
    localStorageMock['darkMode'] = 'false'

    render(<InvestmentsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Moneto/i)).toBeInTheDocument()
    })
  })

  it('should render InvestmentsFeature component with token', async () => {
    const testToken = 'test-token-456'
    localStorageMock['token'] = testToken
    localStorageMock['darkMode'] = 'false'

    render(<InvestmentsPage />)

    await waitFor(() => {
      const feature = screen.getByTestId('investments-feature')
      expect(feature).toBeInTheDocument()
      expect(feature).toHaveTextContent(`token: ${testToken}`)
    })
  })

  it('should use dev token when no token in localStorage', async () => {
    localStorageMock['darkMode'] = 'false'

    render(<InvestmentsPage />)

    await waitFor(() => {
      const feature = screen.getByTestId('investments-feature')
      expect(feature).toBeInTheDocument()
      expect(feature).toHaveTextContent('token: dev-token-no-auth')
    })
  })

  it('should initialize dark mode from localStorage', async () => {
    localStorageMock['darkMode'] = 'true'
    localStorageMock['token'] = 'test-token'

    render(<InvestmentsPage />)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('should initialize light mode from localStorage', async () => {
    localStorageMock['darkMode'] = 'false'
    localStorageMock['token'] = 'test-token'

    render(<InvestmentsPage />)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('should toggle dark mode when button is clicked', async () => {
    localStorageMock['darkMode'] = 'false'
    localStorageMock['token'] = 'test-token'

    render(<InvestmentsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Moneto/i)).toBeInTheDocument()
    })

    // Find dark mode toggle button (has title attribute)
    const toggleButton = screen.getByTitle(/Switch to Dark Mode/i)
    expect(toggleButton).toBeInTheDocument()

    // Click to toggle to dark mode
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'true')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('should toggle from dark to light mode', async () => {
    localStorageMock['darkMode'] = 'true'
    localStorageMock['token'] = 'test-token'

    render(<InvestmentsPage />)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    // Find dark mode toggle button
    const toggleButton = screen.getByTitle(/Switch to Light Mode/i)
    expect(toggleButton).toBeInTheDocument()

    // Click to toggle to light mode
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('darkMode', 'false')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('should handle logout correctly', async () => {
    localStorageMock['token'] = 'test-token'
    localStorageMock['user'] = JSON.stringify({ id: 'user-1', name: 'Test User' })
    localStorageMock['darkMode'] = 'false'

    // Mock window.location.href
    delete (window as any).location
    ;(window as any).location = { href: '' }

    render(<InvestmentsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Logout/i)).toBeInTheDocument()
    })

    // Click logout button
    const logoutButton = screen.getByText(/Logout/i)
    fireEvent.click(logoutButton)

    // Verify localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('user')
    expect(window.location.href).toBe('/')
  })

  it('should render navigation link to transactions page', async () => {
    localStorageMock['token'] = 'test-token'
    localStorageMock['darkMode'] = 'false'

    render(<InvestmentsPage />)

    await waitFor(() => {
      const transactionsLink = screen.getByTitle(/Voltar às Transações/i)
      expect(transactionsLink).toBeInTheDocument()
      expect(transactionsLink).toHaveAttribute('href', '/')
    })
  })

  it('should render header with Moneto branding', async () => {
    localStorageMock['token'] = 'test-token'
    localStorageMock['darkMode'] = 'false'

    render(<InvestmentsPage />)

    await waitFor(() => {
      const brandingLink = screen.getByText(/Moneto/i)
      expect(brandingLink).toBeInTheDocument()
      expect(brandingLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  it('should render page after initialization completes', async () => {
    localStorageMock['darkMode'] = 'false'
    localStorageMock['token'] = 'test-token'

    render(<InvestmentsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('investments-feature')).toBeInTheDocument()
      expect(screen.getByText(/Moneto/i)).toBeInTheDocument()
    })
  })

  it('should preserve token across re-renders', async () => {
    const testToken = 'persistent-token-789'
    localStorageMock['token'] = testToken
    localStorageMock['darkMode'] = 'false'

    const { rerender } = render(<InvestmentsPage />)

    await waitFor(() => {
      const feature = screen.getByTestId('investments-feature')
      expect(feature).toHaveTextContent(`token: ${testToken}`)
    })

    // Rerender
    rerender(<InvestmentsPage />)

    await waitFor(() => {
      const feature = screen.getByTestId('investments-feature')
      expect(feature).toHaveTextContent(`token: ${testToken}`)
    })
  })

  it('should apply correct styling classes', async () => {
    localStorageMock['darkMode'] = 'false'
    localStorageMock['token'] = 'test-token'

    const { container } = render(<InvestmentsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('investments-feature')).toBeInTheDocument()
    })

    // Check for neutral design system classes
    const mainContainer = container.querySelector('.bg-gray-50')
    expect(mainContainer).toBeInTheDocument()

    // Check for backdrop blur on header
    const header = container.querySelector('header')
    expect(header).toHaveClass('backdrop-blur-md')
  })
})
