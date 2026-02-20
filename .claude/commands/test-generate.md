# Test Generate Command (`/test:generate`)

---

name: test-generate
description: Generate comprehensive test file for source code
agents: [test-engineer]

---

## Purpose

Generates tests for a given source file (utilities, API routes, or components).

## Usage

```bash
/test:generate [file-path]
```

## Examples

```bash
/test:generate lib/queries/budgets.ts
/test:generate app/api/budgets/route.ts
```

---

**Last Updated:** 2026-02-12
