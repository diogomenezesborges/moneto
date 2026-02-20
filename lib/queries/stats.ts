/**
 * Stats Queries (TanStack Query)
 *
 * Hooks for fetching statistics and analytics data.
 */

import { useQuery } from '@tanstack/react-query'
import { useAuthStore, getAuthHeaders } from '@/lib/stores/authStore'

// Types
export interface Stats {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  totalTransactions: number
  byCategory: Record<string, number>
  byOrigin: Record<string, number>
  byMonth: Record<string, { income: number; expenses: number }>
  statusCounts: Record<string, number>
}

export interface CashFlowFilters {
  period?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  level?: 'major' | 'category'
  origin?: string
  bank?: string
  majorCategory?: string
  category?: string
}

export interface CashFlowNode {
  id: string
  label: string
  amount: number
  color?: string
  level: number
}

export interface CashFlowLink {
  source: string
  target: string
  value: number
}

export interface CashFlowData {
  period: string
  totalIncome: number
  totalExpenses: number
  nodes: CashFlowNode[]
  links: CashFlowLink[]
}

export interface SavingsTrendPoint {
  month: string
  savingsRate: number
  income: number
  expenses: number
}

// Query keys
export const statsKeys = {
  all: ['stats'] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
  cashFlow: (filters: CashFlowFilters) => [...statsKeys.all, 'cashFlow', filters] as const,
  savingsTrend: () => [...statsKeys.all, 'savingsTrend'] as const,
}

/**
 * Fetch stats summary
 */
async function fetchStats(): Promise<Stats> {
  const response = await fetch('/api/transactions/stats', {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch stats')
  }

  return response.json()
}

/**
 * Hook to fetch stats
 */
export function useStats() {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: statsKeys.summary(),
    queryFn: fetchStats,
    enabled: isAuthenticated && !!token,
  })
}

/**
 * Fetch cash flow data
 */
async function fetchCashFlow(filters: CashFlowFilters): Promise<CashFlowData> {
  const params = new URLSearchParams()

  if (filters.period) params.set('period', filters.period)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.level) params.set('level', filters.level)
  if (filters.origin && filters.origin !== 'all') params.set('origin', filters.origin)
  if (filters.bank && filters.bank !== 'all') params.set('bank', filters.bank)
  if (filters.majorCategory && filters.majorCategory !== 'all')
    params.set('majorCategory', filters.majorCategory)
  if (filters.category && filters.category !== 'all') params.set('category', filters.category)

  const response = await fetch(`/api/transactions/cash-flow?${params.toString()}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch cash flow')
  }

  return response.json()
}

/**
 * Hook to fetch cash flow data
 */
export function useCashFlow(filters: CashFlowFilters = {}) {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: statsKeys.cashFlow(filters),
    queryFn: () => fetchCashFlow(filters),
    enabled: isAuthenticated && !!token,
  })
}

/**
 * Fetch savings rate trend (last 12 months)
 */
async function fetchSavingsTrend(): Promise<SavingsTrendPoint[]> {
  const response = await fetch('/api/stats/savings-trend', {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch savings trend')
  }

  return response.json()
}

/**
 * Hook to fetch monthly savings rate trend
 */
export function useSavingsTrend() {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: statsKeys.savingsTrend(),
    queryFn: fetchSavingsTrend,
    enabled: isAuthenticated && !!token,
  })
}
