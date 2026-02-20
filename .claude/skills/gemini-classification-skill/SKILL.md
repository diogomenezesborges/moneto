# Gemini AI Classification Skill

---

name: gemini-classification-skill
description: This skill should be used when working with Google Gemini AI for transaction classification, categorization, and AI-powered features.
auto_detect: lib/services/gemini.ts
license: MIT

---

## Purpose

Provides knowledge of the project's Gemini 2.5 Flash integration for AI-powered transaction classification using the ID-based 273-category taxonomy.

## When to Use

**Auto-activate when:**

- `lib/services/gemini.ts` exists
- Working on AI classification features
- Debugging transaction categorization

## Capabilities

### 1. Implementation

**Service:** `lib/services/gemini.ts`

**Functions:**

- `classifyTransaction()` - Classify single transaction
- `classifyBatch()` - Batch classify multiple transactions
- `suggestCategory()` - Suggest category from description

**Success Rate:** 99.96% (4,679 transactions)

### 2. Classification Pattern

**Input:**

```typescript
{
  description: "COMPRA CONTINENTE 15.50",
  amount: -15.50,
  origin: "WiZink",
  bank: "WiZink"
}
```

**Output:**

```typescript
{
  categoryId: 12,           // "Supermercados"
  majorCategoryId: 1,       // "Alimentação"
  reasoning: "Compra em supermercado Continente"
}
```

### 3. Key Features

**ID-Based Taxonomy:**

- 273 predefined categories (IDs 1-273)
- AI returns category ID + reasoning
- Fallback to major category if uncertain

**Prompt Engineering:**

- Portuguese-focused prompts
- Context about family finances
- Handles ambiguous merchants

**Error Handling:**

- Rate limiting (429) → Retry with exponential backoff
- Invalid category ID → Fallback to major category
- Parsing errors → Return "uncategorized" status

---

## References

- Implementation: `lib/services/gemini.ts`
- Taxonomy: `docs/DATABASE.md`
- Issue #36: State management migration

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
