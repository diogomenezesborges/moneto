/**
 * DashboardHero Component Tests
 *
 * Tests for Issue #232: Dashboard landing with KPI cards
 * Tests for Issue #198: Real net worth from account balances + investments
 * Verifies KPI calculations, color coding, responsive layout, and quick actions
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardHero } from './DashboardHero'

// Mock useSavingsTrend hook used by SavingsRateHero — prevents QueryClient errors in tests
vi.mock('@/lib/queries/stats', () => ({
  useSavingsTrend: vi.fn(() => ({ data: [], isLoading: false })),
}))

// Mock useNetWorth hook — real data comes from /api/net-worth (Issue #198)
vi.mock('@/lib/queries/net-worth', () => ({
  useNetWorth: vi.fn(() => ({
    data: {
      netWorth: 23500,
      accountBalances: 15000,
      investmentValue: 8500,
      accounts: [
        {
          bank: 'Main Bank',
          origin: 'Personal',
          balance: 15000,
          lastTransactionDate: '2026-02-01T00:00:00.000Z',
        },
      ],
      holdings: [{ id: '1', name: 'IWDA ETF', type: 'ETF', currentValue: 8500, totalCost: 7500 }],
      history: [
        { month: '2026-01', netWorth: 22000, accountBalances: 14000, investmentValue: 8000 },
        { month: '2026-02', netWorth: 23500, accountBalances: 15000, investmentValue: 8500 },
      ],
    },
    isLoading: false,
  })),
  calculateTrend: vi.fn(() => ({
    change: 1500,
    changePercent: 6.82,
    direction: 'up',
  })),
}))

describe('DashboardHero', () => {
  const mockStats = {
    metrics: {
      totalIncome: 5000,
      totalExpenses: 3000,
      savingsRate: 40,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render the component with all KPI cards', () => {
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      // Header
      expect(screen.getByText('Visão Geral')).toBeInTheDocument()

      // KPI cards
      expect(screen.getByText('Patrimônio Líquido')).toBeInTheDocument()
      expect(screen.getByText('Taxa de Poupança')).toBeInTheDocument()
      expect(screen.getByText('Orçamento Mensal')).toBeInTheDocument()
    })

    it('should render in English when language is "en"', () => {
      render(<DashboardHero stats={mockStats} reviewCount={0} language="en" />)

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Net Worth')).toBeInTheDocument()
      expect(screen.getByText('Savings Rate')).toBeInTheDocument()
      expect(screen.getByText('Monthly Budget')).toBeInTheDocument()
    })
  })

  describe('Net Worth KPI — real API data (Issue #198)', () => {
    it('should display real net worth from useNetWorth hook', () => {
      const { container } = render(
        <DashboardHero stats={mockStats} reviewCount={0} language="pt" />
      )

      // Real net worth = 23 500 EUR (from mocked useNetWorth)
      const cards = container.querySelectorAll('.bg-gray-50')
      const netWorthCard = Array.from(cards).find(card =>
        card.textContent?.includes('Patrimônio Líquido')
      )
      expect(netWorthCard).toBeDefined()
      expect(netWorthCard?.textContent).toMatch(/23\s?500\s?€/)
    })

    it('should display trend indicator when history has >= 2 months', () => {
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      // Trend from mock: +6.82 → toFixed(1) → "+6.8% vs. mês ant."
      expect(screen.getByText(/\+6\.8%.*vs\. mês ant\./)).toBeInTheDocument()
    })

    it('should show loading skeleton when isLoading is true', async () => {
      const { useNetWorth } = await import('@/lib/queries/net-worth')
      vi.mocked(useNetWorth).mockReturnValueOnce({ data: undefined, isLoading: true } as ReturnType<
        typeof useNetWorth
      >)

      const { container } = render(
        <DashboardHero stats={mockStats} reviewCount={0} language="pt" />
      )

      const netWorthCard = container.querySelectorAll('.bg-gray-50')[0]
      expect(netWorthCard?.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })

  describe('Savings Rate KPI - Color Coding', () => {
    it('should display red color for negative savings rate', () => {
      const negativeRate = {
        metrics: {
          totalIncome: 1000,
          totalExpenses: 1500,
          savingsRate: -50,
        },
      }

      render(<DashboardHero stats={negativeRate} reviewCount={0} language="pt" />)

      const rateElement = screen.getByText('-50.0%')
      expect(rateElement).toHaveClass('text-red-600')
      expect(screen.getByText('Gastando mais que ganha')).toBeInTheDocument()
    })

    it('should display amber color for savings rate 0-15%', () => {
      const lowRate = {
        metrics: {
          totalIncome: 1000,
          totalExpenses: 900,
          savingsRate: 10,
        },
      }

      render(<DashboardHero stats={lowRate} reviewCount={0} language="pt" />)

      const rateElement = screen.getByText('10.0%')
      expect(rateElement).toHaveClass('text-amber-600')
      expect(screen.getByText('Pode melhorar')).toBeInTheDocument()
    })

    it('should display green color for savings rate >= 15%', () => {
      const highRate = {
        metrics: {
          totalIncome: 5000,
          totalExpenses: 3000,
          savingsRate: 40,
        },
      }

      render(<DashboardHero stats={highRate} reviewCount={0} language="pt" />)

      const rateElement = screen.getByText('40.0%')
      expect(rateElement).toHaveClass('text-emerald-600')
      expect(screen.getByText('Excelente!')).toBeInTheDocument()
    })

    it('should display correct English messages for savings rate', () => {
      const negativeRate = {
        metrics: {
          totalIncome: 1000,
          totalExpenses: 1500,
          savingsRate: -50,
        },
      }

      render(<DashboardHero stats={negativeRate} reviewCount={0} language="en" />)
      expect(screen.getByText('Spending more than earning')).toBeInTheDocument()

      const lowRate = {
        metrics: {
          totalIncome: 1000,
          totalExpenses: 900,
          savingsRate: 10,
        },
      }
      const { rerender } = render(<DashboardHero stats={lowRate} reviewCount={0} language="en" />)
      expect(screen.getByText('Can improve')).toBeInTheDocument()

      const highRate = {
        metrics: {
          totalIncome: 5000,
          totalExpenses: 3000,
          savingsRate: 40,
        },
      }
      rerender(<DashboardHero stats={highRate} reviewCount={0} language="en" />)
      expect(screen.getByText('Excellent!')).toBeInTheDocument()
    })
  })

  describe('Monthly Budget KPI - Progress Bar', () => {
    it('should display green progress bar when under 80% of budget', () => {
      const underBudget = {
        metrics: {
          totalIncome: 3000,
          totalExpenses: 1000, // 50% of 2000 budget
          savingsRate: 66.6,
        },
      }

      render(<DashboardHero stats={underBudget} reviewCount={0} language="pt" />)

      expect(screen.getByText(/1\s?000\s?€/)).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()

      // Find progress bar by its container
      const progressBar = document.querySelector('.bg-emerald-500')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should display amber progress bar when 80-100% of budget', () => {
      const nearBudget = {
        metrics: {
          totalIncome: 3000,
          totalExpenses: 1800, // 90% of 2000 budget
          savingsRate: 40,
        },
      }

      render(<DashboardHero stats={nearBudget} reviewCount={0} language="pt" />)

      expect(screen.getByText(/1\s?800\s?€/)).toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument()

      const progressBar = document.querySelector('.bg-amber-500')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle({ width: '90%' })
    })

    it('should display red progress bar when over budget', () => {
      const overBudget = {
        metrics: {
          totalIncome: 3000,
          totalExpenses: 2500, // 125% of 2000 budget
          savingsRate: 16.6,
        },
      }

      render(<DashboardHero stats={overBudget} reviewCount={0} language="pt" />)

      expect(screen.getByText(/2\s?500\s?€/)).toBeInTheDocument()
      expect(screen.getByText('125%')).toBeInTheDocument()

      const progressBar = document.querySelector('.bg-red-500')
      expect(progressBar).toBeInTheDocument()
      // Should cap at 100% width
      expect(progressBar).toHaveStyle({ width: '100%' })
    })

    it('should display budget target correctly', () => {
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      expect(screen.getByText(/Meta.*2\s?000\s?€/)).toBeInTheDocument()
    })
  })

  describe('Collapsible Behavior', () => {
    it('should start expanded by default', () => {
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      // KPI cards should be visible
      expect(screen.getByText('Patrimônio Líquido')).toBeInTheDocument()
    })

    it('should collapse when chevron button is clicked', async () => {
      const user = userEvent.setup()
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      const collapseButton = screen.getByLabelText('Collapse')
      await user.click(collapseButton)

      // KPI cards should not be visible
      expect(screen.queryByText('Patrimônio Líquido')).not.toBeInTheDocument()
    })

    it('should expand again when chevron button is clicked twice', async () => {
      const user = userEvent.setup()
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      const collapseButton = screen.getByLabelText('Collapse')
      await user.click(collapseButton)
      await user.click(screen.getByLabelText('Expand'))

      // KPI cards should be visible again
      expect(screen.getByText('Patrimônio Líquido')).toBeInTheDocument()
    })

    it('should rotate chevron icon when collapsed', async () => {
      const user = userEvent.setup()
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      const collapseButton = screen.getByLabelText('Collapse')
      const chevronIcon = collapseButton.querySelector('svg')

      // Initially rotated (expanded state)
      expect(chevronIcon).toHaveClass('rotate-180')

      await user.click(collapseButton)

      // No rotation when collapsed
      expect(chevronIcon).not.toHaveClass('rotate-180')
    })
  })

  describe('Review Quick Action', () => {
    it('should not display quick action when reviewCount is 0', () => {
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      expect(screen.queryByText(/itens para revisar/)).not.toBeInTheDocument()
      expect(screen.queryByText('Revisar')).not.toBeInTheDocument()
    })

    it('should display quick action when reviewCount > 0', () => {
      render(<DashboardHero stats={mockStats} reviewCount={5} language="pt" />)

      expect(screen.getByText('5 itens para revisar')).toBeInTheDocument()
      expect(screen.getByText('Transações importadas aguardando aprovação')).toBeInTheDocument()
    })

    it('should display singular form for reviewCount = 1', () => {
      render(<DashboardHero stats={mockStats} reviewCount={1} language="pt" />)

      expect(screen.getByText('1 item para revisar')).toBeInTheDocument()
    })

    it('should display English text when language is "en"', () => {
      render(<DashboardHero stats={mockStats} reviewCount={5} language="en" />)

      expect(screen.getByText('5 items to review')).toBeInTheDocument()
      expect(screen.getByText('Imported transactions awaiting approval')).toBeInTheDocument()
    })

    it('should call onNavigateToReview when review button is clicked', async () => {
      const user = userEvent.setup()
      const mockNavigate = vi.fn()

      render(
        <DashboardHero
          stats={mockStats}
          reviewCount={5}
          language="pt"
          onNavigateToReview={mockNavigate}
        />
      )

      const reviewButton = screen.getByText('Revisar')
      await user.click(reviewButton)

      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('should not display review button when onNavigateToReview is not provided', () => {
      render(<DashboardHero stats={mockStats} reviewCount={5} language="pt" />)

      expect(screen.queryByText('Revisar')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility - Touch Targets (Issue #232)', () => {
    it('should have minimum 44x44px touch targets for chevron button', () => {
      render(<DashboardHero stats={mockStats} reviewCount={0} language="pt" />)

      const chevronButton = screen.getByLabelText('Collapse')
      expect(chevronButton).toHaveClass('min-h-[44px]')
      expect(chevronButton).toHaveClass('min-w-[44px]')
    })

    it('should have minimum 44px height for review button', () => {
      render(
        <DashboardHero
          stats={mockStats}
          reviewCount={5}
          language="pt"
          onNavigateToReview={() => {}}
        />
      )

      const reviewButton = screen.getByText('Revisar')
      expect(reviewButton).toHaveClass('min-h-[44px]')
    })
  })

  describe('Currency Formatting', () => {
    it('should format currency in Portuguese format (EUR)', () => {
      const { container } = render(
        <DashboardHero stats={mockStats} reviewCount={0} language="pt" />
      )

      // Portuguese format: uses non-breaking space, no cents
      // Find specific cards to avoid ambiguity
      const cards = container.querySelectorAll('.bg-gray-50')

      // Net worth from API mock: 23 500 €
      const netWorthCard = Array.from(cards).find(card =>
        card.textContent?.includes('Patrimônio Líquido')
      )
      expect(netWorthCard?.textContent).toMatch(/23\s?500\s?€/)

      // Budget from stats.metrics.totalExpenses = 3000 €
      const budgetCard = Array.from(cards).find(card =>
        card.textContent?.includes('Orçamento Mensal')
      )
      expect(budgetCard?.textContent).toMatch(/3\s?000\s?€/)
    })

    it('should format large numbers correctly', () => {
      const largeStats = {
        metrics: {
          totalIncome: 150000,
          totalExpenses: 50000,
          savingsRate: 66.6,
        },
      }

      render(<DashboardHero stats={largeStats} reviewCount={0} language="pt" />)

      // Net worth from mock is still 23 500 €; budget = 50 000 €
      expect(screen.getByText(/23\s?500\s?€/)).toBeInTheDocument()
      expect(screen.getByText(/50\s?000\s?€/)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero income and expenses', () => {
      const zeroStats = {
        metrics: {
          totalIncome: 0,
          totalExpenses: 0,
          savingsRate: 0,
        },
      }

      render(<DashboardHero stats={zeroStats} reviewCount={0} language="pt" />)

      // Budget card shows 0 €; net worth still comes from mock (23 500 €)
      expect(screen.getByText('0.0%')).toBeInTheDocument()
      expect(screen.getByText(/23\s?500\s?€/)).toBeInTheDocument()
    })

    it('should handle very large savings rate', () => {
      const highSavings = {
        metrics: {
          totalIncome: 10000,
          totalExpenses: 100,
          savingsRate: 99,
        },
      }

      render(<DashboardHero stats={highSavings} reviewCount={0} language="pt" />)

      expect(screen.getByText('99.0%')).toBeInTheDocument()
      expect(screen.getByText('Excelente!')).toBeInTheDocument()
    })

    it('should handle decimal savings rate', () => {
      const decimalRate = {
        metrics: {
          totalIncome: 3000,
          totalExpenses: 1950,
          savingsRate: 35.5,
        },
      }

      render(<DashboardHero stats={decimalRate} reviewCount={0} language="pt" />)

      expect(screen.getByText('35.5%')).toBeInTheDocument()
    })
  })
})
