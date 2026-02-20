# Prisma + PostgreSQL Skill

---

name: prisma-postgres-skill
description: This skill should be used when working with Prisma ORM, PostgreSQL database operations, schema design, migrations, and query optimization.
auto_detect: prisma/schema.prisma
license: MIT

---

## Purpose

Provides Prisma ORM and PostgreSQL-specific knowledge for database schema design, migrations, query optimization, and data integrity. Ensures adherence to the project's ID-based taxonomy system and proper indexing strategies.

## When to Use

**Auto-activate when:**

- `prisma/schema.prisma` exists
- Working on files in `lib/queries/`
- Creating/modifying database migrations
- Optimizing database queries

**Specifically useful for:**

- Designing database schemas
- Creating migrations
- Writing optimized Prisma queries
- Adding composite indexes
- Database backup/restore operations
- Data normalization tasks

## Capabilities

### 1. Project Schema Overview

**Current Models (13 total):**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id           Int            @id @default(autoincrement())
  username     String         @unique
  password     String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  transactions Transaction[]
  categories   Category[]
  rules        Rule[]
  // ... other relations
}

model Transaction {
  id                     Int       @id @default(autoincrement())
  userId                 Int
  date                   DateTime
  description            String
  amount                 Decimal   @db.Decimal(10, 2)
  origin                 String
  bank                   String
  categoryId             Int?
  majorCategoryId        Int?
  classificationStatus   String    @default("pending")
  classificationReasoning String?
  reviewStatus           String    @default("pending")
  duplicateOf            Int?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  // Relations
  user           User         @relation(fields: [userId], references: [id])
  category       Category?    @relation("TransactionCategory", fields: [categoryId], references: [id])
  majorCategory  Category?    @relation("TransactionMajorCategory", fields: [majorCategoryId], references: [id])
  tags           Tag[]        @relation("TransactionTags")

  // Indexes for performance
  @@index([userId, date])
  @@index([userId, categoryId])
  @@index([userId, reviewStatus])
  @@index([origin, bank])
}

model Category {
  id               Int       @id
  userId           Int?
  name             String
  majorCategoryId  Int?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  user                     User?        @relation(fields: [userId], references: [id])
  majorCategory            Category?    @relation("CategoryHierarchy", fields: [majorCategoryId], references: [id])
  subcategories            Category[]   @relation("CategoryHierarchy")
  transactions             Transaction[] @relation("TransactionCategory")
  transactionsAsMajor      Transaction[] @relation("TransactionMajorCategory")

  // Indexes
  @@index([userId])
  @@index([majorCategoryId])
  @@unique([userId, id])
}

model Tag {
  id           Int            @id @default(autoincrement())
  name         String         @unique
  createdAt    DateTime       @default(now())
  transactions Transaction[]  @relation("TransactionTags")
}

model Rule {
  id          Int      @id @default(autoincrement())
  userId      Int
  field       String
  operator    String
  value       String
  categoryId  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])

  @@index([userId])
}
```

**Key Features:**

- **ID-based Category Taxonomy**: 273 predefined categories (IDs 1-273)
- **Composite Indexes**: Performance optimizations for common queries
- **Soft Delete Pattern**: Use `reviewStatus` flags instead of deleting
- **Decimal Precision**: `amount` field uses `Decimal(10, 2)` for financial accuracy

### 2. Query Patterns

**This project separates queries by feature in `lib/queries/`:**

**Basic CRUD:**

```typescript
// lib/queries/budgets.ts
import { prisma } from '@/lib/db'
import type { Budget } from '@prisma/client'

