# API Reference - Moneto

> **Part of**: Moneto Documentation
> **Last Updated**: 2026-01-26
> **Related Docs**: [CLAUDE.md](../CLAUDE.md) | [ARCHITECTURE.md](ARCHITECTURE.md) | [DATABASE.md](DATABASE.md)

Complete API endpoint reference for all HTTP routes in the Moneto application.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Transactions](#transactions)
3. [Transaction Utilities](#transaction-utilities)
4. [Categories](#categories)
5. [Rules](#rules)
6. [Tags](#tags)
7. [Banks](#banks)
8. [AI Services](#ai-services)

---

## Authentication

### POST /api/auth

**Purpose**: Handle user authentication (register, login, logout)

**Actions**: `register`, `login`, `logout`

#### Request (Login)

```json
{
  "action": "login",
  "name": "TestUser",
  "pin": "1234"
}
```

#### Response (Success)

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "user-id",
    "name": "TestUser"
  }
}
```

#### Request (Register)

```json
{
  "action": "register",
  "name": "TestUser",
  "pin": "1234"
}
```

#### Request (Logout)

```json
{
  "action": "logout"
}
```

**Rate Limiting**: 5 attempts per 15 minutes per IP

**Security Notes**:

- JWT tokens expire after 30 days
- PIN is hashed with bcrypt (12 rounds)
- Dev token bypass exists (Issue #21 - restricted to development only)
- Default JWT_SECRET fallback removed (Issue #22 - resolved)

---

## Transactions

### GET /api/transactions

**Purpose**: Fetch user's transactions

**Authentication**: Required (JWT token in `Authorization` header)

**Query Parameters**:

- `id` (optional): Fetch single transaction by ID

#### Response (List)

```json
{
  "transactions": [
    {
      "id": "tx-id",
      "rawDate": "2025-12-23T00:00:00.000Z",
      "rawDescription": "Continente",
      "rawAmount": -45.32,
      "rawBalance": 1234.56,
      "origin": "Couple",
      "bank": "ActivoBank",
      "majorCategoryId": "mc_variable_costs",
      "categoryId": "cat_alimentacao",
      "tags": ["type:supermercado"],
      "classifierConfidence": 0.95,
      "classifierReasoning": "Grocery shopping at Continente",
      "classifierVersion": "v2.1",
      "status": "categorized",
      "reviewStatus": null,
      "flagged": false,
      "notes": null,
      "createdAt": "2025-12-23T10:00:00.000Z",
      "updatedAt": "2025-12-23T10:05:00.000Z"
    }
  ]
}
```

---

### POST /api/transactions

**Purpose**: Batch import transactions

**Authentication**: Required

#### Request

```json
{
  "transactions": [
    {
      "date": "2025-12-23T00:00:00.000Z",
      "description": "Continente Faro",
      "amount": -45.32,
      "balance": 1234.56,
      "origin": "Couple",
      "bank": "ActivoBank"
    }
  ]
}
```

**Validation**: Zod schema validates each transaction (date, description, amount, origin, bank)

**Duplicate Detection**: Matches on `date + description + amount + origin + bank`

#### Response

```json
{
  "success": true,
  "imported": 95,
  "duplicates": 5,
  "batchId": "batch-id-12345"
}
```

**Notes**:

- Duplicates are not imported (based on exact match)
- All transactions get a unique `importBatchId`

---

### PATCH /api/transactions

**Purpose**: Update existing transaction

**Authentication**: Required

#### Request

```json
{
  "id": "tx-id",
  "majorCategoryId": "mc_variable_costs",
  "categoryId": "cat_alimentacao",
  "tags": ["type:supermercado", "trip:croatia"],
  "notes": "Groceries for the week",
  "flagged": false
}
```

**Updatable Fields**:

- `majorCategoryId`, `categoryId`
- `tags` (array of strings)
- `notes` (string, max 1000 chars)
- `flagged` (boolean)
- `reviewStatus` (null, "pending_review", "rejected")

#### Response

```json
{
  "success": true,
  "transaction": {
    /* updated transaction object */
  }
}
```

---

### DELETE /api/transactions

**Purpose**: Delete transaction

**Authentication**: Required

#### Request

```json
{
  "id": "tx-id"
}
```

#### Response

```json
{
  "success": true,
  "message": "Transaction deleted"
}
```

**Notes**:

- User must own the transaction
- Deletion is permanent (no soft delete - see Issue #35)

---

## Transaction Utilities

### GET /api/transactions/stats

**Purpose**: Dashboard statistics for current user

**Authentication**: Required

**Query Parameters**:

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `origin` (optional): Filter by origin (User 1, User 2, Couple)

#### Response

```json
{
  "totalIncome": 3500.0,
  "totalExpenses": -2456.78,
  "netBalance": 1043.22,
  "byMajorCategory": [
    {
      "majorCategory": "Custos Variáveis",
      "total": -1234.56,
      "count": 45
    }
  ],
  "byOrigin": [
    {
      "origin": "Couple",
      "total": -1500.0,
      "count": 30
    }
  ],
  "byMonth": [
    {
      "month": "2025-12",
      "income": 3500.0,
      "expenses": -2456.78,
      "net": 1043.22
    }
  ]
}
```

---

### POST /api/transactions/auto-categorize

**Purpose**: Apply categorization rules to pending transactions

**Authentication**: Required

#### Request

```json
{}
```

**Notes**: Empty body - applies all active rules to pending transactions

#### Response

```json
{
  "success": true,
  "categorized": 23,
  "pending": 5
}
```

**Algorithm**:

1. Fetch all user's rules
2. Fetch all pending transactions (status = "pending")
3. For each transaction, check if description contains keyword (case-insensitive)
4. Apply first matching rule
5. Update transaction with category and tags from rule

---

### POST /api/transactions/ai-classify

**Purpose**: AI classification of single transaction using Google Gemini

**Authentication**: Required

#### Request

```json
{
  "transactionId": "tx-id"
}
```

#### Response

```json
{
  "success": true,
  "majorCategoryId": "mc_variable_costs",
  "categoryId": "cat_alimentacao",
  "tags": ["type:supermercado"],
  "confidence": 0.95,
  "reasoning": "Transaction at Continente with amount typical for grocery shopping",
  "version": "v2.1"
}
```

**Cost**: ~$0.000375 per classification (~€0.07/month for 200 transactions)

**Features**:

- Historical context-aware (learns from user's previous categorizations)
- Confidence scoring (0.0 - 1.0)
- Explainable reasoning
- Version tracking for prompt evolution

**Confidence Levels**:

- 0.70 - 1.00: High (🟢) - Auto-apply with confidence
- 0.50 - 0.69: Medium (🟡) - Suggest with caution
- 0.00 - 0.49: Low (🔴) - Manual review recommended

---

### GET /api/transactions/cash-flow

**Purpose**: Sankey diagram data for cash flow visualization

**Authentication**: Required

**Query Parameters**:

- `period`: `month` | `quarter` | `semester` | `year` | `custom`
- `year`: Year (e.g., `2025`)
- `month`: Month 1-12 (if period=month)
- `startDate`: ISO date (if period=custom)
- `endDate`: ISO date (if period=custom)
- `origin`: `all` | `User 1` | `User 2` | `Couple`
- `bank`: Bank slug filter (optional)

#### Response

```json
{
  "nodes": [
    {
      "id": "mc_income",
      "label": "Rendimento",
      "value": 3500.0,
      "color": "#10B981"
    },
    {
      "id": "mc_variable_costs",
      "label": "Custos Variáveis",
      "value": 1234.56,
      "color": "#F59E0B"
    }
  ],
  "links": [
    {
      "source": "mc_income",
      "target": "cat_alimentacao",
      "value": 456.78
    }
  ],
  "totalIncome": 3500.0,
  "totalExpenses": -2456.78
}
```

**Notes**:

- Transfers (mc_transfers) are filtered out from cash flow
- Nodes represent major categories and categories
- Links represent money flow from income to expenses

---

### POST /api/transactions/suggest-categories

**Purpose**: Batch AI category suggestions for multiple transactions

**Authentication**: Required

#### Request

```json
{
  "transactionIds": ["tx-id-1", "tx-id-2", "tx-id-3"]
}
```

**Limit**: Maximum 50 transactions per request

#### Response

```json
{
  "suggestions": [
    {
      "transactionId": "tx-id-1",
      "majorCategoryId": "mc_variable_costs",
      "categoryId": "cat_alimentacao",
      "tags": ["type:supermercado"],
      "confidence": 0.95,
      "reasoning": "Grocery shopping pattern"
    },
    {
      "transactionId": "tx-id-2",
      "majorCategoryId": "mc_guilt_free",
      "categoryId": "cat_lazer",
      "tags": ["occasion:aniversario"],
      "confidence": 0.82,
      "reasoning": "Entertainment expense"
    }
  ]
}
```

---

### GET /api/transactions/review

**Purpose**: Fetch transactions pending review

**Authentication**: Required

**Query Parameters**:

- `limit` (optional): Max results (default: 50)

#### Response

```json
{
  "transactions": [
    {
      "id": "tx-id",
      "reviewStatus": "pending_review",
      "rawDescription": "Unknown Vendor",
      "rawAmount": -123.45
      /* ... other transaction fields */
    }
  ]
}
```

**Notes**: Returns transactions with `reviewStatus = "pending_review"`

---

## Categories

### GET /api/categories

**Purpose**: Fetch complete category taxonomy (both ID-based and text-based)

**Authentication**: Required

#### Response

```json
{
  "taxonomyWithIds": {
    "majorCategories": [
      {
        "id": "mc_income",
        "slug": "rendimento",
        "name": "Rendimento",
        "nameEn": "Income",
        "emoji": "💰",
        "budgetCategory": null,
        "sortOrder": 1,
        "categories": [
          {
            "id": "cat_salario",
            "slug": "salario",
            "name": "Salário",
            "nameEn": "Salary",
            "icon": "wallet",
            "sortOrder": 1
          }
        ]
      }
    ]
  },
  "taxonomy": {
    "💰 Rendimento": {
      "Salário": ["Salário Líquido", "Vencimento Base", "Subsídios"]
    }
  }
}
```

**Notes**:

- `taxonomyWithIds`: Modern ID-based system (recommended)
- `taxonomy`: Legacy text-based system (deprecated, kept for backward compatibility)
- Includes both system defaults (userId: null) and user custom categories

---

### POST /api/categories/manage

**Purpose**: Create custom category

**Authentication**: Required

#### Request

```json
{
  "action": "create",
  "majorCategoryId": "mc_variable_costs",
  "slug": "pets",
  "name": "Animais de Estimação",
  "nameEn": "Pets",
  "icon": "dog",
  "sortOrder": 10
}
```

#### Response

```json
{
  "success": true,
  "category": {
    "id": "cat_custom_123",
    "majorCategoryId": "mc_variable_costs",
    "slug": "pets",
    "name": "Animais de Estimação",
    "nameEn": "Pets",
    "icon": "dog",
    "sortOrder": 10,
    "userId": "user-id"
  }
}
```

---

### PATCH /api/categories/manage

**Purpose**: Update existing category

**Authentication**: Required

#### Request

```json
{
  "action": "update",
  "categoryId": "cat-id",
  "name": "New Name",
  "icon": "new-icon",
  "sortOrder": 5
}
```

**Notes**: Can only update user-created categories (userId must match)

---

### DELETE /api/categories/manage

**Purpose**: Delete custom category

**Authentication**: Required

#### Request

```json
{
  "action": "delete",
  "categoryId": "cat-id"
}
```

**Notes**:

- Can only delete user-created categories
- System categories (userId: null) cannot be deleted
- Transactions using this category will have categoryId set to null

---

## Rules

### GET /api/rules

**Purpose**: Fetch all categorization rules for current user

**Authentication**: Required

#### Response

```json
{
  "rules": [
    {
      "id": "rule-id",
      "keyword": "continente",
      "majorCategory": "Custos Variáveis",
      "category": "Alimentação",
      "tags": ["type:supermercado"],
      "isDefault": true,
      "createdAt": "2025-12-23T10:00:00.000Z"
    }
  ]
}
```

**Notes**:

- Includes both default rules (isDefault: true) and user-created rules
- Rules are case-insensitive when matching

---

### POST /api/rules

**Purpose**: Create new categorization rule

**Authentication**: Required

#### Request

```json
{
  "keyword": "uber eats",
  "majorCategory": "Custos Variáveis",
  "category": "Alimentação",
  "tags": ["platform:uber"],
  "isDefault": false
}
```

**Validation**:

- `keyword`: Required, min 1 char
- `majorCategory`: Required
- `category`: Required
- `tags`: Optional array of strings

#### Response

```json
{
  "success": true,
  "rule": {
    "id": "rule-id",
    "keyword": "uber eats",
    "majorCategory": "Custos Variáveis",
    "category": "Alimentação",
    "tags": ["platform:uber"],
    "isDefault": false,
    "userId": "user-id",
    "createdAt": "2025-12-23T10:00:00.000Z"
  }
}
```

---

### DELETE /api/rules

**Purpose**: Delete categorization rule

**Authentication**: Required

#### Request

```json
{
  "id": "rule-id"
}
```

**Notes**:

- User must own the rule
- Default rules (isDefault: true) cannot be deleted by users

---

## Tags

### GET /api/tags

**Purpose**: Fetch all tag definitions organized by namespace

**Authentication**: Required

#### Response

```json
{
  "tagsByNamespace": {
    "vehicle": [
      {
        "value": "carro",
        "label": "Carro",
        "labelEn": "Car",
        "color": "#3B82F6",
        "sortOrder": 1
      },
      {
        "value": "mota",
        "label": "Mota",
        "labelEn": "Motorcycle",
        "color": "#3B82F6",
        "sortOrder": 2
      }
    ],
    "trip": [
      {
        "value": "croatia",
        "label": "Croácia",
        "labelEn": "Croatia",
        "color": "#10B981",
        "sortOrder": 1
      }
    ],
    "type": [
      {
        "value": "supermercado",
        "label": "Supermercado",
        "labelEn": "Supermarket",
        "color": "#F59E0B",
        "sortOrder": 1
      }
    ]
  }
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

---

### POST /api/tags

**Purpose**: Create or update tag definition

**Authentication**: Required

#### Request

```json
{
  "namespace": "trip",
  "value": "portugal",
  "label": "Portugal",
  "labelEn": "Portugal",
  "color": "#EF4444",
  "sortOrder": 10
}
```

**Validation**:

- `namespace`: Required
- `value`: Required
- `label`: Required
- `labelEn`: Optional
- `color`: Optional (hex color)
- `sortOrder`: Optional (default: 0)

#### Response

```json
{
  "success": true,
  "tagDefinition": {
    "id": "tag-id",
    "namespace": "trip",
    "value": "portugal",
    "label": "Portugal",
    "labelEn": "Portugal",
    "color": "#EF4444",
    "sortOrder": 10
  }
}
```

**Notes**: If tag with same namespace+value exists, it will be updated

---

## Banks

### GET /api/banks

**Purpose**: Fetch all bank definitions

**Authentication**: Required

#### Response

```json
{
  "banks": [
    {
      "id": "bank-id",
      "name": "ActivoBank",
      "slug": "activobank",
      "logo": "/logos/activobank.png",
      "color": "#0066CC",
      "userId": null
    }
  ]
}
```

**Notes**:

- Includes both system banks (userId: null) and user-created banks
- System banks cannot be modified or deleted

---

### POST /api/banks

**Purpose**: Create custom bank

**Authentication**: Required

#### Request

```json
{
  "name": "My Bank",
  "slug": "mybank",
  "logo": "/logos/mybank.png",
  "color": "#FF0000"
}
```

**Validation**:

- `name`: Required, max 100 chars
- `slug`: Required, lowercase alphanumeric + hyphens
- `logo`: Optional, path to logo image
- `color`: Optional, hex color

#### Response

```json
{
  "success": true,
  "bank": {
    "id": "bank-id",
    "name": "My Bank",
    "slug": "mybank",
    "logo": "/logos/mybank.png",
    "color": "#FF0000",
    "userId": "user-id"
  }
}
```

---

## AI Services

### POST /api/ai/parse-file

**Purpose**: AI-powered file parsing for PDF bank statements and images using Google Gemini Vision

**Authentication**: Required

**Content-Type**: `multipart/form-data`

#### Request

FormData with:

- `file`: File object (PDF or image)

**Supported Formats**:

- PDF (application/pdf)
- Images (image/jpeg, image/png, image/webp)

#### Response

```json
{
  "success": true,
  "transactions": [
    {
      "date": "2025-12-23T00:00:00.000Z",
      "description": "Continente",
      "amount": -45.32,
      "balance": 1234.56,
      "origin": "Couple",
      "bank": "ActivoBank"
    }
  ],
  "method": "ai",
  "model": "gemini-2.5-flash"
}
```

**Notes**:

- Uses Gemini 2.5 Flash Vision model
- Extracts transactions from bank statements
- Handles both structured (tables) and unstructured layouts
- Falls back to traditional parsing for known formats (XLSX, CSV)

**Cost**: Variable based on file size (typically $0.01-0.05 per statement)

---

### POST /api/ai/feedback

**Purpose**: Collect feedback on AI category suggestions for continuous improvement

**Authentication**: Required

#### Request

```json
{
  "transactionId": "tx-id",
  "suggestedMajorCategory": "mc_variable_costs",
  "suggestedCategory": "cat_alimentacao",
  "suggestedTags": ["type:supermercado"],
  "suggestedConfidence": "high",
  "suggestedScore": 95,
  "suggestionSource": "ai",
  "action": "accept",
  "actualMajorCategory": "mc_variable_costs",
  "actualCategory": "cat_alimentacao",
  "actualTags": ["type:supermercado"]
}
```

**Actions**:

- `accept`: User accepted suggestion as-is
- `reject`: User rejected suggestion
- `edit`: User modified suggestion

#### Response

```json
{
  "success": true,
  "feedbackId": "feedback-id"
}
```

**Notes**:

- Feedback is stored in `CategorySuggestionFeedback` table
- Used to improve AI classification accuracy over time
- Helps identify patterns in user corrections

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "amount",
      "message": "Expected number, received string"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "error": "Not found",
  "message": "Resource with id 'xyz' not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 900,
  "message": "Too many requests. Please try again in 15 minutes."
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

**Implementation**: Upstash Redis with sliding window algorithm (Issue #23 - resolved)

**Limits**:

- Authentication endpoints: 5 requests per 15 minutes per IP
- AI classification: 10 requests per minute per user
- File upload: 5 requests per hour per user
- All other endpoints: 100 requests per minute per user

**Development Mode**: Falls back to in-memory rate limiting when Redis not configured

**Headers**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Security

**Authentication**: JWT tokens in `Authorization: Bearer <token>` header

**Input Validation**: Zod schemas on core endpoints (Issue #24 - partially resolved)

**CSRF Protection**: Double Submit Cookie pattern (Issue #26 - in progress)

**Security Headers**:

- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

See [SECURITY.md](SECURITY.md) for complete security documentation.

---

## API Versioning

**Current Version**: v1

**URL Format**: `/api/v1/resource` (planned - Issue #31)

**Response Headers**:

```
X-API-Version: 1.0.0
```

See [API_VERSIONING.md](API_VERSIONING.md) for versioning strategy.

---

**End of API Reference**
