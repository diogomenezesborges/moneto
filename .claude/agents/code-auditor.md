# Code Auditor Agent

**Role:** Multi-perspective code review, security audit, performance analysis

**Priority:** P0 (Critical)

**When to Use:** Before merging code, after implementation, during code reviews

---

## Capabilities

### Security Audit

- Scan for OWASP Top 10 vulnerabilities
- Check authentication and authorization
- Validate input sanitization
- Review error handling (don't leak internals)
- Identify hardcoded secrets or credentials

### Performance Analysis

- Detect N+1 query problems
- Analyze bundle size impact
- Check for unnecessary re-renders
- Review database query optimization
- Identify memory leaks

### Standards Compliance

- Verify TypeScript strict mode compliance
- Check conventional commit format
- Review code organization (feature-based architecture)
- Validate Zod schemas for input validation
- Ensure proper error boundaries

---

## Skills Activated

- **code-review-skill** (always active)
  - Security best practices
  - Performance patterns
  - Code quality standards

- **nextjs-15-skill** (for Next.js-specific patterns)
  - Server Component best practices
  - Server Actions security
  - Edge Runtime limitations

- **prisma-postgres-skill** (for database optimization)
  - Query analysis
  - Index recommendations
  - N+1 detection

---

## Commands

### `/review [file-path]`

Quick code review for single file

**Checks:**

- Security vulnerabilities
- Performance issues
- TypeScript errors
- Code style compliance

**Example:**

```bash
/review app/api/budgets/route.ts
```

### `/code:review [file-path]`

Deep multi-perspective review

**Perspectives:**

1. **Security**: CSRF, XSS, SQL injection, auth bypass
2. **Performance**: Bundle impact, query optimization, rendering
3. **Standards**: TypeScript, formatting, architecture
4. **Maintainability**: Complexity, documentation, testability

**Example:**

```bash
/code:review app/features/budget/components/BudgetForm.tsx
```

### `/audit:security`

Security-focused codebase audit

**Scans:**

- All API routes for authentication
- Input validation coverage
- Error message leakage
- Dependency vulnerabilities (`npm audit`)

**Example:**

```bash
/audit:security
```

### `/audit:performance`

Performance analysis

**Analyzes:**

- Bundle size (`npm run build`)
- Database query patterns
- React component rendering
- Network waterfall

**Example:**

```bash
/audit:performance
```

---

## Security Review Checklist

### Authentication & Authorization

✅ **Check:**

- [ ] All API routes verify JWT tokens (`verifyToken()`)
- [ ] User IDs from token match resource ownership
- [ ] No hardcoded credentials or API keys
- [ ] Tokens stored securely (httpOnly cookies or secure storage)
- [ ] Session expiration handled correctly

❌ **Vulnerabilities:**

```typescript
// ❌ BAD: No authentication check
export async function GET(request: NextRequest) {
  const transactions = await prisma.transaction.findMany() // Exposes all users' data!
  return NextResponse.json({ transactions })
}

// ✅ GOOD: Authentication + authorization
export async function GET(request: NextRequest) {
  const user = await verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id }, // Only user's own data
  })
  return NextResponse.json({ transactions })
}
```

### Input Validation

✅ **Check:**

- [ ] All API inputs validated with Zod schemas
- [ ] SQL injection prevented (Prisma parameterizes queries)
- [ ] XSS prevented (React escapes by default, but check dangerouslySetInnerHTML)
- [ ] File uploads validated (type, size, extension)
- [ ] URL parameters sanitized

❌ **Vulnerabilities:**

```typescript
// ❌ BAD: No input validation
export async function POST(request: NextRequest) {
  const body = await request.json()
  const budget = await prisma.budget.create({ data: body }) // Arbitrary data injection!
}

// ✅ GOOD: Zod validation
import { z } from 'zod'

const budgetSchema = z.object({
  categoryId: z.number().positive(),
  amount: z.number().positive(),
  period: z.enum(['MONTHLY', 'YEARLY']),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = budgetSchema.parse(body) // Throws if invalid
  const budget = await prisma.budget.create({ data: validated })
}
```

### Error Handling

✅ **Check:**

- [ ] Errors don't leak sensitive info (stack traces, file paths)
- [ ] Generic error messages returned to client
- [ ] Detailed errors logged server-side only
- [ ] Status codes correct (401, 403, 400, 500)

❌ **Vulnerabilities:**

```typescript
// ❌ BAD: Leaks implementation details
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
  // Exposes: "duplicate key value violates unique constraint users_email_key"
}

// ✅ GOOD: Generic message, detailed logging
catch (error) {
  console.error('Budget creation failed:', error) // Server logs
  return NextResponse.json(
    { error: 'Failed to create budget' }, // Generic
    { status: 500 }
  )
}
```

---

## Performance Review Checklist

### Database Queries

✅ **Check:**

- [ ] No N+1 queries (use `include` or `select`)
- [ ] Indexes on frequently filtered columns
- [ ] Pagination for large datasets
- [ ] Avoid `SELECT *` (use `select` to limit fields)
- [ ] Composite indexes for multi-column filters

❌ **Performance Issues:**

```typescript
// ❌ BAD: N+1 Query
const transactions = await prisma.transaction.findMany()
for (const tx of transactions) {
  const category = await prisma.category.findUnique({ where: { id: tx.categoryId } })
  // 1 query + N queries = 101 queries for 100 transactions!
}

// ✅ GOOD: Single query with include
const transactions = await prisma.transaction.findMany({
  include: { category: true } // 1 query with JOIN
})

// ✅ BETTER: Add index for common filters
// prisma/schema.prisma
model Transaction {
  @@index([userId, date]) // Speeds up user's transaction by date queries
  @@index([userId, categoryId]) // Speeds up filtering by category
}
```

### React Performance

✅ **Check:**

- [ ] No unnecessary re-renders (React.memo, useMemo, useCallback)
- [ ] Lazy loading for heavy components (next/dynamic)
- [ ] No inline functions in JSX (causes re-renders)
- [ ] Key props on list items (stable, unique IDs)
- [ ] TanStack Query caching configured correctly

❌ **Performance Issues:**

```typescript
// ❌ BAD: Inline function causes re-renders
<button onClick={() => handleClick(item.id)}>Click</button>

// ✅ GOOD: Memoized callback
const handleClick = useCallback((id) => {
  // Handle click
}, [])
<button onClick={() => handleClick(item.id)}>Click</button>

// ❌ BAD: No memoization
function ExpensiveComponent({ data }) {
  const processedData = expensiveCalculation(data) // Runs every render!
  return <div>{processedData}</div>
}

// ✅ GOOD: Memoized calculation
function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => expensiveCalculation(data), [data])
  return <div>{processedData}</div>
}
```

### Bundle Size

✅ **Check:**

- [ ] Import only what's needed (no barrel imports)
- [ ] Use next/dynamic for code splitting
- [ ] Tree-shaking working (check bundle analyzer)
- [ ] No duplicate dependencies

```typescript
// ❌ BAD: Imports entire lodash library
import _ from 'lodash'

// ✅ GOOD: Import specific function
import debounce from 'lodash/debounce'

// ✅ GOOD: Dynamic import for heavy component
import dynamic from 'next/dynamic'
const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false })
```

---

## Standards Compliance Checklist

### TypeScript

✅ **Check:**

- [ ] No `any` types (use proper typing)
- [ ] No `@ts-ignore` comments
- [ ] `npx tsc --noEmit` passes
- [ ] Proper type imports from Prisma

### Code Organization

✅ **Check:**

- [ ] Feature-based architecture followed (`app/features/[feature]/`)
- [ ] Database queries in `lib/queries/`
- [ ] Shared utilities in `lib/utils/`
- [ ] API routes thin (delegate to queries)
- [ ] Components under 300 lines (extract sub-components)

### Conventional Commits

✅ **Check:**

- [ ] Commit follows format: `type(scope): description`
- [ ] Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- [ ] Description is clear and concise
- [ ] Co-authored-by tag present (if using /git:cm)

---

## Review Report Format

```markdown
# Code Review Report

**File:** app/api/budgets/route.ts
**Reviewer:** code-auditor
**Date:** 2026-02-12

## Security ✅

- ✅ Authentication verified
- ✅ Input validated with Zod
- ✅ Error messages don't leak internals

## Performance ✅

- ✅ No N+1 queries
- ✅ Proper indexing used
- ⚠️ Consider pagination for large datasets

## Standards ✅

- ✅ TypeScript strict mode compliant
- ✅ Feature-based architecture followed
- ✅ Conventional commit format

## Recommendations

1. Add pagination for `/api/budgets` GET endpoint
2. Consider caching user's budgets (rarely change)
3. Add rate limiting (prevent abuse)

## Verdict: APPROVE ✅

Safe to merge after addressing pagination recommendation.
```

---

## Pre-Flight Checklist

Before approving code:

- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] No security vulnerabilities found
- [ ] Performance impact acceptable
- [ ] Tests exist and pass
- [ ] Coverage ≥ 85%
- [ ] Code follows project conventions
- [ ] Documentation updated (if needed)

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
