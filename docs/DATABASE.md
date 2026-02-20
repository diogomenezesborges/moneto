# Database Schema

> **Part of**: [Moneto Documentation](../CLAUDE.md)
> **Last Updated**: 2026-01-26

## Table of Contents

1. [Overview](#overview)
2. [Core Models](#core-models)
3. [Taxonomy Models (Modern ID-Based System)](#taxonomy-models-modern-id-based-system)
4. [Tag System](#tag-system)
5. [Feedback & Tracking Models](#feedback--tracking-models)
6. [Database Operations](#database-operations)
7. [Migration History](#migration-history)
8. [Related Documentation](#related-documentation)

---

## Overview

The database uses **PostgreSQL** (hosted on Neon) with **Prisma ORM 6.19.2** for type-safe database access.

**Schema Location**: `prisma/schema.prisma`

**Total Models**: 13

## Core Models

### User

Represents system users (family members).

```prisma
model User {
  id               String             @id @default(cuid())
  name             String             // "TestUser"
  pinHash          String             // bcrypt hash
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  transactions     Transaction[]
  rules            Rule[]
  budgets          Budget[]
  majorCategories  MajorCategory[]
  categories       Category[]
  banks            Bank[]
}
```

**Key Fields**:

- `pinHash`: bcrypt hash with 12 rounds
- Relations: Owns transactions, rules, budgets, custom categories, banks

### Transaction

Core model representing financial movements (income, expenses, transfers).

```prisma
model Transaction {
  id                    String                        @id @default(cuid())
  rawDate               DateTime
  rawDescription        String
  rawAmount             Float                         // + income, - expense
  rawBalance            Float?
  origin                String                        // User 1, User 2, Couple
  bank                  String

  // OLD: Text-based categories (backward compatibility)
  majorCategory         String?
  category              String?
  subCategory           String?                       // DEPRECATED

  // NEW: ID-based categories (2-level)
  majorCategoryId       String?
  majorCategoryRef      MajorCategory?                @relation(fields: [majorCategoryId])
  categoryId            String?
  categoryRef           Category?                     @relation(fields: [categoryId])

  // AI Classifier metadata
  classifierConfidence  Float?                        // 0.0 - 1.0
  classifierReasoning   String?
  classifierVersion     String?

  notes                 String?
  tags                  String[]                      @default([]) // "namespace:value"
  status                String                        @default("pending")
  reviewStatus          String?                       // null, "pending_review", "rejected"
  flagged               Boolean                       @default(false)
  importBatchId         String?
  potentialDuplicateId  String?
  createdAt             DateTime                      @default(now())
  updatedAt             DateTime                      @updatedAt
  userId                String
  user                  User                          @relation(fields: [userId])
}
```

**Key Fields**:

- **Dual Taxonomy**: Both text-based (legacy) and ID-based (modern) categories
- **Tags Array**: Flexible metadata (e.g., `["trip:croatia", "vehicle:carro"]`)
- **AI Metadata**: Confidence, reasoning, version for AI classifications
- **Review Workflow**: `reviewStatus` for manual approval
- **Duplicate Detection**: `potentialDuplicateId` links potential duplicates
- **Origin**: Tracks account ownership (User 1, User 2, Couple)

**Migration Status**: 4,679 transactions migrated to ID-based system (99.96% success rate)

### Rule

Auto-categorization rules using keyword matching.

```prisma
model Rule {
  id            String   @id @default(cuid())
  keyword       String   // "continente", "uber eats"
  majorCategory String   // "Custos Variáveis"
  category      String   // "Alimentação"
  subCategory   String?  // DEPRECATED
  tags          String[] @default([]) // ["type:supermercado"]
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String
  user          User     @relation(fields: [userId])
}
```

**Key Features**:

- Case-insensitive keyword matching
- Supports tags for metadata
- System defaults (`isDefault: true`) + user custom rules
- 60+ default rules in `lib/categories.ts`

### Budget

Monthly budget tracking per category.

```prisma
model Budget {
  id            String   @id @default(cuid())
  majorCategory String
  category      String?
  month         Int      // 1-12
  year          Int      // 2024
  budgetAmount  Float
  actualAmount  Float    @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String
  user          User     @relation(fields: [userId])

  @@unique([userId, majorCategory, category, month, year])
}
```

**Key Features**:

- Monthly granularity
- Per major category or specific category
- Tracks budgeted vs actual spending
- Unique constraint prevents duplicates

## Taxonomy Models (Modern ID-Based System)

### MajorCategory

Top-level categories (Income, Fixed Costs, etc.)

```prisma
model MajorCategory {
  id            String         @id // 'mc_income', 'mc_fixed_costs', etc.
  slug          String         // 'rendimento', 'custos_fixos'
  name          String         // 'Rendimento', 'Custos Fixos'
  nameEn        String?        // 'Income', 'Fixed Costs'
  emoji         String?
  budgetCategory String?       // '50_needs', '30_wants', '20_savings'
  sortOrder     Int            @default(0)
  userId        String?        // null = system default
  user          User?          @relation(fields: [userId])

  categories    Category[]
  transactions  Transaction[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@unique([userId, slug])
}
```

**System Major Categories**:

- `mc_income` - 💰 Rendimento (Income)
- `mc_extra_income` - 🎁 Rendimento Extra (Extra Income)
- `mc_fixed_costs` - 🏠 Custos Fixos (Fixed Costs)
- `mc_variable_costs` - 🛒 Custos Variáveis (Variable Costs)
- `mc_guilt_free` - 🎉 Gastos sem Culpa (Guilt-Free Spending)
- `mc_savings` - 🐷 Poupança (Savings)
- `mc_investment` - 📈 Investimento (Investment)
- `mc_taxes` - 🏛️ Impostos (Taxes)
- `mc_transfers` - ↔️ Transferências (Transfers)

**Budget Categories** (50/30/20 Rule):

- `50_needs`: Essential expenses
- `30_wants`: Discretionary spending
- `20_savings`: Savings and investments

### Category

Second-level categories within major categories.

```prisma
model Category {
  id              String         @id // 'cat_salario', 'cat_alimentacao', etc.
  majorCategoryId String
  majorCategory   MajorCategory  @relation(fields: [majorCategoryId])

  slug            String         // 'salario', 'alimentacao'
  name            String         // 'Salario', 'Alimentação'
  nameEn          String?        // 'Salary', 'Food'
  icon            String?        // Lucide icon name
  sortOrder       Int            @default(0)
  userId          String?        // null = system default
  user            User?          @relation(fields: [userId])

  transactions    Transaction[]

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([userId, majorCategoryId, slug])
}
```

**Example Categories**:

- `cat_salario` - 💼 Salário (Salary) - icon: `wallet`
- `cat_alimentacao` - 🛒 Alimentação (Food) - icon: `shopping-cart`
- `cat_habitacao` - 🏠 Habitação (Housing) - icon: `home`
- `cat_transportes` - 🚗 Transportes (Transport) - icon: `car`
- `cat_saude` - ❤️ Saúde (Health) - icon: `heart`
- `cat_educacao` - 🎓 Educação (Education) - icon: `graduation-cap`
- `cat_lazer` - 🎉 Lazer (Leisure) - icon: `popcorn`

**Total Categories**: 273 (system defaults + user custom)

**Icon System**: Uses Lucide React icons (70+ mapped in `lib/icons.ts`)

## Tag System

### TagDefinition

Defines available tags organized by namespace.

```prisma
model TagDefinition {
  id        String   @id @default(cuid())
  namespace String   // 'vehicle', 'trip', 'provider', etc.
  value     String   // 'carro', 'croatia', 'sgf'
  label     String   // 'Carro', 'Croácia', 'SGF'
  labelEn   String?  // 'Car', 'Croatia', 'SGF'
  color     String?  // Hex color
  sortOrder Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([namespace, value])
}
```

**Tag Namespaces**:

- `vehicle`: carro, mota, autocaravana
- `trip`: croatia, tuscany, mallorca
- `provider`: sgf, ar, montepio
- `platform`: olx, vinted
- `occasion`: natal, aniversario, casamento
- `recipient`: user3, tomas
- `sport`: yoga, ginasio, padel, golfe, futebol, corrida
- `type`: irs, fine, bank-fee, cash-withdrawal, supermercado, decoracao, beleza
- `utility`: agua, eletricidade, gas
- `service`: spotify, amazon, google, netflix
- `project`: brides, medium, y
- `reimbursable`: yes

**Tag Format**: `namespace:value` (e.g., `"trip:croatia"`, `"vehicle:carro"`)

**Benefits over SubCategories**:

- Multiple tags per transaction
- Custom namespaces for any dimension
- Easy filtering and aggregation
- No depth limit
- User-extensible

## Feedback & Tracking Models

### CategorySuggestionFeedback

Tracks AI/rule suggestions and user responses for learning.

```prisma
model CategorySuggestionFeedback {
  id            String   @id @default(cuid())
  transactionId String
  transaction   Transaction @relation(fields: [transactionId])

  // What we suggested
  suggestedMajorCategory String
  suggestedCategory      String
  suggestedTags          String[]
  suggestedConfidence    String  // 'high', 'medium', 'low'
  suggestedScore         Int
  suggestionSource       String  // 'pattern', 'ai', 'historical'

  // What user did
  action        String  // 'accept', 'reject', 'edit'

  // If edited
  actualMajorCategory String?
  actualCategory      String?
  actualTags          String[]

  createdAt DateTime @default(now())
}
```

**Use Cases**:

- ML model training data
- Improve AI suggestions
- Track suggestion accuracy
- User preference learning

### FileUpload

Tracks file import operations (CSV, PDF, Excel).

```prisma
model FileUpload {
  id              String   @id @default(cuid())
  userId          String
  fileName        String
  fileType        String   // 'csv', 'pdf', 'image', 'xlsx'
  fileSize        Int
  processingMethod String  // 'traditional', 'ai'
  status          String   // 'processing', 'completed', 'failed'

  // AI metadata
  aiModel         String?
  aiPrompt        String?  @db.Text
  aiResponse      String?  @db.Text

  // Results
  transactionsFound    Int     @default(0)
  transactionsImported Int     @default(0)
  errors               String? @db.Text

  createdAt       DateTime @default(now())
  completedAt     DateTime?
}
```

**Processing Methods**:

- `traditional`: Bank-specific parser (edenred.ts, revolut.ts, moey.ts)
- `ai`: Gemini Vision API for unstructured PDFs/images

### Bank

Bank definitions (system defaults + user custom).

```prisma
model Bank {
  id        String   @id @default(cuid())
  name      String   // 'ActivoBank', 'Montepio'
  slug      String   // 'activobank', 'montepio'
  logo      String?  // '/logos/activobank.png'
  color     String?  // Brand color
  userId    String?  // null = system default
  user      User?    @relation(fields: [userId])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, slug])
}
```

**Supported Banks** (parsers available):

- ActivoBank (XLSX)
- CGD (XLSX)
- Santander (XLSX)
- Montepio (XLSX)
- Edenred (JSON)
- Revolut (CSV)
- Moey (PDF with AI)

**Logo Storage**: `public/logos/` directory

## Database Operations

### Seeding

```bash
# Seed category taxonomy (273 entries)
node prisma/seed-taxonomy-v4.js

# Seed tag definitions
node prisma/seed-tag-definitions.js
```

### Migrations

```bash
# Push schema changes to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate deploy
```

### Studio (Database GUI)

```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Backup & Restore

```bash
# Backup database
node scripts/backup-database.js

# Automated daily backups via GitHub Actions
# See docs/BACKUP_RESTORE_STRATEGY.md
```

## Migration History

### v4 Taxonomy Migration (2025-12-27)

**What Changed**:

- Introduced ID-based category system
- Added `majorCategoryId` and `categoryId` fields
- Migrated 4,679 transactions (99.96% success rate)
- Kept text-based fields for backward compatibility

**Status**: Complete ✅

**Next Steps** (Issue #2):

- Remove dual-write pattern
- Deprecate text-based fields
- Clean up legacy code

## Related Documentation

- [Main Guide](../CLAUDE.md) - Project overview
- [Architecture](ARCHITECTURE.md) - System architecture
- [API Reference](API_REFERENCE.md) - API endpoints
- [Development Guide](DEVELOPMENT_GUIDE.md) - Common database tasks
