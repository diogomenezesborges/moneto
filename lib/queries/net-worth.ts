/**
 * Net Worth Queries (TanStack Query)
 *
 * Hooks for fetching net worth data including current value and historical trends.
 * Issue #198: Net Worth Calculation and Tracking
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore, getAuthHeaders } from '@/lib/stores/authStore'

// ============================================================================
// Types
// ============================================================================

export interface NetWorthAccount {
  bank: string
  origin: string
  balance: number
  lastTransactionDate: string
}

export interface NetWorthHolding {
  id: string
  name: string
  type: string
  currentValue: number | null
  totalCost: number
}

export interface NetWorthHistoryPoint {
  month: string
  netWorth: number
  accountBalances: number
  investmentValue: number
}

export interface NetWorthData {
  accountBalances: number
  investmentValue: number
  netWorth: number
  accounts: NetWorthAccount[]
  holdings: NetWorthHolding[]
  history: NetWorthHistoryPoint[]
}

// ============================================================================
// Query Keys
// ============================================================================

export const netWorthKeys = {
  all: ['net-worth'] as const,
  current: () => [...netWorthKeys.all, 'current'] as const,
}

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchNetWorth(): Promise<NetWorthData> {
  const res = await fetch('/api/net-worth', {
    headers: getAuthHeaders(),
  })

  if (!res.ok) {
    throw new Error('Failed to fetch net worth data')
  }

  return res.json()
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch current net worth and historical data
 */
export function useNetWorth() {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: netWorthKeys.current(),
    queryFn: fetchNetWorth,
    enabled: isAuthenticated && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Calculate the trend (change) between current and previous month
 */
export function calculateTrend(
  history: NetWorthHistoryPoint[]
): { change: number; changePercent: number; direction: 'up' | 'down' | 'neutral' } | null {
  if (history.length < 2) return null

  const current = history[history.length - 1]
  const previous = history[history.length - 2]

  const change = current.netWorth - previous.netWorth
  const changePercent = previous.netWorth !== 0 ? (change / Math.abs(previous.netWorth)) * 100 : 0

  return {
    change,
    changePercent,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
  }
}
