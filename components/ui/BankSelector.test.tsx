import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BankSelector } from './BankSelector'

// Mock the Select component
vi.mock('./Select', () => ({
  Select: ({
    value,
    onChange,
    options,
    placeholder,
    className,
    disabled,
  }: {
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    placeholder?: string
    className?: string
    disabled?: boolean
  }) => (
    <div data-testid="mock-select" className={className}>
      <button onClick={() => onChange(options[0]?.value)} disabled={disabled}>
        {value || placeholder}
      </button>
      <div>{options.length} options</div>
    </div>
  ),
}))

describe('BankSelector Component - Unified with Select (Issue #214)', () => {
  const mockBanks = [
    { id: '1', name: 'Bank A', slug: 'bank-a' },
    { id: '2', name: 'Bank B', slug: 'bank-b' },
    { id: '3', name: 'Bank C', slug: 'bank-c' },
  ]

  beforeEach(() => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ banks: mockBanks }),
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Data Loading', () => {
    it('should fetch banks from API on mount', async () => {
      const mockToken = 'test-token'
      render(<BankSelector value="" onChange={() => {}} token={mockToken} />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/banks', {
          headers: { Authorization: `Bearer ${mockToken}` },
        })
      })
    })

    it('should show loading state while fetching banks', () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      const loadingSkeleton = document.querySelector('.animate-pulse')
      expect(loadingSkeleton).toBeInTheDocument()
      expect(loadingSkeleton).toHaveClass('bg-gray-200', 'dark:bg-gray-700')
    })

    it('should render Select component after loading', async () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-select')).toBeInTheDocument()
      })
    })

    it('should pass banks as options to Select component', async () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('3 options')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error message when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      })

      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load banks')).toBeInTheDocument()
      })
    })

    it('should display error with design system colors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        const errorContainer = screen.getByText('Network error').closest('div')
        expect(errorContainer).toHaveClass('text-red-500', 'dark:text-red-400')
      })
    })

    it('should show Info icon on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Test error'))

      const { container } = render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        const icon = container.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('Props Delegation to Select', () => {
    it('should pass value prop to Select', async () => {
      render(<BankSelector value="Bank A" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('Bank A')).toBeInTheDocument()
      })
    })

    it('should handle null value as empty string', async () => {
      render(<BankSelector value={null} onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('Select Bank...')).toBeInTheDocument()
      })
    })

    it('should pass onChange handler to Select', async () => {
      const handleChange = vi.fn()
      render(<BankSelector value="" onChange={handleChange} token="test-token" />)

      await waitFor(() => {
        const button = screen.getByRole('button')
        button.click()
      })

      expect(handleChange).toHaveBeenCalledWith('Bank A')
    })

    it('should pass className to Select', async () => {
      render(
        <BankSelector value="" onChange={() => {}} token="test-token" className="custom-class" />
      )

      await waitFor(() => {
        expect(screen.getByTestId('mock-select')).toHaveClass('custom-class')
      })
    })

    it('should pass disabled prop to Select', async () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" disabled />)

      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).toBeDisabled()
      })
    })

    it('should use default placeholder "Select Bank..."', async () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('Select Bank...')).toBeInTheDocument()
      })
    })
  })

  describe('Bank Data Transformation', () => {
    it('should convert bank objects to Select option format', async () => {
      const customBanks = [
        { id: '1', name: 'Test Bank', slug: 'test-bank' },
        { id: '2', name: 'Another Bank', slug: 'another-bank' },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ banks: customBanks }),
      })

      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('2 options')).toBeInTheDocument()
      })
    })

    it('should handle empty banks array', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ banks: [] }),
      })

      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('0 options')).toBeInTheDocument()
      })
    })

    it('should handle missing banks property in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByText('0 options')).toBeInTheDocument()
      })
    })
  })

  describe('Design System Compliance', () => {
    it('should use design system colors for loading skeleton', () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      const loadingSkeleton = document.querySelector('.animate-pulse')
      expect(loadingSkeleton).toHaveClass('bg-gray-200', 'dark:bg-gray-700')
    })

    it('should use semantic error colors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Test error'))

      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        const errorContainer = screen.getByText('Test error').closest('div')
        expect(errorContainer).toHaveClass('text-red-500', 'dark:text-red-400')
      })
    })

    it('should apply rounded corners to loading skeleton', () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      const loadingSkeleton = document.querySelector('.animate-pulse')
      expect(loadingSkeleton).toHaveClass('rounded-xl')
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain same public API as before refactor', async () => {
      const handleChange = vi.fn()
      render(
        <BankSelector
          value="Bank B"
          onChange={handleChange}
          token="test-token"
          className="test-class"
          disabled={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('mock-select')).toBeInTheDocument()
      })

      // All props should be passed through correctly
      expect(screen.getByText('Bank B')).toBeInTheDocument()
      expect(screen.getByTestId('mock-select')).toHaveClass('test-class')
    })

    it('should handle optional props correctly', async () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-select')).toBeInTheDocument()
      })

      // Should work with only required props
      expect(screen.queryByText('Select Bank...')).toBeInTheDocument()
    })
  })

  describe('Integration with Select Component', () => {
    it('should delegate all dropdown behavior to Select component', async () => {
      render(<BankSelector value="" onChange={() => {}} token="test-token" />)

      await waitFor(() => {
        expect(screen.getByTestId('mock-select')).toBeInTheDocument()
      })

      // BankSelector should not implement its own dropdown logic
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('should pass through bank names as both value and label', async () => {
      const mockChange = vi.fn()
      render(<BankSelector value="" onChange={mockChange} token="test-token" />)

      await waitFor(() => {
        const button = screen.getByRole('button')
        button.click()
      })

      // Should pass the bank name directly
      expect(mockChange).toHaveBeenCalledWith('Bank A')
    })
  })
})
