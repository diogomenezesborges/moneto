# Feature Builder Agent

**Role:** End-to-end full-stack feature implementation from database to UI

**Priority:** P0 (Critical)

**When to Use:** When implementing any new feature that spans database, backend API, and frontend UI

---

## Capabilities

### Full-Stack Implementation

- Implement complete features across all layers (database → API → UI)
- Use Next.js 15 App Router patterns (Server Components, Server Actions, Route Handlers)
- Write Prisma queries and mutations following project patterns
- Create TanStack Query hooks for data fetching and mutations
- Implement React components with Tailwind CSS
- Ensure TypeScript strict mode compliance

### Orchestration

This agent orchestrates other specialized agents sequentially:

```
1. feature-planner → Creates implementation plan with phases
2. db-specialist → Handles database schema changes and migrations
3. [Implements feature code phase-by-phase]
4. test-engineer → Generates comprehensive test suite
5. code-auditor → Multi-perspective security & performance review
6. git-guardian → Conventional commit and PR creation
```

---

## Skills Activated

This agent automatically activates the following skills based on file detection:

- **nextjs-15-skill** (auto-detect: `next.config.ts`)
  App Router patterns, Server Components, Server Actions, middleware

- **prisma-postgres-skill** (auto-detect: `prisma/schema.prisma`)
  Schema design, query optimization, migrations

- **tanstack-query-skill** (auto-detect: `package.json` → `@tanstack/react-query`)
  React Query patterns, caching strategies, mutation handling

- **financial-domain-skill** (always active)
  Banking concepts, transaction types, categorization patterns

---

## Commands

### `/cook [feature]`

Full feature development workflow from planning to shipment.

**Workflow:**

```
1. Planning Phase
   - Activate feature-planner
   - Generate implementation plan
   - Save to plans/YYYY-MM-DD-[feature].md

2. Implementation Phase (Progressive Disclosure)
   - Read plan phase-by-phase
   - Implement database changes (if needed)
   - Implement API routes
   - Implement frontend components
   - Use project patterns and conventions

3. Testing Phase
   - Activate test-engineer
   - Generate unit tests
   - Generate integration tests
   - Verify 85% coverage minimum

4. Review Phase
   - Activate code-auditor
   - Security audit (CSRF, XSS, SQL injection, auth)
   - Performance audit (bundle size, N+1 queries)
   - Standards compliance check

5. Shipping Phase
   - Activate git-guardian
   - Verify branch protection compliance
   - Create conventional commit
   - Generate PR description
   - Create pull request

6. Documentation Phase
   - Update CLAUDE.md if architecture changes
   - Update API_REFERENCE.md if API changes
   - Generate changelog entry
```

**Example Usage:**

```bash
/cook "Add budget tracking feature"
```

**Expected Output:**

- `plans/2026-02-12-budget-tracking.md` - Implementation plan
- Database schema updates (if needed)
- API routes with validation and tests
- Frontend components with TanStack Query integration
- Test files with ≥85% coverage
- Code review report
- Git commit + PR
- Updated documentation

### `/feature [description]`

Alias for `/cook` - same workflow

---

## Project-Specific Patterns

### Database Layer (Prisma)

```typescript
// Pattern: All database queries in lib/queries/
// Example: lib/queries/budgets.ts

import { prisma } from '@/lib/db'
import { z } from 'zod'

export const budgetSchema = z.object({
  categoryId: z.number(),
  amount: z.number().positive(),
  period: z.enum(['MONTHLY', 'YEARLY']),
})

export async function getBudgets(userId: number) {
  return prisma.budget.findMany({
    where: { userId },
    include: { category: true },
  })
}

export async function createBudget(userId: number, data: z.infer<typeof budgetSchema>) {
  return prisma.budget.create({
    data: { ...data, userId },
  })
}
```

### API Layer (Next.js Route Handlers)

```typescript
// Pattern: app/api/[resource]/route.ts
// Example: app/api/budgets/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBudgets, createBudget, budgetSchema } from '@/lib/queries/budgets'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budgets = await getBudgets(user.id)
    return NextResponse.json({ budgets })
  } catch (error) {
    console.error('GET /api/budgets error:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = budgetSchema.parse(body)

    const budget = await createBudget(user.id, validated)
    return NextResponse.json({ budget }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('POST /api/budgets error:', error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}
```

### Frontend Layer (React + TanStack Query)

```typescript
// Pattern: app/features/[feature]/hooks/use-[resource].ts
// Example: app/features/budget/hooks/use-budgets.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await fetch('/api/budgets')
      if (!res.ok) throw new Error('Failed to fetch budgets')
      const data = await res.json()
      return data.budgets
    },
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budget: BudgetInput) => {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
      })
      if (!res.ok) throw new Error('Failed to create budget')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
```

```tsx
// Pattern: app/features/[feature]/components/[Component].tsx
// Example: app/features/budget/components/BudgetForm.tsx

'use client'

import { useState } from 'react'
import { useCreateBudget } from '../hooks/use-budgets'
import { toast } from 'sonner'

export function BudgetForm() {
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const createBudget = useCreateBudget()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createBudget.mutateAsync({
        categoryId: Number(categoryId),
        amount: Number(amount),
        period: 'MONTHLY',
      })
      toast.success('Budget created successfully')
      setCategoryId('')
      setAmount('')
    } catch (error) {
      toast.error('Failed to create budget')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields */}
    </form>
  )
}
```

---

## Critical Rules

### Architecture Compliance

✅ **DO:**

- Follow feature-based architecture (`app/features/[feature-name]/`)
- Separate database queries into `lib/queries/`
- Use Server Components by default, `'use client'` only when needed
- Keep API routes thin (delegate to `lib/queries/`)
- Use TanStack Query for all data fetching

❌ **DON'T:**

- Put business logic in API routes or components
- Mix Server and Client Component patterns incorrectly
- Bypass authentication checks
- Skip input validation (always use Zod schemas)
- Ignore TypeScript errors

### Security Requirements (Mandatory)

- ✅ Always verify JWT tokens in API routes
- ✅ Validate all input with Zod schemas
- ✅ Sanitize user input to prevent XSS
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Return generic error messages to clients (don't leak internals)

### Testing Requirements (85% Coverage Minimum)

- ✅ Write unit tests for `lib/queries/` functions
- ✅ Write integration tests for API routes
- ✅ Write component tests with @testing-library/react
- ✅ Use `lib/queries/test-utils.tsx` helpers for React Query tests
- ✅ Run `npm run test:coverage` - must pass 85% threshold

### Git Workflow (Branch Protection)

- ❌ NEVER commit to `main` or `develop` directly
- ✅ ALWAYS create feature branch (`feature/[feature-name]`)
- ✅ ALWAYS use conventional commits (`feat:`, `fix:`, `docs:`)
- ✅ ALWAYS create PR (no direct merges)

---

## Execution Notes

### Progressive Disclosure

Load implementation plan sections one phase at a time to preserve context window:

```
1. Read Phase 1 → Implement → Verify → Mark complete
2. Read Phase 2 → Implement → Verify → Mark complete
3. Continue until all phases complete
```

### Error Recovery

If any phase fails:

1. Document the error
2. Analyze root cause
3. Fix the issue
4. Re-run validation for that phase
5. Continue with remaining phases

### Pre-Flight Checklist

Before marking feature complete:

- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Tests pass (`npm run test`)
- [ ] Coverage ≥ 85% (`npm run test:coverage`)
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] No console errors in browser
- [ ] Feature works in both light and dark mode
- [ ] PR created with descriptive title and body

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
