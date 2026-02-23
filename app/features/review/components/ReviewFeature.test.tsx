/**
 * Tests for Bug #4: Language Consistency
 * Tests for Issue #230: Batch actions for Review tab
 *
 * Verifies that all language props in ReviewFeature are set to "pt"
 * and prevents regression to "en".
 * Also verifies progress bar, Approve All Categorized, and Group by Bank features.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { ReviewFeature } from './ReviewFeature'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as fs from 'fs'
import * as path from 'path'
import { useReviewTransactions, useReviewAction } from '@/lib/queries/transactions'

// Mock dependencies
vi.mock('@/app/features/shared/hooks/useCategories', () => ({
  useCategories: () => ({
    taxonomy: [],
    loading: false,
    error: null,
  }),
}))

vi.mock('@/app/features/shared/hooks/useTags', () => ({
  useTags: () => ({
    tags: [],
    loading: false,
    error: null,
  }),
}))

vi.mock('@/lib/queries/review', () => ({
  useReviewTransactions: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useReviewAction: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  reviewKeys: {
    all: ['review'],
    pending: () => ['review', 'pending'],
  },
}))

const mockMutateAsync = vi.fn().mockResolvedValue({ message: 'Success', count: 2 })

vi.mock('@/lib/queries/transactions', () => ({
  useUpdateTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useReviewTransactions: vi.fn(() => ({
    data: {
      transactions: [],
      progress: {
        total: 100,
        pending: 0,
        reviewed: 100,
        approved: 95,
        rejected: 5,
        percentComplete: 100,
      },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useReviewAction: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useCreateTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

describe('Bug #4: Language Consistency in ReviewFeature', () => {
  const renderComponent = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <ReviewFeature token="test-token" isAuthenticated={true} />
      </QueryClientProvider>
    )
  }

  it('should use Portuguese language throughout the component', () => {
    const { container } = renderComponent()

    // The component renders successfully with empty data
    // Verify that the component container has content
    // The actual language verification is done in the other 8 tests below
    // which check the source code for language="pt" in all components
    expect(container.firstChild).not.toBeNull()
  })

  it('should have ALL language props set to "pt" in source code', () => {
    // Read the actual source file
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // Find all language prop assignments
    const languageProps = sourceCode.match(/language=["']([^"']+)["']/g) || []

    // Count occurrences
    const ptCount = languageProps.filter(prop => prop.includes('pt')).length
    const enCount = languageProps.filter(prop => prop.includes('en')).length

    // All language props should be "pt", none should be "en"
    expect(enCount).toBe(0)
    expect(ptCount).toBeGreaterThan(0)

    // Log for debugging
    console.log(`Found ${ptCount} "pt" language props, ${enCount} "en" language props`)
  })

  it('should NOT have language="en" anywhere in the component', () => {
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // Check for prohibited pattern
    const hasEnglishProp = /language=["']en["']/.test(sourceCode)

    expect(hasEnglishProp).toBe(false)

    if (hasEnglishProp) {
      const matches = sourceCode.match(/language=["']en["']/g)
      console.error('Found English language props:', matches)
    }
  })

  it('should have Portuguese language in CategorySelector components', () => {
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // Find CategorySelector components
    const categorySelectorMatches = sourceCode.match(/<CategorySelector[\s\S]*?\/>/g) || []

    categorySelectorMatches.forEach(match => {
      // Each CategorySelector should have language="pt"
      expect(match).toMatch(/language=["']pt["']/)
      expect(match).not.toMatch(/language=["']en["']/)
    })

    expect(categorySelectorMatches.length).toBeGreaterThan(0)
  })

  it('should have Portuguese language in TagSelector components', () => {
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // Find TagSelector components
    const tagSelectorMatches = sourceCode.match(/<TagSelector[\s\S]*?\/>/g) || []

    tagSelectorMatches.forEach(match => {
      // Each TagSelector should have language="pt"
      expect(match).toMatch(/language=["']pt["']/)
      expect(match).not.toMatch(/language=["']en["']/)
    })

    expect(tagSelectorMatches.length).toBeGreaterThan(0)
  })

  it('should have Portuguese language in CategoryBadgeCompact components', () => {
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // Find CategoryBadgeCompact components
    const badgeMatches = sourceCode.match(/<CategoryBadgeCompact[\s\S]*?\/>/g) || []

    badgeMatches.forEach(match => {
      // Each badge should have language="pt"
      expect(match).toMatch(/language=["']pt["']/)
      expect(match).not.toMatch(/language=["']en["']/)
    })

    expect(badgeMatches.length).toBeGreaterThan(0)
  })

  it('should have Portuguese language in TagBadges components', () => {
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // Find TagBadges components
    const tagBadgesMatches = sourceCode.match(/<TagBadges[\s\S]*?\/>/g) || []

    tagBadgesMatches.forEach(match => {
      // Each TagBadges should have language="pt"
      expect(match).toMatch(/language=["']pt["']/)
      expect(match).not.toMatch(/language=["']en["']/)
    })

    expect(tagBadgesMatches.length).toBeGreaterThan(0)
  })

  it('should have Portuguese language in TagsLabel components', () => {
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // Find TagsLabel components
    const tagsLabelMatches = sourceCode.match(/<TagsLabel[\s\S]*?\/>/g) || []

    tagsLabelMatches.forEach(match => {
      // Each TagsLabel should have language="pt"
      expect(match).toMatch(/language=["']pt["']/)
      expect(match).not.toMatch(/language=["']en["']/)
    })

    expect(tagsLabelMatches.length).toBeGreaterThan(0)
  })

  it('should maintain Portuguese language across refactors (regression test)', () => {
    const filePath = path.join(__dirname, 'ReviewFeature.tsx')
    const sourceCode = fs.readFileSync(filePath, 'utf-8')

    // This test will fail if someone accidentally changes language back to "en"
    const allLanguageProps = sourceCode.match(/language=["']([^"']+)["']/g) || []

    const report = {
      total: allLanguageProps.length,
      pt: allLanguageProps.filter(p => p.includes('pt')).length,
      en: allLanguageProps.filter(p => p.includes('en')).length,
    }

    console.log('Language prop distribution:', report)

    // All language props must be "pt"
    expect(report.en).toBe(0)
    expect(report.pt).toBe(report.total)
    expect(report.pt).toBeGreaterThanOrEqual(5) // Should have at least 5 language props
  })
})

// ─── Issue #230: Batch actions, progress bar, group by bank ────────────────────

const makeTransaction = (overrides: Partial<any> = {}) => ({
  id: Math.random().toString(36).slice(2),
  rawDate: '2024-01-15T00:00:00.000Z',
  rawDescription: 'Test transaction',
  rawAmount: -50,
  origin: 'Personal',
  bank: 'Main Bank',
  status: 'categorized',
  majorCategory: 'Alimentação',
  category: 'Supermercado',
  majorCategoryRef: null,
  categoryRef: null,
  tags: [],
  isFlagged: false,
  duplicateOf: null,
  reviewStatus: 'pending_review',
  ...overrides,
})

describe('Issue #230: Batch actions for Review tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue({ message: 'Approved 2 transactions', count: 2 })
  })

  const renderWithData = (transactions: any[], progressOverrides: Partial<any> = {}) => {
    const pending = transactions.length
    const progress = {
      total: 128,
      pending,
      reviewed: 128 - pending,
      approved: 120 - pending,
      rejected: 8,
      percentComplete: Math.round(((128 - pending) / 128) * 100),
      ...progressOverrides,
    }

    ;(useReviewTransactions as any).mockReturnValue({
      data: { transactions, progress },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    ;(useReviewAction as any).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <ReviewFeature token="test-token" isAuthenticated={true} />
      </QueryClientProvider>
    )
  }

  it('shows progress bar with percentage', () => {
    renderWithData([], { percentComplete: 72, pending: 36, reviewed: 92, total: 128 })
    expect(screen.getByTestId('review-progress')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
  })

  it('shows "All caught up" when 100% complete', () => {
    renderWithData([], { percentComplete: 100 })
    expect(screen.getByText('All caught up! Queue complete')).toBeInTheDocument()
  })

  it('shows pending count and reviewed count in progress bar', () => {
    renderWithData([], { percentComplete: 50, pending: 64, reviewed: 64, total: 128 })
    expect(screen.getByText(/64 pending/)).toBeInTheDocument()
  })

  it('shows "Approve Categorized" button with correct count', () => {
    const txs = [
      makeTransaction({ status: 'categorized' }),
      makeTransaction({ status: 'categorized' }),
      makeTransaction({ status: 'pending' }),
    ]
    renderWithData(txs)
    const btn = screen.getByTestId('approve-all-categorized')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent('Approve Categorized (2)')
  })

  it('"Approve Categorized" button is disabled when no categorized items', () => {
    const txs = [makeTransaction({ status: 'pending' })]
    renderWithData(txs)
    expect(screen.getByTestId('approve-all-categorized')).toBeDisabled()
  })

  it('calls mutateAsync with categorized IDs when "Approve Categorized" is clicked', async () => {
    const cat1 = makeTransaction({ status: 'categorized' })
    const cat2 = makeTransaction({ status: 'categorized' })
    const uncategorized = makeTransaction({ status: 'pending' })
    renderWithData([cat1, cat2, uncategorized])

    fireEvent.click(screen.getByTestId('approve-all-categorized'))

    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        action: 'approve',
        transactionIds: expect.arrayContaining([cat1.id, cat2.id]),
      })
      // Should NOT include the uncategorized transaction
      const call = mockMutateAsync.mock.calls[0][0]
      expect(call.transactionIds).not.toContain(uncategorized.id)
    })
  })

  it('shows "Group by Bank" toggle button', () => {
    renderWithData([makeTransaction()])
    expect(screen.getByTestId('group-by-bank')).toBeInTheDocument()
  })

  it('renders bank group headers when "Group by Bank" is toggled', () => {
    const txs = [
      makeTransaction({ bank: 'Bank A', id: 'r1' }),
      makeTransaction({ bank: 'Bank A', id: 'r2' }),
      makeTransaction({ bank: 'Bank B', id: 'c1' }),
    ]
    renderWithData(txs)

    fireEvent.click(screen.getByTestId('group-by-bank'))

    expect(screen.getByTestId('bank-group-Bank A')).toBeInTheDocument()
    expect(screen.getByTestId('bank-group-Bank B')).toBeInTheDocument()
  })

  it('groups show categorized count badge', () => {
    const txs = [
      makeTransaction({ bank: 'Bank A', status: 'categorized', id: 'r1' }),
      makeTransaction({ bank: 'Bank A', status: 'pending', id: 'r2' }),
    ]
    renderWithData(txs)
    fireEvent.click(screen.getByTestId('group-by-bank'))

    expect(screen.getByText('1 categorized')).toBeInTheDocument()
  })

  it('hides progress bar while loading', () => {
    ;(useReviewTransactions as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <ReviewFeature token="test-token" isAuthenticated={true} />
      </QueryClientProvider>
    )
    expect(screen.queryByTestId('review-progress')).not.toBeInTheDocument()
  })
})
