# Git Commit Command (`/git:cm`)

---

name: git-cm
description: Smart conventional commit with branch protection checks and automatic commit message generation
agents: [git-guardian]

---

## Purpose

Creates a conventional commit with automatically generated commit message. Enforces branch protection rules and ensures commit follows project standards.

## Workflow

1. **Branch Verification**
   - Check current branch with `git branch --show-current`
   - If on `main` or `develop`, create feature branch automatically
   - Continue on feature branch

2. **Analyze Changes**

   ```bash
   git status                  # See all untracked files
   git diff --staged           # See staged changes
   git diff                    # See unstaged changes
   git log --oneline -10       # Reference commit message style
   ```

3. **Generate Commit Message**
   - Analyze staged + unstaged changes
   - Determine commit type: feat, fix, docs, refactor, test, chore, perf
   - Write concise message focusing on "why" not "what"
   - Add Co-Authored-By tag (removing AI attribution spam)
   - Format: `type(scope): description`

4. **Create Commit**

   ```bash
   git add [files]
   git commit -m "$(cat <<'EOF'
   feat(budgets): add monthly budget tracking feature

   Implements budget creation, editing, and alerts when
   spending exceeds budgeted amount.

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

5. **Verify Commit**
   ```bash
   git status                  # Confirm clean working tree
   git log -1                  # Show created commit
   ```

## Usage

```bash
/git:cm
```

**No arguments required** - analyzes changes automatically

## Examples

### Example 1: Feature Commit

**Changes:**

- Modified `app/features/budget/page.tsx`
- Modified `app/api/budgets/route.ts`
- Modified `lib/queries/budgets.ts`
- Added `prisma/migrations/20260212_add_budget_table/`

**Generated Commit:**

```
feat(budgets): add monthly budget tracking feature

Implements budget creation, editing, and visualization
with Prisma schema changes and API endpoints.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Example 2: Bug Fix

**Changes:**

- Modified `lib/queries/transactions.ts` (fixed pagination bug)
- Added `lib/queries/transactions.test.ts` (regression test)

**Generated Commit:**

```
fix(transactions): resolve pagination offset bug (#142)

Fixed incorrect offset calculation causing duplicate
transactions in paginated results. Added regression test.

Resolves #142

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Example 3: Performance Optimization

**Changes:**

- Modified `prisma/schema.prisma` (added composite index)
- Modified `lib/queries/cash-flow.ts` (optimized query)

**Generated Commit:**

```
perf(cash-flow): add composite index for date range queries

Added @@index([userId, date]) to Transaction model, reducing
cash flow query time from 850ms to 12ms on 4,679 transactions.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Output

**Success:**

```
✅ Branch verification passed (on feature/budget-tracking)
✅ Commit created successfully

Commit: feat(budgets): add monthly budget tracking feature
Branch: feature/budget-tracking
Files changed: 5
Insertions: +234
Deletions: -12

Next steps:
- Run /test:coverage to verify tests pass
- Run /git:pr to create pull request
```

**Branch Protection Violation:**

```
⚠️  WARNING: On protected branch: main

Creating feature branch: feature/auto-created-20260212-143000
✅ Switched to feature branch

✅ Commit created successfully
...
```

## Pre-Flight Checklist

Before running `/git:cm`, ensure:

- [ ] ✅ Changes are intentional and reviewed
- [ ] ✅ No sensitive data in commit (API keys, passwords)
- [ ] ✅ Tests pass (`npm run test`)
- [ ] ✅ TypeScript compiles (`npx tsc --noEmit`)
- [ ] ✅ Build succeeds (`npm run build`)

---

**Last Updated:** 2026-02-12
**Version:** 1.0
