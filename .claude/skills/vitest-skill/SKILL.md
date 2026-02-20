# Vitest Testing Skill

---

name: vitest-skill
description: This skill should be used when writing tests, generating test coverage reports, and ensuring 85% minimum coverage threshold compliance.
auto_detect: vitest.config.ts
license: MIT

---

## Purpose

Provides Vitest testing framework knowledge for writing unit tests, integration tests, API route tests, and React component tests. Enforces project's mandatory 85% coverage threshold and testing best practices.

## When to Use

**Auto-activate when:**

- `vitest.config.ts` exists
- Creating/modifying test files (`*.test.ts`, `*.spec.ts`)
- Running coverage checks

**Specifically useful for:**

- Writing unit tests for utilities/functions
- Writing API route tests
- Writing React component tests
- Enforcing 85% coverage minimum
- Creating test utilities and helpers
- Mocking dependencies

## Capabilities

### 1. Project Test Configuration

**`vitest.config.ts`:**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./lib/queries/test-utils.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
      exclude: ['node_modules/', 'dist/', '.next/', '**/*.d.ts', '**/*.config.*', '**/coverage/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**Coverage Thresholds:**

- Statements: 85% minimum
- Branches: 80% minimum
- Functions: 85% minimum
- Lines: 85% minimum

**CI/CD Enforcement:** Tests run on every PR, fail if coverage drops below thresholds.

### 2. Test File Patterns

**Co-locate tests with source code:**

```
lib/queries/
├── budgets.ts
├── budgets.test.ts          # Tests for budgets.ts
├── transactions.ts
└── transactions.test.ts     # Tests for transactions.ts

app/api/budgets/
├── route.ts
└── route.test.ts            # Tests for API route
```

**Test File Naming:**

- `*.test.ts` or `*.spec.ts` for unit/integration tests
- `e2e/**/*.spec.ts` for E2E tests (Playwright)
- `*.benchmark.ts` for performance benchmarks

### 3. Test Utilities

**Project Test Helpers (`lib/queries/test-utils.tsx`):**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

// Create test QueryClient
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,  // Disable retries in tests
        gcTime: Infinity,  // Disable cache garbage collection
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Wrapper for hooks that use React Query
export function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

// Mock fetch for API tests
export function mockFetch(response: any, status = 200) {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
    })
  )
}
```

### 4. Unit Test Patterns

**Testing Utility Functions:**

```typescript
// lib/utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from './formatters'

describe('formatCurrency', () => {
  it('should format positive amounts', () => {
    expect(formatCurrency(1234.56)).toBe('€1,234.56')
  })

  it('should format negative amounts', () => {
    expect(formatCurrency(-50.25)).toBe('-€50.25')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('€0.00')
  })

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(10.126)).toBe('€10.13')
  })
})

