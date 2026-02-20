# Epic Workflow - Multi-Issue Features

> **Mandatory workflow for epics with 5+ sub-issues (like Issue #114)**

## Overview

An "epic" is a large feature requiring 5+ sub-issues. Each sub-issue MUST follow proper DevOps workflow with individual branches and PRs.

**Example**: Issue #114 (Investment Tracking MVP) with 9 sub-issues (#105-113)

---

## ❌ WRONG Approach (Violation Example)

**What NOT to do:**

```bash
# ❌ Create ONE commit with ALL changes
git checkout feature/phase-0-design-system  # WRONG BRANCH
# ... make 23 file changes, 4,000+ lines
git commit -m "feat: add entire investment feature"  # MASSIVE COMMIT
git push  # NO PR, NO REVIEW
```

**Why this is wrong:**

- ❌ No granular code review
- ❌ No incremental progress tracking
- ❌ Can't revert individual sub-features
- ❌ Violates "commit early, commit often" principle
- ❌ Mixes unrelated work on same branch

---

## ✅ CORRECT Approach (Mandatory Workflow)

### Step 1: Plan the Epic

Create epic tracking issue with sub-issues:

```markdown
## Epic #114: Investment Tracking MVP

### Sub-Issues (Dependencies Mapped)

- [ ] #105: Database Schema (no dependencies)
- [ ] #106: API Routes (depends on #105)
- [ ] #107: Price Service (no dependencies)
- [ ] #108: Feature Structure (depends on #105, #106)
- [ ] #109: Holdings List UI (depends on #108)
- [ ] #110: Transaction UI (depends on #109)
- [ ] #111: Portfolio Summary (depends on #107, #110)
- [ ] #112: Benchmark (depends on #111)
- [ ] #113: Navigation (depends on #112)
```

### Step 2: Work on Each Sub-Issue Individually

For EACH sub-issue, follow this workflow:

```bash
# 1. Create dedicated feature branch
git checkout develop
git pull origin develop
git checkout -b feature/issue-105-investment-database-schema

# 2. Make focused changes (ONLY for this sub-issue)
# Edit files related to database schema only
npx prisma format
npm run build

# 3. Write tests for THIS sub-issue
npm run test

# 4. Commit with conventional format
git add prisma/schema.prisma lib/validation.ts
git commit -m "feat: add investment tracking database schema (#105)

- Add Holding model with HoldingType enum
- Add InvestmentTransaction model
- Add Zod validation schemas

Closes #105

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 5. Push to feature branch
git push -u origin feature/issue-105-investment-database-schema

# 6. Create PR
gh pr create --base develop \
  --title "feat: Investment Tracking - Database Schema (#105)" \
  --body "See PR template"

# 7. Wait for review and merge
# DO NOT proceed to next sub-issue until this PR is merged
```

### Step 3: Move to Next Sub-Issue

**ONLY after PR for #105 is merged:**

```bash
# 1. Update develop branch
git checkout develop
git pull origin develop

# 2. Create NEW branch for next sub-issue
git checkout -b feature/issue-106-investment-api-routes

# 3. Repeat workflow for #106
# ... focused changes, tests, commit, PR
```

### Step 4: Repeat for All Sub-Issues

Each sub-issue gets:

- ✅ Dedicated feature branch
- ✅ Focused commits (only changes for that issue)
- ✅ Individual PR
- ✅ Code review
- ✅ Merge to develop

### Step 5: Close Epic

**ONLY when ALL sub-issues merged:**

```bash
# All PRs merged: #105, #106, #107, #108, #109, #110, #111, #112, #113

# Close epic issue
gh issue close 114 --comment "✅ Epic complete. All 9 sub-issues implemented via individual PRs:
- PR #115: Database Schema (#105)
- PR #116: API Routes (#106)
- PR #117: Price Service (#107)
- PR #118: Feature Structure (#108)
- PR #119: Holdings UI (#109)
- PR #120: Transaction UI (#110)
- PR #121: Portfolio Summary (#111)
- PR #122: Benchmark (#112)
- PR #123: Navigation (#113)

Total: 9 PRs, proper code review, incremental progress."
```

---

## Workflow Verification Checklist

Before starting ANY epic, verify:

- [ ] ✅ Epic issue created with clear sub-issue list
- [ ] ✅ Dependencies between sub-issues mapped
- [ ] ✅ Sub-issues ordered by dependency (foundation first)

Before each sub-issue commit:

- [ ] ✅ On dedicated feature branch (format: `feature/issue-{N}-{description}`)
- [ ] ✅ Changes focused on ONLY this sub-issue
- [ ] ✅ Commit size reasonable (<500 lines unless unavoidable)
- [ ] ✅ Tests written for changes
- [ ] ✅ Build succeeds, tests pass
- [ ] ✅ PR created for review

Before closing epic:

- [ ] ✅ ALL sub-issues have merged PRs
- [ ] ✅ Integration testing complete
- [ ] ✅ Documentation updated
- [ ] ✅ Epic issue closed with PR references

---

## Exception: Tightly Coupled Sub-Issues

**Rare case**: If 2-3 sub-issues are inseparable (circular dependencies), combine into ONE PR with clear documentation:

```markdown
## PR Title: feat: Investment API Routes + Feature Structure (#106, #108)

**Why combined**: API routes and feature structure have circular dependencies:

- API routes need feature types
- Feature structure needs API endpoints
- Cannot implement one without the other

**Changes**:

- #106: API Routes (8 route files)
- #108: Feature Structure (types, hooks, index)

**Testing**: Unit tests cover both API and feature layer
```

**Maximum**: Combine 2-3 sub-issues per PR, ONLY if truly inseparable.

---

## Commit Size Guidelines

**Target**: <200 lines per commit
**Acceptable**: <500 lines per commit
**Requires Justification**: 500-1,000 lines
**Red Flag**: >1,000 lines (usually indicates missing incremental commits)

**If commit is >500 lines, ask yourself:**

1. Can I split this into multiple commits?
2. Can I split this into multiple sub-issues?
3. Is this a code generation case (migrations, types)? If yes, document in commit message.

---

## Summary

**Epic Workflow = Sub-Issue Workflow × N**

Each sub-issue follows the SAME workflow as any other feature:

1. Feature branch
2. Focused changes
3. Tests
4. Commit
5. PR
6. Review
7. Merge

**No shortcuts. No exceptions. No massive commits.**

---

**Violation History**:

- Issue #114 (Investment Tracking): Violated this workflow, created VIOLATION-001
