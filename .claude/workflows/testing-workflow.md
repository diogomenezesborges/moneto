# Testing Workflow - Detailed Guide

> **Purpose**: Comprehensive testing requirements and guidelines for Moneto project.
> **Enforcement**: All code changes and bug fixes MUST include tests. No exceptions.

## Table of Contents

1. [Mandatory Testing Protocol](#mandatory-testing-protocol)
2. [Code Coverage Requirements](#code-coverage-requirements)
3. [Test File Organization](#test-file-organization)
4. [Testing Tools & Utilities](#testing-tools--utilities)
5. [Example Test Structures](#example-test-structures)
6. [Verification Checklist](#verification-checklist)
7. [Zero-Bug Production Strategy](#zero-bug-production-strategy)

---

## Mandatory Testing Protocol

**BEFORE marking any bug fix or feature as complete:**

### 1. Write Tests First (Test-Driven Development encouraged)

- **Unit tests** for individual functions/utilities
- **Integration tests** for API endpoints
- **Component tests** for UI changes

### 2. Run Test Suite

```bash
npm run test              # Run all unit/integration tests
npm run test:coverage     # Verify coverage thresholds
npm run test:e2e          # Run end-to-end tests (when applicable)
```

### 3. Verify All Tests Pass

- ✅ All existing tests must still pass
- ✅ New tests must pass
- ✅ Coverage must not decrease

### 4. For Performance Changes: Add Benchmarks

- Create benchmark script (e.g., `*.benchmark.ts`)
- Document baseline vs optimized performance
- Include query count analysis for database optimizations

---

## Code Coverage Requirements

### Minimum Coverage Thresholds

- **Overall Coverage**: 85% minimum
- **Statements**: 85% minimum
- **Branches**: 80% minimum
- **Functions**: 85% minimum
- **Lines**: 85% minimum

### Enforcement

```bash
# Run tests with coverage report
npm run test:coverage

# CI/CD will fail if coverage drops below thresholds
# Check coverage report in: coverage/index.html
```

### Coverage Rules

1. **New code must have ≥85% coverage** - No exceptions for features or bug fixes
2. **PRs cannot decrease overall coverage** - Must maintain or improve coverage
3. **Critical paths must have 100% coverage** - Auth, payments, data integrity
4. **Uncovered code requires justification** - Document why in PR description

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
# Windows: start coverage/index.html
# Mac/Linux: open coverage/index.html
```

---

## Test File Organization

### Naming Conventions

- **Unit/Integration Tests**: `*.test.ts` or `*.spec.ts`
- **E2E Tests**: `e2e/**/*.spec.ts`
- **Benchmarks**: `*.benchmark.ts`

### Location Strategy

**Co-locate tests with source code:**

- `lib/queries/review.ts` → `lib/queries/review.test.ts`
- `app/api/transactions/route.ts` → `app/api/transactions/route.test.ts`
- `app/features/settings/CategoryManagement.tsx` → `app/features/settings/CategoryManagement.test.tsx`

---

## Testing Tools & Utilities

### Frameworks & Libraries

- **Test Framework**: Vitest (configured in `vitest.config.ts`)
- **React Testing**: @testing-library/react, @testing-library/user-event
- **E2E Testing**: Playwright
- **Mocking**: Vitest `vi.mock()` and `vi.fn()`

### Common Test Utilities

- `lib/queries/test-utils.tsx` - React Query testing helpers
- `createWrapper(queryClient)` - Wrap hooks with QueryClientProvider
- `createTestQueryClient()` - Fresh QueryClient for each test

---

## Example Test Structures

### Unit Test Example

```typescript
/**
 * Tests for Bug #X: [Bug Description]
 *
 * Verifies that [what was fixed] works correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Bug #X: [Bug Name]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should [expected behavior]', () => {
    // Arrange
    const input = setupTestData()

    // Act
    const result = performAction(input)

    // Assert
    expect(result).toBe(expected)
  })

  it('should handle edge case: [description]', () => {
    // Test edge cases and error conditions
  })
})
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

describe('API Integration: /api/transactions', () => {
  beforeEach(async () => {
    // Setup test database state
  })

  afterEach(() => {
    cleanup()
  })

  it('should create transaction with valid data', async () => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(validTransactionData),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.transaction).toBeDefined()
  })
})
```

### Performance Benchmark Example

```typescript
/**
 * Benchmark for Bug #X: [Performance Fix]
 *
 * Compares OLD approach vs NEW approach with varying data sizes.
 * Run with: npx tsx path/to/file.benchmark.ts
 */

async function runBenchmark() {
  console.log('OLD APPROACH:')
  const oldStart = performance.now()
  await oldImplementation()
  const oldDuration = performance.now() - oldStart

  console.log('NEW APPROACH:')
  const newStart = performance.now()
  await newImplementation()
  const newDuration = performance.now() - newStart

  console.log(`\nResults:`)
  console.log(`Old: ${oldDuration.toFixed(2)}ms`)
  console.log(`New: ${newDuration.toFixed(2)}ms`)
  console.log(`Speedup: ${(oldDuration / newDuration).toFixed(2)}x faster`)
}

runBenchmark()
```

---

## Verification Checklist

**Before committing bug fixes or new features:**

- [ ] ✅ Tests written for the bug fix/feature
- [ ] ✅ Tests verify the fix/feature works correctly
- [ ] ✅ Tests prevent regression (bug won't come back)
- [ ] ✅ Edge cases tested
- [ ] ✅ Error conditions tested
- [ ] ✅ All tests pass (`npm run test`)
- [ ] ✅ Coverage meets 85% minimum (`npm run test:coverage`)
- [ ] ✅ Coverage did not decrease from baseline
- [ ] ✅ TypeScript compiles (`npx tsc --noEmit`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ (Performance fixes only) Benchmark shows improvement

---

## Zero-Bug Production Strategy

**This project follows a strict zero-bug policy:**

### Core Principles

1. **Every bug fix must include tests** - No exceptions
2. **Tests must prevent regression** - Fix once, never see again
3. **Benchmarks for performance fixes** - Prove the optimization works
4. **Manual testing for UI changes** - Browser verification required

### Enforcement

**Failure to include tests will result in PR rejection.**

### Testing Workflow Integration

```bash
# Development workflow with testing
git checkout -b fix/issue-123
# ... make changes ...
npm run test              # Run tests
npm run test:coverage     # Verify coverage
npm run build             # Verify build
git add .
git commit -m "fix: description"
```

### Continuous Integration

All PRs must pass:

- ✅ Unit/integration tests
- ✅ E2E tests (when applicable)
- ✅ Coverage thresholds (≥85%)
- ✅ TypeScript compilation
- ✅ Build verification
- ✅ Linting

---

## Additional Resources

- **Test Utilities**: `lib/queries/test-utils.tsx`
- **Vitest Config**: `vitest.config.ts`
- **Playwright Config**: `playwright.config.ts`
- **Coverage Reports**: `coverage/index.html` (generated after running tests)

---

**Last Updated**: 2026-02-15
**Version**: 1.0
