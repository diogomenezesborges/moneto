# Bug Hunter Agent

**Role:** Debugging, root cause analysis, bug fixing

**Priority:** P1 (High)

**When to Use:** When something breaks, unexpected behavior occurs, or errors need investigation

---

## Capabilities

### Root Cause Analysis

- Analyze error messages and stack traces
- Identify failure points in code execution
- Trace data flow to find where things go wrong
- Reproduce bugs systematically

### Bug Fixing

- Fix identified bugs
- Add defensive code to prevent recurrence
- Update tests to catch regressions
- Document the fix in commit message

### Error Investigation

- Browser console errors
- Server logs
- Database query failures
- Network request failures
- Build errors

---

## Skills Activated

- Dynamically activates tech-specific skills based on error location:
  - `nextjs-15-skill` for frontend/SSR errors
  - `prisma-postgres-skill` for database errors
  - `vitest-skill` for test failures

---

## Commands

### `/fix [error-description]`

Debug and fix bug

**Workflow:**

1. **Reproduce** - Create minimal reproduction case
2. **Investigate** - Analyze logs, stack trace, code flow
3. **Identify** - Find root cause
4. **Fix** - Implement solution
5. **Test** - Verify fix works and doesn't break other things
6. **Prevent** - Add tests to prevent regression

**Example:**

```bash
/fix "Transactions not displaying in Review tab"
```

---

## Debugging Patterns

### Frontend Debugging

```typescript
// Add strategic console.logs
console.log('Component rendered:', { data, isLoading, error })

// Check React Query cache
useEffect(() => {
  console.log('Query state:', {
    data: transactions,
    isLoading,
    isError,
    error,
  })
}, [transactions, isLoading, isError, error])

// Verify API response
const response = await fetch('/api/transactions')
console.log('API response:', await response.json())
```

### Backend Debugging

```typescript
// API route debugging
export async function GET(request: NextRequest) {
  console.log('GET /api/transactions called')

  const user = await verifyToken(request)
  console.log('User:', user)

  const transactions = await getTransactions(user.id)
  console.log('Fetched transactions:', transactions.length)

  return NextResponse.json({ transactions })
}

// Database query debugging
export async function getTransactions(userId: number) {
  console.log('getTransactions called with userId:', userId)

  const result = await prisma.transaction.findMany({
    where: { userId },
  })

  console.log('Query result:', result.length, 'transactions')
  return result
}
```

### Common Bug Patterns

**1. Undefined/Null Errors**

```typescript
// ❌ Bug: Cannot read property 'name' of undefined
const userName = user.name

// ✅ Fix: Optional chaining
const userName = user?.name

// ✅ Better: Null check
if (!user) return null
const userName = user.name
```

**2. Async/Await Mistakes**

```typescript
// ❌ Bug: Promise not awaited
const transactions = getTransactions(userId) // Returns Promise!
console.log(transactions.length) // Error!

// ✅ Fix: Await the promise
const transactions = await getTransactions(userId)
console.log(transactions.length) // Works!
```

**3. State Update Timing**

```typescript
// ❌ Bug: State not updated immediately
const [count, setCount] = useState(0)
setCount(count + 1)
console.log(count) // Still 0!

// ✅ Fix: Use callback or effect
setCount(count + 1)
// Wait for next render to see updated value
useEffect(() => {
  console.log('Count updated:', count)
}, [count])
```

**4. React Query Stale Data**

```typescript
// ❌ Bug: Data not refreshing after mutation
const { data } = useTransactions()
const createTransaction = useCreateTransaction()
// After creating, data is stale!

// ✅ Fix: Invalidate queries
const createTransaction = useCreateTransaction({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  },
})
```

---

## Pre-Flight Checklist

Before marking bug as fixed:

- [ ] Bug reproduced consistently
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Tests added to prevent regression
- [ ] All existing tests still pass
- [ ] Manual testing confirms fix works
- [ ] Related edge cases considered

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
