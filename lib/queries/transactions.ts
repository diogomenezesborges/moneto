/**
 * Transaction Queries (TanStack Query)
 *
 * Hooks for fetching and mutating transaction data.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useAuthStore, getAuthHeaders } from '@/lib/stores/authStore'

// ============================================================================
// Safe JSON Parsing Helper
// ============================================================================

/**
 * Safely parse JSON response with fallback
 * Prevents crashes from malformed JSON (HTML error pages, corrupted data, etc.)
 *
 * @param response - Fetch Response object
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed JSON or fallback value
 */
async function safeParseJSON<T>(response: Response, fallback: T): Promise<T> {
  try {
    return await response.json()
  } catch (error) {
    console.error('Failed to parse JSON response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return fallback
  }
}

// Types
export interface Transaction {
  id: string
  rawDescription: string
  rawAmount: number
  rawDate: string
  majorCategory: string | null
  category: string | null
  majorCategoryId: string | null
  categoryId: string | null
  majorCategoryRef?: { id: string; name: string; emoji?: string | null } | null
  categoryRef?: { id: string; name: string } | null
  tags: string[]
  notes: string | null
  origin: string
  bank: string | null
  status: string
  reviewStatus: string | null
  isFlagged: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  duplicateOf?: {
    id: string
    rawDescription: string
    rawAmount: number
    rawDate: string
  } | null
}

export interface TransactionFilters {
  period?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  origin?: string
  bank?: string
  majorCategory?: string
  category?: string
  search?: string
  page?: number
  limit?: number
  includeDeleted?: boolean
  onlyDeleted?: boolean
}

export interface TransactionsResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasMore: boolean
  }
}

export interface ReviewProgress {
  total: number
  pending: number
  reviewed: number
  approved: number
  rejected: number
  percentComplete: number
}

export interface ReviewTransactionsResponse {
  transactions: Transaction[]
  progress: ReviewProgress
}

export interface TransactionUpdate {
  id: string
  majorCategoryId?: string | null
  categoryId?: string | null
  tags?: string[]
  notes?: string | null
  isFlagged?: boolean
  rawDate?: string
  rawDescription?: string
  rawAmount?: number
  origin?: string
  bank?: string
}

// Query keys
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  stats: () => [...transactionKeys.all, 'stats'] as const,
  review: () => [...transactionKeys.all, 'review'] as const,
  trash: () => [...transactionKeys.all, 'trash'] as const,
}

/**
 * Fetch transactions with filters
 * Note: API currently returns transactions as a simple array, not paginated
 */
