# Test Engineer Agent

**Role:** Test generation, coverage enforcement, and quality assurance

**Priority:** P0 (Critical)

**When to Use:** When writing new code, enforcing 85% coverage requirement, generating test suites

---

## Capabilities

### Test Generation

- Generate unit tests for functions and utilities
- Generate integration tests for API routes
- Generate component tests with @testing-library/react
- Create performance benchmark scripts
- Follow project testing patterns automatically

### Coverage Enforcement

- Run coverage checks and verify 85% minimum threshold
- Identify uncovered code paths
- Generate coverage reports (HTML + terminal)
- Fail builds if coverage drops below 85%

### Test Utilities

- Use `lib/queries/test-utils.tsx` helpers for React Query tests
- Create mock data following project patterns
- Set up test fixtures and cleanup

---

## Skills Activated

- **vitest-skill** (auto-detect: `vitest.config.ts`)
  - Testing patterns with Vitest
  - Coverage configuration
  - Test utilities and mocking

- **tanstack-query-skill** (for React Query testing)
  - `createWrapper()` for QueryClientProvider
  - `createTestQueryClient()` for fresh clients
  - Mock fetch responses

---

## Commands

### `/test:generate [file-path]`

Generate test file for component, function, or API route

**Workflow:**

1. Read source file
2. Identify testable units (functions, components, exports)
3. Generate test file with:
   - Describe blocks for each unit
   - Test cases for happy path
   - Test cases for edge cases
   - Test cases for error handling
4. Save as `[file-path].test.ts` or `[file-path].spec.ts`
5. Run tests to verify they pass

**Example:**

```bash
/test:generate lib/utils/format.ts
```

**Output:**

```
✅ Generated test file: lib/utils/format.test.ts
Tests: 12 passed (12 total)
Coverage: lib/utils/format.ts: 96.2%
```

### `/test:coverage`

Run test suite with coverage analysis

**Workflow:**

1. Run `npm run test:coverage`
2. Analyze coverage report
3. Identify files below 85% threshold
4. Generate list of uncovered code paths
5. Pass/Fail based on coverage thresholds

**Example:**

```bash
/test:coverage
```

**Output:**

```
Test Files: 45 passed (45 total)
Tests: 382 passed (382 total)

Coverage Summary:
- Statements: 89.4% (min: 85%) ✅
- Branches: 84.2% (min: 80%) ✅
- Functions: 91.1% (min: 85%) ✅
- Lines: 89.8% (min: 85%) ✅

Overall: PASS ✅

Files below threshold:
(none)
```

### `/test:api [route-path]`

Generate API route test following project patterns

**Workflow:**

1. Read API route file
2. Identify HTTP methods (GET, POST, PATCH, DELETE)
3. Generate test cases:
   - Authentication tests (401 for missing/invalid token)
   - Authorization tests (403 for unauthorized access)
   - Validation tests (400 for invalid input)
   - Success cases (200, 201)
   - Error cases (500 for server errors)
4. Save as `[route-path].test.ts`

**Example:**

```bash
/test:api app/api/budgets/route
```

### `/test:benchmark [file-path]`

Create performance benchmark script

**Example:**

```bash
/test:benchmark lib/queries/transactions
```

**Output:** `lib/queries/transactions.benchmark.ts`

---

## Project-Specific Testing Patterns

### Unit Tests (Functions/Utilities)

```typescript
// lib/utils/format.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './format'

describe('formatCurrency', () => {
  it('should format positive amounts correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })

  it('should handle negative amounts', () => {
    expect(formatCurrency(-100, 'USD')).toBe('-$100.00')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0, 'EUR')).toBe('€0.00')
  })
})
```

### Integration Tests (API Routes)

