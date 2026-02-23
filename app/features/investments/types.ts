/**
 * Investment Tracking Types
 *
 * Type definitions for holdings, transactions, and portfolio analytics.
 * Issue #108: Investment Tracking - Feature Structure
 */

// ============================================================================
// Enums
// ============================================================================

export type HoldingType = 'ETF' | 'PPR' | 'STOCK' | 'BOND' | 'CRYPTO' | 'OTHER'
export type InvestmentTransactionType = 'BUY' | 'SELL'

// ============================================================================
// Core Models
// ============================================================================

export interface Holding {
  id: string
  userId: string
  name: string
  ticker: string | null
  type: HoldingType
  currency: string
  manualPrice: number | null
  manualPriceAt: Date | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InvestmentTransaction {
  id: string
  holdingId: string
  type: InvestmentTransactionType
  units: number
  pricePerUnit: number
  fees: number
  date: Date
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Extended Models (with calculated fields)
// ============================================================================

export interface HoldingWithStats extends Holding {
  // Calculated from transactions
  totalUnits: number // SUM(BUY.units) - SUM(SELL.units)
  averageCost: number // Weighted average of buy prices
  totalCost: number // Total amount invested (including fees)

  // Current value
  currentPrice: number | null // From manualPrice or price service
  currentValue: number | null // totalUnits * currentPrice

  // Performance metrics
  gainLoss: number | null // currentValue - totalCost
  gainLossPercent: number | null // (gainLoss / totalCost) * 100

  // Transactions (optional)
  transactions?: InvestmentTransaction[]
}

export interface InvestmentTransactionWithHolding extends InvestmentTransaction {
  holding: {
    id: string
    name: string
    ticker: string | null
    type: HoldingType
  }
}

// ============================================================================
// Portfolio Analytics
// ============================================================================

export interface PortfolioSummary {
  totalInvested: number
  currentValue: number
  totalGainLoss: number
  totalGainLossPercent: number
  holdingsCount: number
  lastUpdated: Date
}

export interface BenchmarkResult {
  benchmarkTicker: string
  benchmarkInvested: number
  benchmarkCurrentValue: number
  benchmarkGainLoss: number
  benchmarkGainLossPercent: number
}

// ============================================================================
// Price Service Types
// ============================================================================

export interface PriceQuote {
  ticker: string
  price: number
  currency: string
  change: number
  changePercent: number
  lastUpdated: Date
  source: 'yahoo' | 'cache'
}

// ============================================================================
// Form Data Types
// ============================================================================

export interface HoldingFormData {
  name: string
  ticker?: string | null
  type: HoldingType
  currency: string
  notes?: string | null
}

export interface HoldingUpdateData extends HoldingFormData {
  id: string
  manualPrice?: number | null
}

export interface TransactionFormData {
  holdingId: string
  type: InvestmentTransactionType
  units: number
  pricePerUnit: number
  fees: number
  date: Date
  notes?: string | null
}

// ============================================================================
// UI State Types
// ============================================================================

export type SortBy = 'name' | 'value' | 'gain' | 'type'
export type SortOrder = 'asc' | 'desc'

export interface HoldingsFilters {
  type?: HoldingType
  sortBy: SortBy
  sortOrder: SortOrder
}

// ============================================================================
// Cohort Tracking (Issue #114 Enhancement)
// ============================================================================

export interface PurchaseCohort {
  transactionId: string
  holdingId: string
  holdingName: string
  ticker: string | null
  purchaseDate: Date
  units: number
  pricePerUnit: number
  fees: number
  totalInvested: number // units * pricePerUnit + fees
  currentPrice: number | null
  currentValue: number | null // units * currentPrice
  gainLoss: number | null // currentValue - totalInvested
  gainLossPercent: number | null // (gainLoss / totalInvested) * 100
  daysHeld: number
  annualizedReturn: number | null
}

// ============================================================================
// Cost Transparency (Issue #114 Enhancement)
// ============================================================================

export type RecurringCostType =
  | 'PLATFORM_FEE'
  | 'MANAGEMENT_FEE'
  | 'CUSTODY_FEE'
  | 'FX_CONVERSION'
  | 'MARKET_FEE'

export type RecurringCostFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

export interface RecurringCost {
  id: string
  userId: string
  holdingId: string | null // null = portfolio-wide
  type: RecurringCostType
  amount: number
  frequency: RecurringCostFrequency
  startDate: Date
  endDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RecurringCostFormData {
  holdingId?: string | null
  type: RecurringCostType
  amount: number
  frequency: RecurringCostFrequency
  startDate: Date
  endDate?: Date | null
  notes?: string | null
}

export interface CostImpactAnalysis {
  holdingId: string | null
  holdingName: string | null
  costType: RecurringCostType
  annualizedCost: number
  impactOnReturns: number // Percentage points reduction
}

// ============================================================================
// Investment Review / Decision Journal (Issue #114 Enhancement)
// ============================================================================

export type ReviewType = 'QUARTERLY' | 'ANNUAL' | 'AD_HOC'

export interface InvestmentReview {
  id: string
  userId: string
  date: Date
  reviewType: ReviewType
  notes: string
  decisions: string[] // Array of decisions made
  attachedHoldings: string[] // Array of holding IDs reviewed
  createdAt: Date
  updatedAt: Date
}

export interface InvestmentReviewFormData {
  date: Date
  reviewType: ReviewType
  notes: string
  decisions: string[]
  attachedHoldings: string[]
}