describe('formatDate', () => {
  it('should format dates in Portuguese locale', () => {
    const date = new Date('2024-01-15')
    expect(formatDate(date)).toBe('15/01/2024')
  })
})
```

**Testing Prisma Queries:**

```typescript
// lib/queries/budgets.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBudgets, createBudget } from './budgets'
import { prisma } from '@/lib/db'

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    budget: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('getBudgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return user budgets', async () => {
    const mockBudgets = [{ id: 1, userId: 1, categoryId: 10, amount: 1000, period: 'MONTHLY' }]

    vi.mocked(prisma.budget.findMany).mockResolvedValue(mockBudgets)

    const result = await getBudgets(1)

    expect(result).toEqual(mockBudgets)
    expect(prisma.budget.findMany).toHaveBeenCalledWith({
      where: { userId: 1 },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('createBudget', () => {
  it('should create budget with valid data', async () => {
    const mockBudget = {
      id: 1,
      userId: 1,
      categoryId: 10,
      amount: 1000,
      period: 'MONTHLY',
    }

    vi.mocked(prisma.budget.create).mockResolvedValue(mockBudget)

    const result = await createBudget(1, {
      categoryId: 10,
      amount: 1000,
      period: 'MONTHLY',
    })

    expect(result).toEqual(mockBudget)
    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: {
        userId: 1,
        categoryId: 10,
        amount: 1000,
        period: 'MONTHLY',
      },
    })
  })
})
```

### 5. API Route Tests

**Testing Next.js API Routes:**

```typescript
// app/api/budgets/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBudgets, createBudget } from '@/lib/queries/budgets'

vi.mock('@/lib/auth')
vi.mock('@/lib/queries/budgets')

describe('GET /api/budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/budgets')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return budgets for authenticated user', async () => {
    const mockUser = { id: 1, username: 'test' }
    const mockBudgets = [{ id: 1, categoryId: 10, amount: 1000, period: 'MONTHLY' }]

    vi.mocked(verifyToken).mockResolvedValue(mockUser)
    vi.mocked(getBudgets).mockResolvedValue(mockBudgets)

    const request = new NextRequest('http://localhost:3000/api/budgets')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.budgets).toEqual(mockBudgets)
  })
})

