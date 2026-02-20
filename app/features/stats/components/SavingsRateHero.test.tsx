import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SavingsRateHero } from './SavingsRateHero'
import type { SavingsTrendPoint } from '@/lib/queries/stats'
import type { UseQueryResult } from '@tanstack/react-query'

// Mock recharts to avoid rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  Tooltip: () => null,
  ReferenceLine: () => null,
}))

// Mock the savings trend hook
const mockTrendData: SavingsTrendPoint[] = [
  { month: '2025-11', savingsRate: 20.5, income: 3000, expenses: 2385 },
  { month: '2025-12', savingsRate: 18.2, income: 3200, expenses: 2618 },
  { month: '2026-01', savingsRate: 22.8, income: 3100, expenses: 2393 },
]

vi.mock('@/lib/queries/stats', () => ({
  useSavingsTrend: vi.fn(() => ({
    data: mockTrendData,
    isLoading: false,
  })),
}))

import { useSavingsTrend } from '@/lib/queries/stats'

type MockQueryResult = Pick<UseQueryResult<SavingsTrendPoint[]>, 'data' | 'isLoading'>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = 'TestQueryWrapper'
  return Wrapper
}

function mockTrend(override: MockQueryResult) {
  vi.mocked(useSavingsTrend).mockReturnValue(override as UseQueryResult<SavingsTrendPoint[]>)
}

describe('SavingsRateHero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTrend({ data: mockTrendData, isLoading: false })
  })

  it('renders savings rate with correct value', () => {
    render(<SavingsRateHero savingsRate={22.8} language="en" />, { wrapper: createWrapper() })

    expect(screen.getByText('22.8%')).toBeDefined()
    expect(screen.getByText('Savings Rate')).toBeDefined()
  })

  it('renders in Portuguese when language is pt', () => {
    render(<SavingsRateHero savingsRate={22.8} language="pt" />, { wrapper: createWrapper() })

    expect(screen.getByText('Taxa de Poupan\u00e7a')).toBeDefined()
  })

  it('shows green color for rate > 15%', () => {
    render(<SavingsRateHero savingsRate={25} language="en" />, { wrapper: createWrapper() })

    const rateEl = screen.getByText('25.0%')
    expect(rateEl.className).toContain('text-emerald-600')
  })

  it('shows amber color for rate between 0-15%', () => {
    render(<SavingsRateHero savingsRate={10} language="en" />, { wrapper: createWrapper() })

    const rateEl = screen.getByText('10.0%')
    expect(rateEl.className).toContain('text-amber-600')
  })

  it('shows red color for negative rate', () => {
    render(<SavingsRateHero savingsRate={-5} language="en" />, { wrapper: createWrapper() })

    const rateEl = screen.getByText('-5.0%')
    expect(rateEl.className).toContain('text-red-600')
  })

  it('shows "Excellent!" message for high rate', () => {
    render(<SavingsRateHero savingsRate={25} language="en" />, { wrapper: createWrapper() })

    expect(screen.getByText('Excellent!')).toBeDefined()
  })

  it('shows "Can improve" message for low rate', () => {
    render(<SavingsRateHero savingsRate={10} language="en" />, { wrapper: createWrapper() })

    expect(screen.getByText('Can improve')).toBeDefined()
  })

  it('shows "Spending more than earning" for negative rate', () => {
    render(<SavingsRateHero savingsRate={-5} language="en" />, { wrapper: createWrapper() })

    expect(screen.getByText('Spending more than earning')).toBeDefined()
  })

  it('shows target reference at 25%', () => {
    render(<SavingsRateHero savingsRate={20} language="en" />, { wrapper: createWrapper() })

    expect(screen.getByText('Target: 25%')).toBeDefined()
  })

  it('shows delta indicator vs previous month', () => {
    // Last month: 22.8, previous: 18.2, delta = +4.6
    render(<SavingsRateHero savingsRate={22.8} language="en" />, { wrapper: createWrapper() })

    expect(screen.getByText('+4.6% vs. last mo.')).toBeDefined()
  })

  it('renders sparkline chart when trend data available', () => {
    render(<SavingsRateHero savingsRate={22.8} language="en" />, { wrapper: createWrapper() })

    expect(screen.getByTestId('area-chart')).toBeDefined()
  })

  it('shows loading state for chart', () => {
    mockTrend({ data: undefined, isLoading: true })

    render(<SavingsRateHero savingsRate={22.8} language="en" />, { wrapper: createWrapper() })

    // Should show loading placeholder (animate-pulse div)
    expect(screen.queryByTestId('area-chart')).toBeNull()
  })

  it('hides chart when no trend data', () => {
    mockTrend({ data: [], isLoading: false })

    render(<SavingsRateHero savingsRate={22.8} language="en" />, { wrapper: createWrapper() })

    expect(screen.queryByTestId('area-chart')).toBeNull()
  })

  it('hides delta when insufficient trend data', () => {
    mockTrend({
      data: [{ month: '2026-01', savingsRate: 22.8, income: 3100, expenses: 2393 }],
      isLoading: false,
    })

    render(<SavingsRateHero savingsRate={22.8} language="en" />, { wrapper: createWrapper() })

    expect(screen.queryByText(/vs\. last mo\./)).toBeNull()
  })

  it('applies custom className', () => {
    const { container } = render(
      <SavingsRateHero savingsRate={20} language="en" className="custom-class" />,
      { wrapper: createWrapper() }
    )

    expect(container.firstChild).toBeDefined()
    expect((container.firstChild as HTMLElement).className).toContain('custom-class')
  })
})