export async function getBudgets(userId: number): Promise<Budget[]> {
  return prisma.budget.findMany({
    where: { userId },
    include: {
      category: true, // Include related category
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createBudget(
  userId: number,
  data: { categoryId: number; amount: number; period: string }
): Promise<Budget> {
  return prisma.budget.create({
    data: {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      period: data.period,
    },
  })
}

export async function updateBudget(
  budgetId: number,
  userId: number,
  data: Partial<Budget>
): Promise<Budget> {
  // Verify ownership
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  })

  if (!budget) {
    throw new Error('Budget not found or unauthorized')
  }

  return prisma.budget.update({
    where: { id: budgetId },
    data,
  })
}

export async function deleteBudget(budgetId: number, userId: number): Promise<void> {
  // Verify ownership
  const budget = await prisma.budget.findFirst({
    where: { id: budgetId, userId },
  })

  if (!budget) {
    throw new Error('Budget not found or unauthorized')
  }

  await prisma.budget.delete({
    where: { id: budgetId },
  })
}
```

**Complex Queries with Aggregations:**

```typescript
// lib/queries/cash-flow.ts
export async function getCashFlowData(userId: number, startDate: Date, endDate: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
      majorCategory: true,
      tags: true,
    },
    orderBy: { date: 'asc' },
  })

  // Group by category for Sankey diagram
  const grouped = transactions.reduce(
    (acc, t) => {
      const key = t.categoryId || 'uncategorized'
      if (!acc[key]) {
        acc[key] = { category: t.category, transactions: [], total: 0 }
      }
      acc[key].transactions.push(t)
      acc[key].total += Number(t.amount)
      return acc
    },
    {} as Record<string, any>
  )

  return grouped
}
```

**Optimized Query with Pagination:**

```typescript
// lib/queries/transactions.ts
export async function getTransactionsPaginated(
  userId: number,
  options: {
    page: number
    pageSize: number
    filters?: {
      categoryId?: number
      origin?: string
      bank?: string
      startDate?: Date
      endDate?: Date
    }
  }
) {
  const { page, pageSize, filters } = options
  const skip = (page - 1) * pageSize

  const where = {
    userId,
    ...(filters?.categoryId && { categoryId: filters.categoryId }),
    ...(filters?.origin && { origin: filters.origin }),
    ...(filters?.bank && { bank: filters.bank }),
    ...(filters?.startDate &&
      filters?.endDate && {
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        category: true,
        majorCategory: true,
        tags: true,
      },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ])

  return {
    transactions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
```

### 3. Migration Workflow

**Step 1: Update Schema**

```bash
# Edit prisma/schema.prisma
# Example: Add Budget model

model Budget {
  id         Int      @id @default(autoincrement())
  userId     Int
  categoryId Int
  amount     Decimal  @db.Decimal(10, 2)
  period     String   // "MONTHLY" or "YEARLY"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])

  @@index([userId, categoryId])
}
```

**Step 2: Create Migration**

```bash
npx prisma migrate dev --name add_budget_table

# This generates:
# prisma/migrations/20260212123456_add_budget_table/migration.sql
```

**Step 3: Verify Migration**

```bash
npx prisma validate  # Check schema syntax
npx prisma generate  # Update Prisma Client types
```

**Step 4: Test in Development**

```bash
# Run migration on dev database
npm run db:migrate:dev

# Verify with Prisma Studio
npx prisma studio
```

**Step 5: Deploy to Production**

```bash
# Automatic on Vercel deployment
# Runs: npx prisma migrate deploy
```

### 4. Performance Optimization

**Add Composite Indexes:**

```prisma
model Transaction {
  // ... fields

  // Before (slow query):
  // SELECT * FROM transactions WHERE userId = 1 AND date BETWEEN '2024-01-01' AND '2024-12-31'
  // Query time: 850ms on 4,679 transactions

  // After (with index):
  @@index([userId, date])
  // Query time: 12ms on 4,679 transactions (70x faster)

  @@index([userId, categoryId])      // For category filtering
  @@index([userId, reviewStatus])    // For review queue
  @@index([origin, bank])            // For bank filtering
}
```

**Use `select` to reduce data transfer:**

```typescript
// ❌ BAD: Fetches all fields
const transactions = await prisma.transaction.findMany({
  where: { userId },
})

// ✅ GOOD: Fetches only needed fields
const transactions = await prisma.transaction.findMany({
  where: { userId },
  select: {
    id: true,
    date: true,
    amount: true,
    description: true,
    category: {
      select: {
        id: true,
        name: true,
      },
    },
  },
})
```

**Batch Operations:**

```typescript
// ❌ BAD: N queries (slow)
for (const transaction of transactions) {
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { reviewStatus: 'approved' },
  })
}

// ✅ GOOD: 1 query (fast)
await prisma.transaction.updateMany({
  where: {
    id: { in: transactions.map(t => t.id) },
  },
  data: { reviewStatus: 'approved' },
})
```

### 5. Data Normalization

**Project Scripts:**

```bash
# Normalize bank names (e.g., "wizink" → "WiZink", "WIZINK" → "WiZink")
node scripts/normalize-bank-names.js

