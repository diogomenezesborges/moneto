# Financial Domain Skill

---

name: financial-domain-skill
description: This skill should be used when working with financial concepts, banking terminology, transaction types, and Portuguese financial system specifics.
auto_detect: always
license: MIT

---

## Purpose

Provides domain knowledge about personal finance, banking, transaction categorization, and the Portuguese financial system specific to the TestUser family expense tracking project.

## When to Use

**Auto-activate:** Always active (core domain knowledge)

**Specifically useful for:**

- Understanding transaction types and flows
- Category taxonomy design decisions
- Banking and payment method concepts
- Portuguese financial terminology

## Capabilities

### 1. Core Concepts (ADR-001)

**Wealth Progression System (Not Just Expense Tracking):**

**Purpose:**

- Build financial self-awareness
- Reduce anxiety/shame around money
- Emphasize long-term trends over daily fluctuations
- Support both individual and shared finances

**Design Principles:**

1. **Flexible Categorization** - Tags + categories, allow editing
2. **AI Reasoning** - Show why transactions were categorized
3. **Visual Flow** - Sankey diagrams for cash flow visualization
4. **Transaction Editing** - Users can correct AI mistakes
5. **No Judgment** - Neutral language, supportive framing

### 2. Money Movements (ADR-002)

**Primary Source of Truth:**
Transactions (money movements) are the foundation of all financial data.

**Critical Distinction:**

**External Movements (Income/Expenses):**

- Income: Salary, freelance, gifts
- Expenses: Groceries, rent, entertainment

**Internal Transfers (Between Own Accounts):**

- Bank A → Bank B transfer
- Cash withdrawal from ATM
- Credit card payment from checking account

**Developer Rules:**

1. Never auto-delete transactions
2. Treat categorization as suggestions (editable)
3. Support easy transaction editing
4. Distinguish transfers in analytics (exclude from expense calculations)

### 3. Category Taxonomy

**ID-Based System (273 Categories):**

- Categories 1-273: System-wide, predefined
- Categories 10000+: User-specific custom categories

**Hierarchy:**

```
Major Category (Alimentação)
├── Subcategory (Supermercados)
├── Subcategory (Restaurantes)
└── Subcategory (Cafés e Padarias)
```

**Major Categories (9):**

1. Alimentação (Food)
2. Transporte (Transportation)
3. Habitação (Housing)
4. Saúde (Health)
5. Lazer (Leisure)
6. Educação (Education)
7. Vestuário (Clothing)
8. Outros (Other)
9. Rendimentos (Income)

**Subcategories:** 273 total, covering Portuguese expense patterns

### 4. Portuguese Banking System

**Common Banks:**

- Montepio (User 1's primary bank)
- WiZink (Credit card)
- CGD (Caixa Geral de Depósitos)
- Santander
- BCP (Millennium)
- Novo Banco
- ActivoBank

**Payment Methods:**

- Multibanco (MB) - Portuguese debit card network
- MB WAY - Mobile payment app
- Cartão de Crédito (Credit card)
- Numerário (Cash)
- Transferência (Bank transfer)

**Transaction Descriptions:**

- Portuguese merchants: "COMPRA CONTINENTE", "PINGO DOCE", "LIDL"
- Gas stations: "GALP", "BP", "REPSOL"
- Utilities: "EDP", "NOS", "MEO", "EPAL"

### 5. Transaction Classification Logic

**AI Classification Rules:**

1. Use merchant name to infer category
2. Consider amount (large = likely significant expense)
3. Consider origin (WiZink = credit card = likely purchase)
4. Provide reasoning in Portuguese

**Example:**

```
Description: "COMPRA CONTINENTE 15.50"
Amount: -15.50 EUR
Origin: WiZink
Bank: WiZink

→ Category: Supermercados (ID: 12)
→ Major Category: Alimentação (ID: 1)
→ Reasoning: "Compra em supermercado Continente"
```

### 6. Financial Metrics

**Key Metrics Tracked:**

- **Monthly Spending:** Sum of expenses by month
- **Category Breakdown:** Spending by category (%)
- **Cash Flow:** Income - Expenses over time
- **Budget vs Actual:** Compare budgeted amount to actual spending
- **Savings Rate:** (Income - Expenses) / Income

**Cash Flow Visualization:**

- Sankey diagrams showing money flow from sources (income/banks) to categories (expenses)
- Helps identify spending patterns

### 7. Data Integrity

**Duplicate Detection:**

- Same amount + same date + same merchant = potential duplicate
- Flag for review, don't auto-delete
- Use `duplicateOf` field to mark

**Transaction Editing:**

- Users can edit: description, amount, category, tags, date
- Maintain audit trail via `updatedAt` timestamp
- Don't prevent editing (trust user judgment)

**Review Status:**

- `pending` - Needs classification
- `approved` - Reviewed and correct
- `flagged` - Needs attention
- `rejected` - Duplicate or invalid (soft delete)

### 8. Multi-User Context

**User Scenarios:**

- User 1: Personal expenses (salary, credit card, bank account)
- User 2: Personal expenses (separate accounts)
- Shared: Household expenses (rent, utilities, groceries)

**Data Separation:**

- Each user has own transactions (`userId` foreign key)
- Shared categories (system-wide)
- Private transactions (only visible to owner)

---

## References

- ADR-001: Wealth Progression System: `docs/archive/architecture/adr/ADR-001.md`
- ADR-002: Money Movements: `docs/archive/architecture/adr/ADR-002.md`
- Database Schema: `docs/DATABASE.md`
- Architecture: `docs/ARCHITECTURE.md`

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