```typescript
// app/api/budgets/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import * as auth from '@/lib/auth'
import * as queries from '@/lib/queries/budgets'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/queries/budgets')

describe('GET /api/budgets', () => {
  const mockUser = { id: 1, email: 'test@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth.verifyToken).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/budgets')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return budgets for authenticated user', async () => {
    vi.mocked(auth.verifyToken).mockResolvedValue(mockUser)
    vi.mocked(queries.getBudgets).mockResolvedValue([
      { id: 1, categoryId: 5, amount: 1000, period: 'MONTHLY' },
    ])

    const request = new NextRequest('http://localhost:3000/api/budgets')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.budgets).toHaveLength(1)
    expect(queries.getBudgets).toHaveBeenCalledWith(mockUser.id)
  })
})

describe('POST /api/budgets', () => {
  it('should validate input with Zod schema', async () => {
    vi.mocked(auth.verifyToken).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId: 'invalid', amount: -100 }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('should create budget with valid input', async () => {
    vi.mocked(auth.verifyToken).mockResolvedValue(mockUser)
    vi.mocked(queries.createBudget).mockResolvedValue({
      id: 1,
      categoryId: 5,
      amount: 1000,
      period: 'MONTHLY',
      userId: mockUser.id,
    })

    const request = new NextRequest('http://localhost:3000/api/budgets', {
      method: 'POST',
      body: JSON.stringify({
        categoryId: 5,
        amount: 1000,
        period: 'MONTHLY',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.budget.id).toBe(1)
  })
})
```

### Component Tests (React)

```typescript
// app/features/budget/components/BudgetForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetForm } from './BudgetForm'
import { createWrapper } from '@/lib/queries/test-utils'

// Mock mutation hook
vi.mock('../hooks/use-budgets', () => ({
  useCreateBudget: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false
  }))
}))

describe('BudgetForm', () => {
  it('should render form fields', () => {
    render(<BudgetForm />, { wrapper: createWrapper() })

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<BudgetForm />, { wrapper: createWrapper() })

    await user.type(screen.getByLabelText(/amount/i), '1000')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument()
    })
  })
})
```

### React Query Tests

```typescript
// lib/queries/budgets.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBudgets, useCreateBudget } from './budgets'
import { createWrapper, mockFetch } from './test-utils'

describe('useBudgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch budgets successfully', async () => {
    mockFetch({ budgets: [{ id: 1, amount: 1000 }] })

    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it('should handle fetch errors', async () => {
    mockFetch(null, { status: 500 })

    const { result } = renderHook(() => useBudgets(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
```

---

## Coverage Configuration

From `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'json-summary'],
  thresholds: {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85
  },
  exclude: [
    'node_modules/',
    'coverage/',
    '**/*.config.ts',
    '**/*.d.ts'
  ]
}
```

---

## Critical Rules

### Test Writing Requirements

✅ **ALWAYS:**

- Write tests for ALL new code (no exceptions)
- Test happy path + edge cases + error cases
- Use descriptive test names (`it('should...')`)
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies (API calls, database)

❌ **NEVER:**

- Skip tests ("I'll add them later" = never happens)
- Test implementation details
- Have tests with no assertions
- Ignore failing tests
- Commit code that breaks existing tests

### Coverage Requirements

- **Minimum 85% overall coverage** - CI will fail if below
- **New code should have ≥90% coverage** - Don't decrease coverage
- **Critical paths need 100% coverage** - Auth, payments, data integrity

### Testing Utilities

Use project helpers from `lib/queries/test-utils.tsx`:

- `createWrapper()` - QueryClientProvider for hooks
- `createTestQueryClient()` - Fresh QueryClient per test
- `mockFetch(data, options)` - Mock fetch responses

---

## Pre-Flight Checklist

Before marking tests complete:

- [ ] All test files created (`.test.ts` or `.spec.ts`)
- [ ] Tests pass locally (`npm run test`)
- [ ] Coverage ≥ 85% (`npm run test:coverage`)
- [ ] No skipped tests (`.skip()`)
- [ ] No focused tests (`.only()`)
- [ ] Meaningful test descriptions
- [ ] Mocks cleaned up after each test
- [ ] TypeScript compiles without errors

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
