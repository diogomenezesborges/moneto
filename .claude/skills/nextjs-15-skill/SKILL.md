# Next.js 15 Skill

---

name: nextjs-15-skill
description: This skill should be used when working with Next.js 15 App Router, Server Components, Server Actions, middleware, and deployment patterns.
auto_detect: next.config.ts
license: MIT

---

## Purpose

Provides Next.js 15-specific knowledge for building full-stack React applications using the App Router, Server Components, Server Actions, and Vercel deployment patterns. Ensures adherence to Next.js best practices and optimal performance.

## When to Use

**Auto-activate when:**

- `next.config.ts` exists in project root
- Working on files in `app/` directory
- Creating API routes (`app/api/`)
- Implementing Server Components or Server Actions

**Specifically useful for:**

- Creating new pages/routes
- Implementing Server Components vs Client Components
- Writing Server Actions
- Configuring middleware
- Optimizing bundle size and performance
- Deploying to Vercel

## Capabilities

### 1. App Router Patterns

**File-based Routing:**

```
app/
├── page.tsx                 # Route: /
├── layout.tsx               # Root layout
├── features/
│   └── budget/
│       ├── page.tsx         # Route: /features/budget
│       └── layout.tsx       # Nested layout
└── api/
    └── budgets/
        └── route.ts         # API: /api/budgets
```

**Route Segments:**

- `page.tsx` - Page component
- `layout.tsx` - Shared layout
- `loading.tsx` - Loading UI
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page

### 2. Server Components vs Client Components

**Server Components (default):**

```typescript
// app/features/budget/page.tsx
// Server Component - no "use client"
import { verifyToken } from '@/lib/auth'
import { getBudgets } from '@/lib/queries/budgets'
import { cookies } from 'next/headers'

export default async function BudgetPage() {
  const token = (await cookies()).get('token')?.value
  const user = await verifyToken(token)

  if (!user) {
    redirect('/login')
  }

  // Fetch data on server
  const budgets = await getBudgets(user.id)

  return <BudgetList budgets={budgets} />
}
```

**Client Components (for interactivity):**

```typescript
'use client'

// Use client components for:
// - useState, useEffect, event handlers
// - Browser APIs (localStorage, window)
// - React hooks

import { useState } from 'react'

export function BudgetForm() {
  const [amount, setAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side logic
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 3. Server Actions

**Pattern for mutations:**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createBudget as dbCreateBudget } from '@/lib/queries/budgets'

export async function createBudgetAction(formData: FormData) {
  const amount = formData.get('amount')
  const categoryId = formData.get('categoryId')

  // Validate
  if (!amount || !categoryId) {
    return { error: 'Missing required fields' }
  }

  // Database operation
  const budget = await dbCreateBudget({
    amount: Number(amount),
    categoryId: Number(categoryId),
  })

  // Revalidate cache
  revalidatePath('/features/budget')

  return { success: true, budget }
}
```

**Usage in Client Component:**

```typescript
'use client'

import { createBudgetAction } from './actions'

export function BudgetForm() {
  return (
    <form action={createBudgetAction}>
      <input name="amount" type="number" />
      <input name="categoryId" type="number" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### 4. API Routes (Route Handlers)

**Project Pattern:**

```typescript
// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBudgets, createBudget } from '@/lib/queries/budgets'

export async function GET(request: NextRequest) {
  // Authentication
  const user = await verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch data
  const budgets = await getBudgets(user.id)

  return NextResponse.json({ budgets })
}

export async function POST(request: NextRequest) {
  const user = await verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Validation
  // ... Zod validation here

  // Create budget
  const budget = await createBudget(user.id, body)

  return NextResponse.json({ budget }, { status: 201 })
}
```

**Dynamic Routes:**

```typescript
// app/api/budgets/[id]/route.ts
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const budgetId = parseInt(params.id)
  const body = await request.json()

  // Update budget
  const budget = await updateBudget(budgetId, user.id, body)

  return NextResponse.json({ budget })
}
```

### 5. Middleware

**Project Pattern (`middleware.ts`):**

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  // Public routes
  if (
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')
  ) {
    return NextResponse.next()
  }

  // Protected routes - verify token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = await verifyToken(token)
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

### 6. Data Fetching Best Practices

**This project uses TanStack Query on client, direct DB on server:**

**Server Component (direct DB access):**

```typescript
// app/features/budget/page.tsx
import { getBudgets } from '@/lib/queries/budgets'

export default async function BudgetPage() {
  const budgets = await getBudgets(userId) // Direct Prisma query
  return <BudgetList budgets={budgets} />
}
```

**Client Component (TanStack Query):**

```typescript
'use client'

import { useTransactions } from '@/lib/queries/transactions'

export function TransactionList() {
  const { data, isLoading, error } = useTransactions()

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return <div>{data.map(...)}</div>
}
```

### 7. Performance Optimization

**Bundle Size:**

```typescript
// ❌ BAD: Import entire library
import _ from 'lodash'

