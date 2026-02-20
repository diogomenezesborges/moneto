# Component Architecture - Moneto

> **Part of**: Moneto Documentation
> **Last Updated**: 2026-01-26
> **Related Docs**: [CLAUDE.md](../CLAUDE.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [API_REFERENCE.md](API_REFERENCE.md)

Complete component and utility library reference for the Moneto application.

---

## Table of Contents

1. [Main Application Components](#main-application-components)
2. [UI Components](#ui-components)
3. [Utility Libraries](#utility-libraries)
4. [Pages](#pages)

---

## Main Application Components

### Transactions Tab

**Location**: `app/page.tsx` (part of monolithic SPA - Issue #1)

**Purpose**: Main transaction management interface

**Features**:

- Transaction list with inline editing
- Comprehensive filtering (status, major category, category, tags, search, flagged)
- AI classification button (single transaction)
- Export CSV functionality
- Add transaction modal
- Delete confirmation dialog
- Bulk operations

**State Management**:

```typescript
const [transactions, setTransactions] = useState<Transaction[]>([])
const [editingId, setEditingId] = useState<string | null>(null)
const [filters, setFilters] = useState({
  status: 'all',
  majorCategory: 'all',
  category: 'all',
  tags: [],
  search: '',
  flagged: false,
})
```

**Key Functions**:

- `handleEdit(id)`: Enable inline editing for transaction
- `handleSave(transaction)`: Save edited transaction
- `handleDelete(id)`: Delete transaction with confirmation
- `handleAIClassify(id)`: Trigger AI classification
- `handleExportCSV()`: Export filtered transactions

---

### Rules Tab

**Location**: `app/page.tsx`

**Purpose**: Manage auto-categorization rules

**Features**:

- List of categorization rules
- Add/edit/delete rules
- Keyword-based pattern matching
- Category and tags selection
- Apply rules to pending transactions button
- Rule priority ordering

**State Management**:

```typescript
const [rules, setRules] = useState<Rule[]>([])
const [isAddingRule, setIsAddingRule] = useState(false)
const [editingRule, setEditingRule] = useState<string | null>(null)
```

**Key Functions**:

- `handleAddRule(rule)`: Create new rule
- `handleUpdateRule(id, updates)`: Update existing rule
- `handleDeleteRule(id)`: Delete rule
- `handleApplyRules()`: Apply all rules to pending transactions

---

### Stats Tab

**Location**: `app/page.tsx`

**Purpose**: Financial dashboard with charts and statistics

**Features**:

- Income vs expenses summary
- By category breakdown (pie chart)
- Monthly trends (line chart)
- Origin breakdown (bar chart)
- Date range filtering
- Export statistics

**Charts** (using Recharts):

- Line chart: Monthly trends
- Pie chart: Category distribution
- Bar chart: Origin comparison
- Area chart: Cumulative balance

**Key Metrics**:

- Total income
- Total expenses
- Net balance
- Average transaction amount
- Transaction count by category

---

### Settings Tab

**Location**: `app/page.tsx`

**Purpose**: Application and category management

**Features**:

- Category management (create, edit, delete)
- Bank selection
- Theme toggle (dark/light mode)
- Language selection (Portuguese/English)
- User preferences

**Sections**:

1. **Categories**: Manage custom categories
2. **Banks**: Add custom banks
3. **Appearance**: Dark mode, language
4. **Data**: Export/import data

---

### Review Tab

**Location**: `app/page.tsx`

**Purpose**: Transaction approval workflow

**Features**:

- List of transactions pending review
- AI batch classification button
- Approve/reject actions
- Progress tracking
- Confidence scoring display

**State Management**:

```typescript
const [reviewTransactions, setReviewTransactions] = useState<Transaction[]>([])
const [isClassifying, setIsClassifying] = useState(false)
const [progress, setProgress] = useState({ current: 0, total: 0 })
```

**Key Functions**:

- `handleBatchAIClassify()`: Classify up to 50 transactions
- `handleApprove(id)`: Approve transaction
- `handleReject(id)`: Reject classification

---

## UI Components

### CategorySelector

**Location**: `components/ui/CategorySelector.tsx`

**Purpose**: Cascading category dropdown with major category → category selection

**Props**:

```typescript
interface CategorySelectorProps {
  value: {
    majorCategoryId?: string
    categoryId?: string
  }
  onChange: (value: { majorCategoryId: string; categoryId: string }) => void
  className?: string
  disabled?: boolean
  required?: boolean
}
```

**Features**:

- Loads taxonomy from API on mount
- Cascading selection (selecting major category updates category options)
- Icon display for categories
- Loading states
- Error handling
- Dark mode support

**Usage**:

```tsx
<CategorySelector
  value={{
    majorCategoryId: 'mc_variable_costs',
    categoryId: 'cat_alimentacao',
  }}
  onChange={value => setCategory(value)}
  required
/>
```

---

### TagSelector

**Location**: `components/ui/TagSelector.tsx`

**Purpose**: Multi-tag input with autocomplete and namespace organization

**Props**:

```typescript
interface TagSelectorProps {
  value: string[] // ["trip:croatia", "vehicle:carro"]
  onChange: (tags: string[]) => void
  className?: string
  placeholder?: string
  maxTags?: number
}
```

**Features**:

- Namespace-based organization
- Autocomplete from tag definitions
- Color-coded tags by namespace
- Add/remove tags
- Keyboard navigation
- Tag validation

**Tag Format**: `namespace:value` (e.g., "trip:croatia", "type:supermercado")

**Usage**:

```tsx
<TagSelector
  value={['trip:croatia', 'type:supermercado']}
  onChange={tags => setTags(tags)}
  maxTags={10}
/>
```

---

### AIClassifier

**Location**: `components/ui/AIClassifier.tsx`

**Purpose**: AI classification button with loading states and feedback

**Props**:

```typescript
interface AIClassifierProps {
  transactionId: string
  onSuccess: (result: ClassificationResult) => void
  onError?: (error: Error) => void
  disabled?: boolean
}
```

**Features**:

- Loading spinner during classification
- Success feedback with confidence display
- Error handling with retry
- Reasoning tooltip
- Confidence color coding (high/medium/low)

**Usage**:

```tsx
<AIClassifier
  transactionId="tx-123"
  onSuccess={result => {
    console.log('Classification:', result)
    updateTransaction(result)
  }}
/>
```

---

### CategoryBadge

**Location**: `components/ui/CategoryBadge.tsx`

**Purpose**: Visual category indicator with icon and label

**Props**:

```typescript
interface CategoryBadgeProps {
  majorCategoryId?: string
  categoryId?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showMajor?: boolean
  className?: string
}
```

**Features**:

- Icon display (Lucide icons)
- Color-coded by major category
- Responsive sizing
- Tooltip with full category path
- Dark mode support

**Usage**:

```tsx
<CategoryBadge
  majorCategoryId="mc_variable_costs"
  categoryId="cat_alimentacao"
  size="md"
  showIcon
/>
```

---

### TagDisplay

**Location**: `components/ui/TagDisplay.tsx`

**Purpose**: Render tags with namespace coloring and labels

**Props**:

```typescript
interface TagDisplayProps {
  tags: string[] // ["trip:croatia", "vehicle:carro"]
  size?: 'sm' | 'md' | 'lg'
  onRemove?: (tag: string) => void
  maxDisplay?: number
  className?: string
}
```

**Features**:

- Namespace color coding
- Portuguese/English labels from tag definitions
- Remove button (optional)
- Truncation with "show more" for many tags
- Tooltip with tag description

**Usage**:

```tsx
<TagDisplay
  tags={['trip:croatia', 'type:supermercado', 'vehicle:carro']}
  size="sm"
  onRemove={tag => handleRemoveTag(tag)}
  maxDisplay={5}
/>
```

---

### OriginAvatar

**Location**: `components/ui/OriginAvatar.tsx`

**Purpose**: User/origin indicator with avatar or initials

**Props**:

```typescript
interface OriginAvatarProps {
  origin: 'User 1' | 'User 2' | 'Couple'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}
```

**Features**:

- Color-coded by origin
- Initials or icon display
- Tooltip with full name
- Accessibility labels

---

### BankSelector

**Location**: `components/ui/BankSelector.tsx`

**Purpose**: Bank dropdown with logo display

**Props**:

```typescript
interface BankSelectorProps {
  value: string
  onChange: (bank: string) => void
  className?: string
  disabled?: boolean
}
```

**Features**:

- Bank logos
- Search/filter
- Custom bank support
- Loading states

---

### DateInput

**Location**: `components/ui/DateInput.tsx`

**Purpose**: Date picker with Portuguese locale

**Props**:

```typescript
interface DateInputProps {
  value: Date | null
  onChange: (date: Date | null) => void
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}
```

**Features**:

- Portuguese date format (DD/MM/YYYY)
- Calendar picker
- Manual text input (Issue #18 - pending)
- Keyboard navigation

---

### IconPicker

**Location**: `components/ui/IconPicker.tsx`

**Purpose**: Icon selection modal with preview

**Props**:

```typescript
interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  className?: string
}
```

**Features**:

- 70+ Lucide icons
- Search/filter icons
- Category grouping
- Preview display

---

### Select

**Location**: `components/ui/Select.tsx`

**Purpose**: Generic select dropdown component

**Props**:

```typescript
interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
  disabled?: boolean
}
```

**Features**:

- Keyboard navigation
- Search/filter (optional)
- Custom styling
- Dark mode support

---

### TextInput

**Location**: `components/ui/TextInput.tsx`

**Purpose**: Generic text input with validation

**Props**:

```typescript
interface TextInputProps {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}
```

**Features**:

- Error display
- Loading states
- Character count
- Validation feedback

---

## Utility Libraries

### Authentication (`lib/auth.ts`)

**Purpose**: JWT authentication and password hashing

**Functions**:

#### hashPassword

```typescript
async function hashPassword(pin: string): Promise<string>
```

- Hashes PIN using bcrypt (12 rounds)
- Returns bcrypt hash string

#### verifyPassword

```typescript
async function verifyPassword(pin: string, hash: string): Promise<boolean>
```

- Compares plain PIN with bcrypt hash
- Returns true if match

#### signToken

```typescript
function signToken(userId: string): string
```

- Creates JWT token with 30-day expiry
- Returns signed token string

#### verifyToken

```typescript
function verifyToken(token: string): { userId: string } | null
```

- Verifies JWT token signature and expiry
- Returns decoded payload or null

#### getUserFromRequest

```typescript
async function getUserFromRequest(request: NextRequest): Promise<{ userId: string } | null>
```

- Extracts user from Authorization header
- Validates token and returns user ID

**Security Issues**:

- Dev token bypass (Issue #21 - resolved)
- Default JWT_SECRET fallback (Issue #22 - resolved)

---

### AI Classifier (`lib/ai-classifier.ts`)

**Purpose**: AI-powered transaction categorization with Google Gemini

**Main Function**:

#### classifyTransaction

```typescript
async function classifyTransaction(
  description: string,
  amount: number,
  date: Date,
  historicalTransactions?: HistoricalTransaction[]
): Promise<{
  majorCategoryId: string
  categoryId: string
  tags: string[]
  confidence: number // 0.0 - 1.0
  reasoning: string
  version: string // Prompt version
}>
```

**Features**:

- Uses Gemini 2.5 Flash model
- Deterministic prompts with version tracking
- Historical context-aware (learns from user patterns)
- Returns only valid category IDs from taxonomy
- Tag namespace system for flexible metadata
- Confidence scoring (0-1)
- Reasoning for explainability

**Tag Namespaces**:

- `vehicle`: carro, mota, autocaravana
- `trip`: croatia, tuscany, mallorca
- `provider`: sgf, ar, montepio
- `platform`: olx, vinted
- `occasion`: natal, aniversario, casamento
- `type`: supermercado, irs, fine, bank-fee

**Cost**: ~$0.000375 per transaction

---

### Gemini Client (`lib/gemini.ts`)

**Purpose**: Google Generative AI client wrapper

**Functions**:

#### parseFileWithAI

```typescript
async function parseFileWithAI(file: File, mimeType: string): Promise<ParsedTransaction[]>
```

- Extracts transactions from PDF/image bank statements
- Uses Gemini Vision for OCR
- Handles unstructured layouts

#### categorizeBatchWithAI

```typescript
async function categorizeBatchWithAI(transactions: Transaction[]): Promise<CategorySuggestion[]>
```

- Batch categorization for multiple transactions
- More efficient than individual calls
- Returns suggestions with confidence scores

---

### Category Mapper (`lib/category-mapper.ts`)

**Purpose**: Bidirectional conversion between text-based and ID-based taxonomies

**Functions**:

#### namesToIds

```typescript
async function namesToIds(
  majorCategory: string,
  category: string,
  userId: string | null
): Promise<{
  majorCategoryId: string | null
  categoryId: string | null
}>
```

- Converts category names to IDs
- Supports both system and user categories

#### idsToNames

```typescript
async function idsToNames(
  majorCategoryId: string,
  categoryId: string,
  userId: string | null
): Promise<{
  majorCategory: string | null
  category: string | null
}>
```

- Converts category IDs to names
- Returns Portuguese names

#### getAllCategoriesWithIds

```typescript
async function getAllCategoriesWithIds(userId: string | null): Promise<CategoryTaxonomy>
```

- Returns full taxonomy with both IDs and names
- Includes system defaults and user custom categories

**Caching**: 5-minute in-memory cache for performance

---

### Categories (`lib/categories.ts`)

**Purpose**: Legacy category taxonomy and default rules

**Contains**:

- 6 major categories with emojis
- 40+ subcategories
- 60+ default categorization rules

**Major Categories**:

- 💰 Rendimento (Income)
- 🎁 Rendimento Extra (Extra Income)
- 🏠 Custos Fixos (Fixed Costs)
- 🛒 Custos Variáveis (Variable Costs)
- 🎉 Gastos sem Culpa (Guilt-Free Spending)
- 🐷 Poupança (Savings)
- 📈 Investimento (Investment)
- 🏛️ Impostos (Taxes)
- ↔️ Transferências (Transfers)

---

### File Parsers (`lib/parsers.ts`)

**Purpose**: File parsing orchestrator for bank statements

**Main Function**:

#### parseFile

```typescript
async function parseFile(
  file: File,
  userId: string
): Promise<{
  transactions: ParsedTransaction[]
  method: 'traditional' | 'ai'
  errors?: string[]
}>
```

**Auto-Detection**:

- JSON → Edenred parser
- XLSX → Excel parser (ActivoBank, CGD, Santander)
- CSV → Revolut parser
- PDF → AI parser (Gemini Vision) or Moey parser

**Bank-Specific Parsers**:

- `lib/parsers/edenred.ts` - JSON format
- `lib/parsers/revolut.ts` - CSV format
- `lib/parsers/moey.ts` - PDF with OCR

**Amount Parsing**:

- European format: 1.234,56
- American format: 1,234.56

---

### Database Client (`lib/db.ts`)

**Purpose**: Prisma client singleton

```typescript
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma
```

**Usage**:

```typescript
import prisma from '@/lib/db'

const users = await prisma.user.findMany()
```

---

### Formatting & Localization (`lib/format.ts`)

**Purpose**: Portuguese (pt-PT) locale formatting

**Functions**:

#### formatCurrency

```typescript
function formatCurrency(amount: number): string
```

- Returns: "1.234,56 €"

#### formatNumber

```typescript
function formatNumber(num: number): string
```

- Returns: "1.234,56"

#### formatDate

```typescript
function formatDate(date: Date): string
```

- Returns: "23/12/2025"

#### formatDateTime

```typescript
function formatDateTime(date: Date): string
```

- Returns: "23/12/2025, 14:30"

---

### Icon Mappings (`lib/icons.ts`)

**Purpose**: Lucide icon mappings for categories

**Contains**:

- 70+ icon mappings
- Category → icon name mapping
- Icon categories: Income, Housing, Transport, Food, Health, Education, Leisure, Personal, Financial, Subscriptions, Family, Shopping

**Functions**:

#### getIcon

```typescript
function getIcon(iconName: string): LucideIcon
```

- Returns Lucide icon component

#### getCategoryIcon

```typescript
function getCategoryIcon(categorySlug: string): LucideIcon
```

- Returns icon for category slug

#### getCategoryIconName

```typescript
function getCategoryIconName(categorySlug: string): string
```

- Returns icon name string

**Example Icons**:

- `salario` → `Wallet`
- `alimentacao` → `ShoppingCart`
- `saude` → `Heart`
- `educacao` → `GraduationCap`
- `lazer` → `Popcorn`

---

### Rate Limiter (`lib/rate-limiter.ts`)

**Purpose**: API rate limiting with Upstash Redis

**Implementation**: Upstash Redis with automatic fallback to in-memory for development (Issue #23 - resolved)

**Function**:

#### checkRateLimit

```typescript
async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<{
  allowed: boolean
  retryAfter: number
}>
```

**Configuration**:

- Sliding window algorithm
- Configurable limit and window
- Redis persistence (production)
- In-memory fallback (development)

---

### Bank Normalizer (`lib/bank-normalizer.ts`)

**Purpose**: Normalize bank names and provide branding

**Constants**:

#### BANK_MAPPINGS

```typescript
export const BANK_MAPPINGS = {
  activobank: {
    normalized: 'ActivoBank',
    logo: '/logos/activobank.png',
    color: '#0066CC',
  },
  montepio: {
    normalized: 'Montepio',
    logo: '/logos/montepio.png',
    color: '#00A651',
  },
  // ... more banks
}
```

**Function**:

#### normalizeBank

```typescript
function normalizeBank(bankName: string): string
```

- Normalizes bank name variations
- Returns consistent bank identifier

---

## Pages

### Main SPA (`app/page.tsx`)

**Size**: 64KB (Issue #1 - needs refactoring)

**Purpose**: Monolithic SPA containing all main functionality

**Contains**:

- Authentication UI (PIN-based login)
- Transaction management (CRUD, inline editing)
- Rules management
- Statistics dashboard
- Settings panel
- Review workflow

**Tabs**:

1. **Transactions**: Full transaction list with filtering
2. **Rules**: Auto-categorization rules
3. **Stats**: Financial dashboard
4. **Settings**: Category and app configuration
5. **Review**: Transaction approval workflow

**Known Issue**: Too large and complex - Issue #28 proposes modular refactoring

---

### Cash Flow Page (`app/cash-flow/page.tsx`)

**Purpose**: Cash flow visualization with Sankey diagrams

**Features**:

- Interactive Sankey diagram (income → expenses flow)
- Grid view of transactions
- Multi-period selection (month, quarter, semester, year, custom)
- Filter by origin, bank, major/sub categories
- Tag breakdown view

**Libraries**:

- @nivo/sankey for Sankey diagrams
- @xyflow/react for flow diagrams
- Recharts for additional charts

---

### Design System Showcase (`app/design/page.tsx`)

**Purpose**: Component showcase and style guide

**Contains**:

- All UI components with examples
- Color palette
- Typography scale
- Spacing system
- Icon library
- Form elements

---

### Root Layout (`app/layout.tsx`)

**Purpose**: Application-wide layout and providers

**Features**:

- Dark mode support (system preference + manual toggle)
- Font loading (Inter, system fonts)
- Global styles
- Metadata configuration
- Theme provider

---

### Error Boundary (`app/error.tsx`)

**Purpose**: Application-wide error handling

**Features**:

- Error display with details
- Retry button
- Error logging
- User-friendly messages
- Dark mode support

---

## Feature Components (Refactored Architecture - Issue #28)

### Cash Flow Components

**Location**: `components/feature/cash-flow/`

#### CashFlowDiagram

**Purpose**: Flow chart visualization with custom nodes

**Props**:

```typescript
interface CashFlowDiagramProps {
  data: FlowData
  onNodeClick?: (node: FlowNode) => void
}
```

#### CashFlowNode

**Purpose**: Custom node renderer for flow diagrams

#### SankeyDiagram

**Purpose**: Sankey diagram for money flow visualization

**Props**:

```typescript
interface SankeyDiagramProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  height?: number
}
```

---

## Component Best Practices

### TypeScript Interfaces

Always define props with TypeScript interfaces:

```typescript
interface ComponentProps {
  value: string
  onChange: (value: string) => void
  className?: string
}
```

### Error Handling

Handle loading and error states:

```typescript
if (loading) return <LoadingSpinner />
if (error) return <ErrorMessage error={error} />
```

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Maintain focus management

### Dark Mode

- Use CSS variables for colors
- Test components in both themes
- Respect system preferences

### Performance

- Use React.memo for expensive components
- Lazy load heavy components
- Debounce search inputs
- Virtual scrolling for long lists

---

**End of Component Architecture**