async function fetchTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const params = new URLSearchParams()

  if (filters.period) params.set('period', filters.period)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.origin && filters.origin !== 'all') params.set('origin', filters.origin)
  if (filters.bank && filters.bank !== 'all') params.set('bank', filters.bank)
  if (filters.majorCategory && filters.majorCategory !== 'all')
    params.set('majorCategory', filters.majorCategory)
  if (filters.category && filters.category !== 'all') params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.includeDeleted) params.set('includeDeleted', 'true')
  if (filters.onlyDeleted) params.set('onlyDeleted', 'true')

  const response = await fetch(`/api/transactions?${params.toString()}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch transactions' }))
    throw new Error(error.message || 'Failed to fetch transactions')
  }

  // VALIDATION FIX: Use safe JSON parsing to prevent crashes from malformed responses
  const data = await safeParseJSON<Transaction[]>(response, [])
  // API returns transactions directly as an array
  return Array.isArray(data) ? data : []
}

/**
 * Hook to fetch transactions
 */
export function useTransactions(
  filters: TransactionFilters = {},
  options?: Omit<UseQueryOptions<Transaction[]>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
    enabled: isAuthenticated && !!token,
    ...options,
  })
}

/**
 * Hook to create a new transaction
 */
// Input type for creating transactions (accepts Date or string for rawDate)
export interface TransactionCreateInput {
  rawDate?: Date | string | null
  rawDescription?: string
  rawAmount?: number
  origin?: string
  bank?: string
  majorCategoryId?: string | null
  categoryId?: string | null
  tags?: string[]
  notes?: string | null
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransactionCreateInput) => {
      // Transform from form format to API create schema format
      const dateValue = data.rawDate
      const dateString =
        dateValue instanceof Date
          ? dateValue.toISOString()
          : typeof dateValue === 'string'
            ? dateValue
            : undefined

      const apiData = {
        date: dateString,
        description: data.rawDescription,
        amount: data.rawAmount,
        origin: data.origin,
        bank: data.bank,
        majorCategoryId: data.majorCategoryId,
        categoryId: data.categoryId,
        tags: data.tags || [],
        notes: data.notes,
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactions: [apiData] }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create' }))
        throw new Error(error.message || 'Failed to create transaction')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate transaction queries to refetch
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

/**
 * Hook to update a transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransactionUpdate) => {
      const response = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to update' }))
        throw new Error(error.message || 'Failed to update transaction')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate transaction queries to refetch
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

/**
 * Hook to delete a transaction (soft delete by default)
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, permanent = false }: { id: string; permanent?: boolean }) => {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, permanent }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete' }))
        throw new Error(error.message || 'Failed to delete transaction')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

/**
 * Hook to bulk delete transactions
 */
export function useBulkDeleteTransactions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ids, permanent = false }: { ids: string[]; permanent?: boolean }) => {
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, permanent }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete' }))
        throw new Error(error.message || 'Failed to delete transactions')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

/**
 * Hook to fetch trashed transactions
 */
export function useTrashTransactions() {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: transactionKeys.trash(),
    queryFn: async () => {
      const response = await fetch('/api/transactions/trash', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trash')
      }

      return response.json() as Promise<Transaction[]>
    },
    enabled: isAuthenticated && !!token,
  })
}

/**
 * Hook to restore transactions from trash
 */
export function useRestoreTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch('/api/transactions/restore', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: transactionId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to restore' }))
        throw new Error(error.message || 'Failed to restore transaction')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.trash() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

/**
 * Hook to permanently delete from trash
 */
export function usePermanentDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await fetch('/api/transactions/permanent', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: transactionId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete' }))
        throw new Error(error.message || 'Failed to permanently delete')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.trash() })
    },
  })
}

/**
 * Hook to import transactions from file
 */
export function useImportTransactions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, origin, bank }: { file: File; origin: string; bank?: string }) => {
      // Parse file using client-side parser
      const { parseFile } = await import('@/lib/parsers')
      const { transactions: parsedTransactions } = await parseFile(file, 'user-id')

      // Add origin and bank to all parsed transactions
      const transactionsWithOriginBank = parsedTransactions.map(t => ({
        ...t,
        origin,
        bank: bank || t.bank, // Use provided bank or keep parsed bank
      }))

      // Send to API for import
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ transactions: transactionsWithOriginBank }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to import' }))
        throw new Error(error.message || 'Failed to import transactions')
      }

      // VALIDATION FIX: Use safe JSON parsing
      const data = await safeParseJSON<{ count?: number; skipped?: number; message?: string }>(
        response,
        {}
      )
      return {
        imported: data.count || 0,
        duplicates: data.skipped || 0,
        message: data.message,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

/**
 * Hook to fetch review transactions
 */
export function useReviewTransactions(
  options?: Omit<UseQueryOptions<ReviewTransactionsResponse>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: transactionKeys.review(),
    queryFn: async () => {
      const response = await fetch('/api/transactions/review', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch review transactions')
      }

      return response.json() as Promise<ReviewTransactionsResponse>
    },
    enabled: isAuthenticated && !!token,
    ...options,
  })
}

/**
 * Hook to approve/reject review transactions
 */
export function useReviewAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      action,
      transactionIds,
    }: {
      action: 'approve' | 'reject'
      transactionIds: string[]
    }) => {
      const response = await fetch('/api/transactions/review', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, transactionIds }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Failed to ${action}` }))
        throw new Error(error.message || `Failed to ${action} transactions`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.review() })
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

/**
 * Cash Flow Query Types
 */
export interface CashFlowFilters {
  dateFrom: string
  dateTo: string
  level?: string
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

/**
 * Bank Query Types
 */
export interface Bank {
  id: string
  name: string
}

export interface BanksResponse {
  banks: Bank[]
}

/**
 * Hook to fetch cash flow data
 */
export function useCashFlowData(
  filters: CashFlowFilters,
  options?: Omit<UseQueryOptions<CashFlowData>, 'queryKey' | 'queryFn'>
) {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: [...transactionKeys.all, 'cash-flow', filters] as const,
    queryFn: async () => {
      const params = new URLSearchParams({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        level: filters.level || 'category',
      })
      if (filters.origin && filters.origin !== 'all') params.append('origin', filters.origin)
      if (filters.bank && filters.bank !== 'all') params.append('bank', filters.bank)
      if (filters.majorCategory && filters.majorCategory !== 'all')
        params.append('majorCategory', filters.majorCategory)
      if (filters.category && filters.category !== 'all')
        params.append('category', filters.category)

      const response = await fetch(`/api/transactions/cash-flow?${params.toString()}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cash flow data')
      }

      return response.json() as Promise<CashFlowData>
    },
    enabled: isAuthenticated && !!token && !!filters.dateFrom && !!filters.dateTo,
    ...options,
  })
}

/**
 * Hook to fetch banks
 *
 * PERFORMANCE: Banks data is cached aggressively since it rarely changes
 * - staleTime: 1 hour - data considered fresh, no refetch needed
 * - gcTime: 24 hours - data kept in memory cache
 * - Matches backend Cache-Control headers for consistency
 */
export function useBanks(options?: Omit<UseQueryOptions<Bank[]>, 'queryKey' | 'queryFn'>) {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: ['banks'] as const,
    queryFn: async () => {
      const response = await fetch('/api/banks', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch banks')
      }

      // VALIDATION FIX: Use safe JSON parsing
      const data = await safeParseJSON<BanksResponse>(response, { banks: [] })
      return data.banks || []
    },
    enabled: isAuthenticated && !!token,
    staleTime: 1000 * 60 * 60, // 1 hour - consider data fresh
    gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache
    ...options,
  })
}