// ✅ GOOD: Import specific function
import debounce from 'lodash/debounce'
```

**Dynamic Imports:**

```typescript
// ❌ BAD: Large chart library loaded on page load
import { SankeyChart } from 'heavy-chart-library'

// ✅ GOOD: Lazy load when needed
'use client'

import dynamic from 'next/dynamic'

const SankeyChart = dynamic(() => import('heavy-chart-library').then(mod => mod.SankeyChart), {
  loading: () => <LoadingSpinner />,
  ssr: false // Disable SSR for client-only libraries
})
```

**Image Optimization:**

```typescript
import Image from 'next/image'

// Next.js automatically optimizes images
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority={true} // For above-the-fold images
/>
```

### 8. Deployment (Vercel)

**Environment Variables:**

- Set in Vercel Dashboard → Settings → Environment Variables
- Prefix with `NEXT_PUBLIC_` for client-side access
- Never commit `.env.local` to git

**Build Configuration (`next.config.ts`):**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false, // Enforce TypeScript
  },
  eslint: {
    ignoreDuringBuilds: false, // Enforce linting
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'moneto.vercel.app'],
    },
  },
}

export default nextConfig
```

**Vercel Deployment:**

```bash
# Automatic deployments:
# - Push to `main` → Production (moneto.vercel.app)
# - Push to `develop` → Preview (develop-moneto.vercel.app)
# - Push to `feature/*` → Preview (feature-xyz-moneto.vercel.app)

# Manual deployment:
vercel --prod        # Deploy to production
vercel               # Deploy to preview
```

## Implementation Notes

### Project-Specific Patterns

**This project uses:**

1. **Feature-based architecture** - `app/features/[feature-name]/`
2. **API routes for all data operations** - No Server Actions for CRUD (uses TanStack Query)
3. **JWT authentication** - Custom implementation in `lib/auth.ts`
4. **PostgreSQL via Prisma** - Database queries in `lib/queries/`
5. **Tailwind CSS** - Utility-first styling
6. **Dark mode** - Uses `next-themes` library

### Common Gotchas

**1. Async Components:**

```typescript
// ✅ VALID: Server Component can be async
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}

// ❌ INVALID: Client Component cannot be async
'use client'
export default async function Page() { // ERROR!
  const data = await fetchData()
  return <div>{data}</div>
}
```

**2. Cookies Access:**

```typescript
// ✅ VALID: Next.js 15 - cookies() is async
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')
}

// ❌ INVALID: Next.js 14 pattern (synchronous)
const token = cookies().get('token') // ERROR in Next.js 15
```

**3. Metadata:**

```typescript
// app/features/budget/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Budget Tracking - User Smart Expenses',
  description: 'Manage your monthly budgets',
}

export default function BudgetPage() {
  return <div>...</div>
}
```

### Testing

**API Routes:**

```typescript
// app/api/budgets/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET, POST } from './route'

vi.mock('@/lib/auth')
vi.mock('@/lib/queries/budgets')

describe('GET /api/budgets', () => {
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
```

## Usage Examples

### Example 1: Create New Feature Page

**Task:** "Add a budget tracking page"

**Steps:**

1. Create `app/features/budget/page.tsx` (Server Component)
2. Create `app/features/budget/components/BudgetForm.tsx` (Client Component)
3. Create `app/api/budgets/route.ts` (API routes)
4. Create `lib/queries/budgets.ts` (Database queries)

### Example 2: Add API Endpoint

**Task:** "Add endpoint to get user's budgets"

**Implementation:**

```typescript
// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getBudgets } from '@/lib/queries/budgets'

export async function GET(request: NextRequest) {
  const user = await verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const budgets = await getBudgets(user.id)
  return NextResponse.json({ budgets })
}
```

### Example 3: Optimize Performance

**Task:** "Reduce bundle size of cash flow page"

**Solution:**

```typescript
// Before: 400KB bundle (includes D3.js at page load)
import { SankeyChart } from 'd3-sankey'

// After: 120KB initial bundle, 280KB lazy loaded on interaction
'use client'

import dynamic from 'next/dynamic'

const SankeyChart = dynamic(
  () => import('@/components/SankeyChart'),
  { loading: () => <Skeleton />, ssr: false }
)

export function CashFlowPage() {
  const [showChart, setShowChart] = useState(false)

  return (
    <div>
      <button onClick={() => setShowChart(true)}>View Chart</button>
      {showChart && <SankeyChart data={data} />}
    </div>
  )
}
```

---

## References

- **Official Next.js 15 Docs:** https://nextjs.org/docs
- **App Router Migration:** https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration
- **Server Actions:** https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **Deployment:** https://nextjs.org/docs/app/building-your-application/deploying

**Project-Specific:**

- Architecture: `docs/ARCHITECTURE.md`
- API Reference: `docs/API_REFERENCE.md`
- Development Guide: `docs/DEVELOPMENT_GUIDE.md`

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
