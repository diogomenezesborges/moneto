# Development Guide

> **Part of**: [Moneto Documentation](../CLAUDE.md)
> **Last Updated**: 2026-01-26

## Table of Contents

1. [Overview](#overview)
2. [Local Setup](#local-setup)
3. [Environment Variables](#environment-variables)
4. [Available Scripts](#available-scripts)
5. [Common Tasks](#common-tasks)
6. [Best Practices](#best-practices)
7. [Code Conventions](#code-conventions)
8. [Performance](#performance)
9. [Accessibility](#accessibility)
10. [Security Best Practices](#security-best-practices)
11. [Error Handling](#error-handling)
12. [Git Commit Messages](#git-commit-messages)
13. [Documentation](#documentation)
14. [Related Documentation](#related-documentation)

---

## Overview

This guide covers common development tasks, best practices, and workflows for the Moneto project.

---

## Local Setup

```bash
# Clone repository
git clone https://github.com/your-username/moneto.git
cd moneto

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema to Neon
npx prisma db push

# Seed taxonomy (optional, first time only)
node prisma/seed-taxonomy-v4.js

# Start development server
npm run dev
# → http://localhost:3000
```

---

## Environment Variables

Create `.env` file:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgres://user:pass@host.neon.tech/database?sslmode=require
DIRECT_URL=postgresql://user:pass@host.neon.tech/database?sslmode=require

# Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# AI Classification (Google Gemini)
GEMINI_API_KEY=your-google-ai-api-key

# Rate Limiting (Upstash Redis) - Optional for development, REQUIRED for production
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

---

## Available Scripts

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run unit tests with Vitest
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run E2E tests with Playwright
npm run test:e2e:ui  # Run E2E tests with UI
npm run test:e2e:debug # Debug E2E tests

# Database operations
npx prisma db push       # Push schema changes to database
npx prisma studio        # Open database GUI (localhost:5555)
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create migration

# Utility scripts
node scripts/backup-database.js           # Backup database
node scripts/check-subcategories.js       # Verify categories
node prisma/seed-taxonomy-v4.js          # Seed category taxonomy
node prisma/seed-tag-definitions.js      # Seed tag definitions
```

---

## Common Tasks

### Adding a New Bank Parser

1. **Create parser file**: `lib/parsers/bank-name.ts`

```typescript
import { ParsedTransaction } from '@/lib/parsers'

export async function parseBankName(file: File): Promise<ParsedTransaction[]> {
  // Read file
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  // Parse rows
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  // Transform to ParsedTransaction format
  const transactions: ParsedTransaction[] = rows.slice(1).map((row: any) => ({
    date: new Date(row[0]),
    description: row[1],
    amount: parseFloat(row[2]),
    balance: parseFloat(row[3]) || undefined,
    origin: 'User 1', // or detect from file
    bank: 'BankName',
  }))

  return transactions
}
```

2. **Register in main parser**: `lib/parsers.ts`

```typescript
import { parseBankName } from './parsers/bank-name'

// In parseFile function
if (file.name.includes('bankname') || detectedBank === 'bankname') {
  return parseBankName(file)
}
```

3. **Add bank to normalizer**: `lib/bank-normalizer.ts`

```typescript
export const BANK_MAPPINGS = {
  // ...
  bankname: {
    normalized: 'BankName',
    logo: '/logos/bankname.png',
  },
}
```

4. **Add bank logo**: Place logo in `public/logos/bankname.png`

5. **Test**: Upload sample file and verify parsing

---

### Adding a New Category

**Option 1: Via UI** (Once Issue #1 is completed)

- Go to Settings tab
- Click "Add Category"
- Fill in: Major Category, Category name, Icon, Sort order
- Save

**Option 2: Directly in Database**

```typescript
// In prisma studio or migration script
await prisma.majorCategory.create({
  data: {
    id: 'mc_pets',
    slug: 'animais',
    name: 'Animais de Estimação',
    nameEn: 'Pets',
    emoji: '🐕',
    budgetCategory: '30_wants',
    sortOrder: 7,
    userId: null, // System default
  },
})

await prisma.category.create({
  data: {
    id: 'cat_vet',
    majorCategoryId: 'mc_pets',
    slug: 'veterinario',
    name: 'Veterinário',
    nameEn: 'Veterinary',
    icon: 'stethoscope',
    sortOrder: 1,
    userId: null,
  },
})
```

**Option 3: Add to Seed Script** `prisma/seed-taxonomy-v4.js`

---

### Creating Auto-Categorization Rules

**Via API**:

```typescript
// POST /api/rules
{
  keyword: "continente",
  majorCategory: "Custos Variáveis",
  category: "Alimentação",
  tags: ["type:supermercado"],
  isDefault: false,
  userId: "user-id"
}
```

**Via UI**:

1. Go to Rules tab
2. Click "Add Rule"
3. Enter keyword (e.g., "continente")
4. Select category
5. Add tags (optional)
6. Save

**Applying Rules to Existing Transactions**:

```typescript
// POST /api/transactions/auto-categorize
{
} // Empty body - applies all rules to pending transactions
```

---

### Running AI Classification

**Single Transaction**:

```typescript
// POST /api/transactions/ai-classify
{
  transactionId: "transaction-id"
}

// Response:
{
  majorCategoryId: "mc_variable_costs",
  categoryId: "cat_alimentacao",
  tags: ["type:supermercado"],
  confidence: 0.95,
  reasoning: "Transaction at Continente with amount typical for grocery shopping"
}
```

**Batch Classification** (via UI):

1. Go to Review tab
2. Click "AI Classify Batch" button
3. Processes up to 50 uncategorized transactions
4. Shows success summary

---

### Exporting Transactions

**Via UI**:

1. Go to Transactions tab
2. Apply desired filters
3. Click "Export CSV" button
4. Downloads filtered transactions as CSV

**Via Code**:

```typescript
import { exportToCSV } from '@/lib/parsers'

const csvData = exportToCSV(transactions)
// Download or save csvData
```

---

### Adding a New Tag Namespace

1. **Add to schema**: Already flexible - no schema change needed

2. **Seed tag definitions**:

```typescript
// In prisma/seed-tag-definitions.js or via API
await prisma.tagDefinition.createMany({
  data: [
    {
      namespace: 'your_namespace',
      value: 'value1',
      label: 'Valor 1',
      labelEn: 'Value 1',
      color: '#3B82F6',
      sortOrder: 1,
    },
    {
      namespace: 'your_namespace',
      value: 'value2',
      label: 'Valor 2',
      labelEn: 'Value 2',
      color: '#10B981',
      sortOrder: 2,
    },
  ],
})
```

3. **Update AI classifier**: Edit `lib/ai-classifier.ts` to include new namespace in prompt

4. **UI Update**: TagSelector component automatically picks up new namespaces

---

### Debugging Common Issues

#### "prisma: command not found"

```bash
npm install
npx prisma generate
```

#### "Can't reach database server"

- Check `.env` has correct `DATABASE_URL`
- Verify Neon project is active at console.neon.tech
- Test connection: `npx prisma db pull`

#### "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

#### Build fails on Vercel

- Check all environment variables set in Vercel dashboard
- Ensure JWT_SECRET is set (Issue #22)
- Check build logs for specific error

#### Transactions not importing

- Check file format matches expected structure
- Review parser logs
- Try AI parsing for unstructured files
- Check for duplicate transactions (by date + description + amount)

---

## Best Practices

### When Adding New Features

1. **Security First**
   - Add input validation (Zod schema)
   - Check authentication (`getUserFromRequest`)
   - Verify user owns data (userId check)
   - Rate limit sensitive endpoints

2. **Database Changes**
   - Update `prisma/schema.prisma`
   - Create migration: `npx prisma migrate dev`
   - Update seed scripts if needed
   - Test with `npx prisma studio`

3. **API Design**
   - RESTful conventions (GET, POST, PATCH, DELETE)
   - Consistent error responses
   - Return meaningful status codes (200, 400, 401, 404, 500)
   - Document in API_REFERENCE.md

4. **Component Design**
   - Keep components small and focused
   - Use TypeScript interfaces for props
   - Handle loading and error states
   - Accessibility (keyboard navigation, ARIA labels)
   - Dark mode support

5. **Testing**
   - Unit tests for utilities (parsers, formatters)
   - Integration tests for API routes
   - E2E tests for critical flows (import, categorization)

---

## Code Conventions

### TypeScript

```typescript
// Use interfaces for props
interface ComponentProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

// Use type for unions
type Status = 'pending' | 'categorized' | 'approved'

// Explicit return types for functions
function calculateTotal(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}
```

### Naming

- **Components**: PascalCase (`CategorySelector.tsx`)
- **Utilities**: camelCase (`category-mapper.ts`)
- **API Routes**: kebab-case folders (`ai-classify/route.ts`)
- **Database Models**: PascalCase (`MajorCategory`)
- **Variables**: camelCase (`majorCategoryId`)
- **Constants**: UPPER_SNAKE_CASE (`BANK_MAPPINGS`)

### File Organization

```typescript
// Component file structure
import { useState, useEffect } from 'react'
import type { SomeType } from '@/types'

// Types
interface ComponentProps {
  // ...
}

// Main component
export default function Component({ ...props }: ComponentProps) {
  // Hooks
  const [state, setState] = useState()

  // Effects
  useEffect(() => {
    // ...
  }, [])

  // Handlers
  const handleClick = () => {
    // ...
  }

  // Render
  return (
    // ...
  )
}
```

---

## Performance

1. **Use React.memo** for expensive components
2. **Debounce search inputs** (300ms delay)
3. **Lazy load routes** with `next/dynamic`
4. **Optimize images** with `next/image`
5. **Cache API responses** (5-minute TTL for taxonomy)
6. **Virtual scrolling** for long lists (Issue #6)

---

## Accessibility

1. **Semantic HTML**: Use correct elements (`<button>`, `<nav>`, etc.)
2. **ARIA labels**: For icons and custom components
3. **Keyboard navigation**: Tab, Enter, Escape, Arrow keys
4. **Focus management**: Visible focus states, focus trapping in modals
5. **Color contrast**: WCAG AA compliance (4.5:1 for text)

---

## Security Best Practices

1. **Never trust user input**: Validate everything with Zod
2. **Use parameterized queries**: Prisma prevents SQL injection
3. **Rate limiting**: All public endpoints
4. **HTTPS only**: Enforced by Vercel
5. **Security headers**: CSP, HSTS, X-Frame-Options
6. **CSRF protection**: For state-changing operations
7. **Secrets management**: Environment variables, never commit
8. **JWT expiry**: 30 days max, refresh tokens for longer sessions

See [SECURITY.md](SECURITY.md) for detailed security documentation.

---

## Error Handling

```typescript
// API Route
try {
  const result = await someOperation()
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json({ error: 'Operation failed', details: error.message }, { status: 500 })
}

// Frontend
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    throw new Error('Request failed')
  }
  const data = await response.json()
  // Handle success
} catch (error) {
  console.error('Error:', error)
  setError('Something went wrong. Please try again.')
}
```

---

## Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-currency support
fix: resolve date input editing issue
docs: update API documentation
refactor: split monolithic page.tsx
test: add transaction parser tests
chore: update dependencies
```

---

## Documentation

1. **Code comments**: Why, not what (code explains what)
2. **JSDoc for utilities**: Document complex functions
3. **README updates**: Keep setup instructions current
4. **API documentation**: Update API_REFERENCE.md when adding routes
5. **Issue tracking**: Create GitHub issues for bugs/features

---

## Related Documentation

- [Main Guide](../CLAUDE.md) - Project overview and quick start
- [Architecture](ARCHITECTURE.md) - System architecture and tech stack
- [Database](DATABASE.md) - Complete database schema
- [API Reference](API_REFERENCE.md) - All API endpoints
- [Components](COMPONENTS.md) - Component architecture
- [Security](SECURITY.md) - Security documentation
- [Known Issues](KNOWN_ISSUES.md) - Tracked issues and bugs
