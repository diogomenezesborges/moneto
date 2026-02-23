/**
 * Review Queries (TanStack Query)
 *
 * Hooks for fetching and managing transactions pending review.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, getAuthHeaders } from '@/lib/stores/authStore'
import { transactionKeys, Transaction } from './transactions'

// Types
export interface ReviewTransaction extends Transaction {
  duplicateOf?: Transaction | null
  potentialDuplicateId?: string | null
}

export type ReviewAction = 'approve' | 'reject'

// Query keys
export const reviewKeys = {
  all: ['review'] as const,
  pending: () => [...reviewKeys.all, 'pending'] as const,
}

/**
 * Fetch transactions pending review
 */
async function fetchPendingReview(): Promise<ReviewTransaction[]> {
  const response = await fetch('/api/transactions/review', {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch pending review')
  }

  return response.json()
}

/**
 * Hook to fetch transactions pending review
 */
export function useReviewTransactions() {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: reviewKeys.pending(),
    queryFn: fetchPendingReview,
    enabled: isAuthenticated && !!token,
    // Review data should always be fresh - no stale time
    // This ensures immediate refetch after approve/reject actions
    staleTime: 0,
    // Refetch immediately when window regains focus
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook to approve or reject transactions
 */
export function useReviewAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      action,
      transactionIds,
    }: {
      action: ReviewAction
      transactionIds: string[]
    }) => {
      const response = await fetch('/api/transactions/review', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, transactionIds }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Review action failed' }))
        throw new Error(error.message || 'Review action failed')
      }

      return response.json()
    },
    // Optimistic update - immediately remove approved/rejected transactions from UI
    onMutate: async ({ transactionIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: reviewKeys.pending() })

      // Snapshot the previous value
      const previousReview = queryClient.getQueryData<ReviewTransaction[]>(reviewKeys.pending())

      // Optimistically update to remove the approved/rejected transactions
      queryClient.setQueryData<ReviewTransaction[]>(reviewKeys.pending(), old => {
        return old ? old.filter(t => !transactionIds.includes(t.id)) : []
      })

      // Return context with the snapshot
      return { previousReview }
    },
    // If the mutation fails, use the context to rollback
    onError: (_err, _variables, context) => {
      if (context?.previousReview) {
        queryClient.setQueryData(reviewKeys.pending(), context.previousReview)
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      // Invalidate and refetch both review and transactions queries
      // No refetchType parameter = refetches all matching queries (default behavior)
      // No await = non-blocking, TanStack Query handles refetch timing automatically
      queryClient.invalidateQueries({ queryKey: reviewKeys.all })
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}
