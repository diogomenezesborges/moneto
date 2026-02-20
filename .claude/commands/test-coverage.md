# Test Coverage Command (`/test:coverage`)

---

name: test-coverage
description: Run test coverage check and enforce 85% minimum threshold
agents: [test-engineer]

---

## Purpose

Runs test suite with coverage reporting and enforces project's 85% minimum coverage threshold.

## Workflow

1. Activate test-engineer agent
2. Run: `npm run test:coverage`
3. Verify thresholds: statements ≥85%, branches ≥80%, functions ≥85%, lines ≥85%
4. Report results

## Usage

```bash
/test:coverage
```

## Output

**Success:** `✅ Coverage: 92% (threshold: 85%)`
**Failure:** `❌ Coverage: 82% (threshold: 85%) - Add tests for uncovered files`

---

**Last Updated:** 2026-02-12