# Normalize categories (ensure all use ID-based taxonomy)
node scripts/normalize-categories.js

# Remove duplicate transactions
node scripts/remove-duplicates.js
```

**Normalization Pattern:**

```typescript
// scripts/normalize-bank-names.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const bankMappings: Record<string, string> = {
  wizink: 'WiZink',
  WIZINK: 'WiZink',
  Wizink: 'WiZink',
  montepio: 'Montepio',
  MONTEPIO: 'Montepio',
  // ... more mappings
}

async function normalizeBankNames() {
  const transactions = await prisma.transaction.findMany({
    select: { id: true, bank: true },
  })

  for (const transaction of transactions) {
    const normalizedBank = bankMappings[transaction.bank] || transaction.bank

    if (normalizedBank !== transaction.bank) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { bank: normalizedBank },
      })
    }
  }
}
```

### 6. Database Backup & Restore

**Backup Script:**

```bash
# Incremental backup
node scripts/backup-database.js

# Creates: backups/backup-YYYY-MM-DD-HHmmss.sql
```

**Restore:**

```bash
# From backup file
node scripts/restore-database.js backups/backup-2026-02-12-143000.sql
```

## Implementation Notes

### Project-Specific Context

**ID-Based Taxonomy (273 Categories):**

- Categories 1-273 are predefined and system-wide
- User-specific categories start at ID 10000+
- Never modify IDs 1-273 (breaks historical data)

**Soft Delete Pattern:**

- Use `reviewStatus = 'rejected'` instead of deleting transactions
- Maintains referential integrity
- Allows data recovery

**Financial Precision:**

- Always use `Decimal` type for monetary amounts
- JavaScript `Number` has floating-point precision issues
- Convert to `string` for display: `amount.toFixed(2)`

**Performance Targets:**

- Date range queries: < 50ms (4,679 transactions)
- Category filtering: < 30ms
- Full transaction list: < 200ms

## Usage Examples

### Example 1: Add New Model

**Task:** "Add budget tracking table"

**Implementation:**

```prisma
// 1. Edit prisma/schema.prisma
model Budget {
  id         Int      @id @default(autoincrement())
  userId     Int
  categoryId Int
  amount     Decimal  @db.Decimal(10, 2)
  period     String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  category Category @relation(fields: [categoryId], references: [id])

  @@index([userId, categoryId])
}

// 2. Add relation to User model
model User {
  // ...
  budgets Budget[]
}

// 3. Add relation to Category model
model Category {
  // ...
  budgets Budget[]
}
```

```bash
# 4. Create migration
npx prisma migrate dev --name add_budget_table

# 5. Generate Prisma Client
npx prisma generate

# 6. Create queries file
# lib/queries/budgets.ts (see section 2 for examples)
```

### Example 2: Optimize Slow Query

**Problem:** "Transaction list taking 850ms to load"

**Solution:**

```prisma
// Add composite index
model Transaction {
  // ...

  @@index([userId, date])  // Composite index for date range queries
}
```

```bash
# Create migration
npx prisma migrate dev --name add_transaction_date_index
```

**Result:** Query time reduced from 850ms → 12ms (70x faster)

### Example 3: Data Migration Script

**Task:** "Migrate transactions from old `type` field to new `origin` field"

```typescript
// scripts/migration/migrate-transaction-types.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const typeMappings: Record<string, string> = {
  card: 'WiZink',
  bank: 'Montepio',
  cash: 'Cash',
}

async function migrateTransactionTypes() {
  const transactions = await prisma.transaction.findMany({
    where: { origin: null }, // Find unmigrated transactions
    select: { id: true, type: true },
  })

  console.log(`Found ${transactions.length} transactions to migrate`)

  for (const transaction of transactions) {
    const origin = typeMappings[transaction.type] || 'Unknown'

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { origin },
    })
  }

  console.log('Migration complete')
}

migrateTransactionTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## References

- **Prisma Docs:** https://www.prisma.io/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Neon (Database Provider):** https://neon.tech/docs

**Project-Specific:**

- Database Schema: `docs/DATABASE.md`
- Backup Strategy: `docs/BACKUP_RESTORE_STRATEGY.md`
- Migration Scripts: `scripts/migration/`

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
