# TanStack Query (React Query) Skill

---

name: tanstack-query-skill
description: This skill should be used when working with TanStack Query for data fetching, caching, mutations, and state management patterns.
auto_detect: package.json
license: MIT

---

## Purpose

Provides TanStack Query (React Query) knowledge for data fetching, caching strategies, optimistic updates, and query invalidation patterns used throughout the project.

## When to Use

**Auto-activate when:**

- `@tanstack/react-query` found in package.json
- Working on files in `lib/queries/`
- Implementing data fetching hooks

## Capabilities

### 1. Project Patterns

**Query Hooks Location:** `lib/queries/[feature].ts`

**Example Structure:**

```typescript
// lib/queries/budgets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await fetch('/api/budgets')
      if (!response.ok) throw new Error('Failed to fetch budgets')
      return response.json()
    },
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BudgetData) => {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create budget')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
```

### 2. Query Keys Strategy

**Hierarchical Keys:**

```typescript
['budgets']                  // All budgets
['budgets', userId]          // User-specific budgets
['budgets', userId, { year: 2024 }]  // Filtered budgets

['transactions']             // All transactions
['transactions', { page: 1, filters: {...} }]  // Paginated with filters
```

### 3. Invalidation Patterns

**After Mutations:**

```typescript
export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budgetId: number) => {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      // Invalidate all budget queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
```

### 4. Optimistic Updates

**Instant UI Updates:**

```typescript
export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Budget> }) => {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      return response.json()
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['budgets'] })

      // Snapshot previous value
      const previousBudgets = queryClient.getQueryData(['budgets'])

      // Optimistically update
      queryClient.setQueryData(['budgets'], (old: Budget[]) => {
        return old.map(b => (b.id === id ? { ...b, ...data } : b))
      })

      return { previousBudgets }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['budgets'], context?.previousBudgets)
    },
    onSettled: () => {
      // Refetch after mutation (error or success)
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
```

### 5. Testing with React Query

**Test Utilities (`lib/queries/test-utils.tsx`):**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  })
}

export function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}
```

**Testing Hooks:**

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useBudgets } from './budgets'
import { createTestQueryClient, createWrapper } from './test-utils'

it('should fetch budgets', async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ budgets: [{ id: 1, amount: 1000 }] }),
    })
  )

  const queryClient = createTestQueryClient()
  const { result } = renderHook(() => useBudgets(), {
    wrapper: createWrapper(queryClient),
  })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data.budgets).toHaveLength(1)
})
```

### 6. Pagination Pattern

**Infinite Queries:**

```typescript
export function useInfiniteTransactions(filters: Filters) {
  return useInfiniteQuery({
    queryKey: ['transactions', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/transactions?page=${pageParam}&filters=${JSON.stringify(filters)}`
      )
      return response.json()
    },
    getNextPageParam: lastPage => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })
}
```

### 7. Performance Tips

**Stale Time Configuration:**

```typescript
// Rarely changing data - cache for 5 minutes
useQuery({
  queryKey: ['categories'],
  queryFn: fetchCategories,
  staleTime: 5 * 60 * 1000,
})

// Frequently changing data - always refetch
useQuery({
  queryKey: ['transactions'],
  queryFn: fetchTransactions,
  staleTime: 0,
})
```

## Implementation Notes

**Project Migration Status:**

- ✅ Transactions: Fully migrated to TanStack Query
- ✅ Review: Migrated (Issue #36)
- ✅ CashFlow: Migrated (Issue #36)
- ✅ Stats: Migrated
- ✅ Rules: Migrated

**Provider Setup:** `app/providers.tsx` wraps app with `QueryClientProvider`

---

## References

- TanStack Query Docs: https://tanstack.com/query/latest
- Test Utilities: `lib/queries/test-utils.tsx`
- State Management Migration: Issue #36

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