describe('POST /api/budgets', () => {
  it('should create budget with valid data', async () => {
    const mockUser = { id: 1, username: 'test' }
    const mockBudget = { id: 1, categoryId: 10, amount: 1000, period: 'MONTHLY' }

    vi.mocked(verifyToken).mockResolvedValue(mockUser)
    vi.mocked(createBudget).mockResolvedValue(mockBudget)

    const request = new NextRequest('http://localhost:3000/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId: 10, amount: 1000, period: 'MONTHLY' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.budget).toEqual(mockBudget)
  })

  it('should return 400 for invalid data', async () => {
    const mockUser = { id: 1, username: 'test' }

    vi.mocked(verifyToken).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ amount: 'invalid' }), // Invalid data
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
```

### 6. React Component Tests

**Testing with React Testing Library:**

```typescript
// app/features/budget/components/BudgetForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetForm } from './BudgetForm'
import { createTestQueryClient, createWrapper } from '@/lib/queries/test-utils'

describe('BudgetForm', () => {
  it('should render form fields', () => {
    const queryClient = createTestQueryClient()
    render(<BudgetForm />, { wrapper: createWrapper(queryClient) })

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = vi.fn()
    const queryClient = createTestQueryClient()

    render(<BudgetForm onSuccess={mockOnSuccess} />, {
      wrapper: createWrapper(queryClient),
    })

    // Fill form
    await user.type(screen.getByLabelText(/amount/i), '1000')
    await user.selectOptions(screen.getByLabelText(/category/i), '10')

    // Submit
    await user.click(screen.getByRole('button', { name: /create/i }))

    // Wait for mutation to complete
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show validation errors', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(<BudgetForm />, { wrapper: createWrapper(queryClient) })

    // Submit without filling form
    await user.click(screen.getByRole('button', { name: /create/i }))

    // Check for error messages
    expect(await screen.findByText(/amount is required/i)).toBeInTheDocument()
  })
})
```

### 7. Bug Fix Test Pattern

**Template for Bug Fix Tests:**

```typescript
/**
 * Tests for Bug #X: [Bug Description]
 *
 * Verifies that [what was fixed] works correctly.
 * Prevents regression of the bug in future changes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Bug #X: [Bug Name]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should [expected behavior that was broken]', () => {
    // Arrange - Set up test data
    const input = setupTestData()

    // Act - Execute the code
    const result = performAction(input)

    // Assert - Verify fix works
    expect(result).toBe(expected)
  })

  it('should handle edge case: [description]', () => {
    // Test edge cases to ensure comprehensive fix
  })

  it('should not break existing functionality', () => {
    // Regression test - ensure fix doesn't break other code
  })
})
```

### 8. Running Tests

**Commands:**

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e

# Run specific test file
npm run test -- budgets.test.ts

# Run tests matching pattern
npm run test -- --grep="Budget"
```

**Coverage Report:**

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
# Windows: start coverage/index.html
# Mac/Linux: open coverage/index.html
```

## Implementation Notes

### Project-Specific Rules

**Mandatory Test Coverage (85% minimum):**

- All new code must have tests before PR approval
- Bug fixes MUST include regression tests
- Coverage cannot decrease from baseline

**Test Organization:**

- Co-locate tests with source code
- Group tests by feature/module using `describe()`
- Use clear test names: `it('should [expected behavior]', ...)`

**Mocking Strategy:**

- Mock external dependencies (Prisma, fetch, auth)
- Don't mock code you're testing
- Use `vi.mock()` for module mocking
- Use `vi.fn()` for function mocking

### Common Pitfalls

**1. Forgetting to clear mocks:**

```typescript
// ❌ BAD: Mocks persist between tests
describe('Tests', () => {
  it('test 1', () => {
    vi.mocked(someFunction).mockReturnValue('value1')
    // ...
  })

  it('test 2', () => {
    // someFunction still returns 'value1'!
  })
})

// ✅ GOOD: Clear mocks between tests
describe('Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('test 1', () => {
    vi.mocked(someFunction).mockReturnValue('value1')
    // ...
  })

  it('test 2', () => {
    // someFunction is reset
  })
})
```

**2. Not waiting for async operations:**

```typescript
// ❌ BAD: Test passes before mutation completes
it('should create budget', async () => {
  await user.click(submitButton)
  expect(mockOnSuccess).toHaveBeenCalled() // May fail!
})

// ✅ GOOD: Wait for mutation
it('should create budget', async () => {
  await user.click(submitButton)

  await waitFor(() => {
    expect(mockOnSuccess).toHaveBeenCalled()
  })
})
```

**3. Testing implementation details:**

```typescript
// ❌ BAD: Tests component internals
it('should call handleSubmit', () => {
  const { result } = renderHook(() => useForm())
  result.current.handleSubmit()
  // ...
})

// ✅ GOOD: Tests user-visible behavior
it('should create budget when form is submitted', async () => {
  render(<BudgetForm />)
  await user.type(screen.getByLabelText(/amount/i), '1000')
  await user.click(screen.getByRole('button', { name: /create/i }))
  expect(await screen.findByText(/budget created/i)).toBeInTheDocument()
})
```

## Usage Examples

### Example 1: Test New Feature

**Task:** "Write tests for budget API"

**Implementation:**

```typescript
// app/api/budgets/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBudgets, createBudget } from '@/lib/queries/budgets'

vi.mock('@/lib/auth')
vi.mock('@/lib/queries/budgets')

describe('GET /api/budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null)
    const request = new NextRequest('http://localhost:3000/api/budgets')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return budgets for authenticated user', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 1, username: 'test' })
    vi.mocked(getBudgets).mockResolvedValue([{ id: 1, amount: 1000 }])

    const request = new NextRequest('http://localhost:3000/api/budgets')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.budgets).toHaveLength(1)
  })
})

describe('POST /api/budgets', () => {
  it('should create budget with valid data', async () => {
    vi.mocked(verifyToken).mockResolvedValue({ id: 1, username: 'test' })
    vi.mocked(createBudget).mockResolvedValue({ id: 1, amount: 1000 })

    const request = new NextRequest('http://localhost:3000/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ categoryId: 10, amount: 1000 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

```bash
# Run tests
npm run test -- budgets

# Verify coverage
npm run test:coverage
```

---

## References

- **Vitest Docs:** https://vitest.dev
- **React Testing Library:** https://testing-library.com/docs/react-testing-library/intro
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

**Project-Specific:**

- Testing Workflows: `.claude/workflows/testing-workflow.md`
- Test Utilities: `lib/queries/test-utils.tsx`

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
