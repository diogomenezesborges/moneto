/**
 * Rules Queries (TanStack Query)
 *
 * Hooks for fetching and mutating categorization rules.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, getAuthHeaders } from '@/lib/stores/authStore'

// Types
export interface Rule {
  id: string
  keyword: string
  majorCategory: string
  category: string
  tags: string[]
  isDefault: boolean
  createdAt: string
  deletedAt: string | null
}

export interface CreateRuleData {
  keyword: string
  majorCategory: string
  category: string
  tags?: string[]
}

// Query keys
export const ruleKeys = {
  all: ['rules'] as const,
  lists: () => [...ruleKeys.all, 'list'] as const,
}

/**
 * Fetch all rules
 */
async function fetchRules(): Promise<Rule[]> {
  const response = await fetch('/api/rules', {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch rules')
  }

  return response.json()
}

/**
 * Hook to fetch rules
 */
export function useRules() {
  const { isAuthenticated, token } = useAuthStore()

  return useQuery({
    queryKey: ruleKeys.lists(),
    queryFn: fetchRules,
    enabled: isAuthenticated && !!token,
  })
}

/**
 * Hook to create a rule
 */
export function useCreateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRuleData) => {
      const response = await fetch('/api/rules', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create rule' }))
        throw new Error(error.message || 'Failed to create rule')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.all })
    },
  })
}

/**
 * Hook to delete a rule (soft delete)
 */
export function useDeleteRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/rules', {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to delete rule' }))
        throw new Error(error.message || 'Failed to delete rule')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.all })
    },
  })
}

/**
 * Hook to apply rules to pending transactions
 */
export function useApplyRulesToPending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/transactions/auto-categorize', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to apply rules' }))
        throw new Error(error.message || 'Failed to apply rules')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate transactions since they were updated
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
