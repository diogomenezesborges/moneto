# Claude AI Guide - Moneto (Moneto)

> **Last Updated**: 2026-02-12
> **Version**: 2.30
> **Status**: ✅ Testing Requirements + Bug Fix Verification Framework

## Table of Contents

1. [🤖 MANDATORY: AI Agent Workflow Rules](#-mandatory-ai-agent-workflow-rules) ⚠️ **READ FIRST**
2. [⚙️ Claude Workspace Operating Rules](#️-claude-workspace-operating-rules) 🎯 **EFFICIENCY GUIDE**
3. [🚨 Rate Limit Awareness](#-rate-limit-awareness) 🔥 **PREVENTS LOST WORK**
4. [📦 Project Stack](#-project-stack) 🛠️ **BUILD REQUIREMENTS**
5. [🔀 Git Workflow](#-git-workflow) 📋 **BRANCH STRATEGY**
6. [✅ Task Completion](#-task-completion) ✔️ **NEVER SKIP TASKS**
7. [🖥️ Server & Dev Environment](#️-server--dev-environment) 🌐 **UI VERIFICATION**
8. [🧪 Testing Requirements](#-testing-requirements) ✅ **MANDATORY FOR ALL CODE CHANGES**
9. [Project Overview](#project-overview)
10. [Architecture Decision Records](#architecture-decision-records)
11. [Quick Reference](#quick-reference)
12. [Documentation Index](#documentation-index)
13. [Getting Help](#getting-help)
14. [Changelog](#changelog)

---

## 🤖 MANDATORY: AI Agent Workflow Rules

> **⚠️ CRITICAL: All AI agents (Claude Code, Cursor, GitHub Copilot, etc.) MUST follow these rules.**
> **This repository uses a private GitHub repo without branch protection (Free plan).**
> **These rules enforce best practices through AI agent compliance.**

### 🚫 NEVER Do These Actions

**AI agents are ABSOLUTELY FORBIDDEN from:**

1. **❌ NEVER push directly to `main` branch**

   ```bash
   # FORBIDDEN - AI agents must NEVER run this
   git push origin main
   ```

2. **❌ NEVER push directly to `develop` branch**

   ```bash
   # FORBIDDEN - AI agents must NEVER run this
   git push origin develop
   ```

3. **❌ NEVER commit while on `main` or `develop` branches**
   - Always verify current branch before committing
   - If on `main` or `develop`, stop and create feature branch first

4. **❌ NEVER merge without PR approval**
   - All merges to `main` require 2 reviews
   - All merges to `develop` require 1 review
   - AI agents cannot self-approve PRs

5. **❌ NEVER bypass CI checks**
   - All PRs must pass: lint, type-check, tests, build
   - If CI fails, fix the issues, don't force merge

### ✅ REQUIRED Workflow for All Code Changes

**AI agents MUST follow this exact workflow:**

#### Step 1: Check Current Branch

```bash
# REQUIRED: Check current branch before ANY git operation
git branch --show-current
```

**If on `main` or `develop`:**

```bash
# REQUIRED: Create feature branch immediately
git checkout -b feature/descriptive-name
```

#### Step 2: Make Changes

- Edit files as requested
- Write/update tests
- Update documentation

#### Step 3: Commit to Feature Branch

```bash
# REQUIRED: Verify you're on a feature branch
git branch --show-current  # Must NOT be main or develop

# REQUIRED: Commit with conventional commit format
git add [files]
git commit -m "feat: description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

#### Step 4: Push Feature Branch

```bash
# REQUIRED: Push to feature branch only
git push origin feature/descriptive-name
```

#### Step 5: Create Pull Request

```bash
# REQUIRED: Create PR via GitHub CLI
gh pr create --base develop \
  --title "feat: Description" \
  --body "See PR template"
```

**AI agents MUST:**

- Use PR template (auto-filled by GitHub)
- Link to related issues
- Request reviews (AI cannot merge without human approval)

#### Step 6: Wait for Human Review

**AI agents MUST STOP HERE.**

- AI agents CANNOT approve PRs
- AI agents CANNOT merge PRs
- Human must review and merge

### 🔍 Branch Verification Protocol

**Before ANY git operation, AI agents MUST:**

```bash
# 1. Check current branch
current_branch=$(git branch --show-current)

# 2. Verify it's not a protected branch
if [[ "$current_branch" == "main" || "$current_branch" == "develop" ]]; then
  echo "❌ ERROR: Cannot work on protected branch: $current_branch"
  echo "Creating feature branch instead..."
  git checkout -b feature/auto-created-$(date +%Y%m%d-%H%M%S)
fi

# 3. Proceed with work
```

### 📋 Exception Handling

**Only documentation-only updates or emergency hotfixes are allowed on `main`/`develop`**, and ONLY with explicit confirmation protocol.

**Critical Rule**: AI MUST ask "Should I push directly to main? If yes, please respond with: 'commit directly to main'" and WAIT for exact phrase. Never assume "GO GO GO" or "emergency" = permission.

**For complete emergency hotfix protocol with examples**: See [.claude/workflows/emergency-hotfix.md](.claude/workflows/emergency-hotfix.md)

**Example of CORRECT protocol:**

```
User: "WE NEED TO FIX THIS NOW! GO GO GO"
AI: "⚠️ This is urgent. Should I push directly to main? If yes, please respond with: 'commit directly to main'"
User: "commit directly to main"
AI: "⚠️ Pushing directly to main as requested" [proceeds with push]
```

**Example of INCORRECT behavior (NEVER do this):**

```
User: "WE NEED TO FIX THIS NOW! GO GO GO"
AI: [assumes permission and pushes directly to main] ❌ VIOLATION
```

### 🎯 Workflow Enforcement Checklist

**Before pushing ANY changes, AI agents MUST verify:**

- [ ] ✅ Current branch is NOT `main` or `develop`
- [ ] ✅ All tests pass locally (if applicable)
- [ ] ✅ Code follows project conventions
- [ ] ✅ Commit message uses conventional format
- [ ] ✅ PR will be created (not direct push to protected branch)
- [ ] ✅ Human review requested

### 🚨 Violation Response

**If an AI agent accidentally violates these rules:**

1. **Immediately notify the user**

   ```
   ⚠️ WARNING: I accidentally pushed to [main/develop]
   This violates the mandatory workflow rules.
   Please review the changes and consider reverting if needed.
   ```

2. **Create an issue documenting the violation**
3. **Never repeat the same violation**

### 📖 Summary for AI Agents

**Think of this as branch protection enforced through AI compliance:**

- 🔴 `main` = Production (2 reviews required)
- 🟡 `develop` = Staging (1 review required)
- 🟢 `feature/*` = Your workspace (AI can work freely)

**Remember:** This repository relies on AI agents following these rules since GitHub Free doesn't enforce branch protection on private repos. **Your compliance is critical for repository safety.**

---

## ⚙️ Claude Workspace Operating Rules

> **Purpose**: Optimize AI agent efficiency while maintaining correctness and code quality.

### Priority Order (Highest to Lowest)

1. **Correctness and safety**
2. **Alignment with existing architecture**
3. **Reviewability by senior engineers**
4. **Token efficiency**

### General Behavior

- Never trade correctness or safety for brevity
- Minimize token usage only after correctness is satisfied
- If acting on inferred or historical context, state assumptions explicitly
- Do not silently guess

### Verbosity Control

- Default to concise responses
- Expand explanations proportionally to:
  - Risk of change
  - Architectural impact
  - Data correctness implications
- For low-risk changes, keep explanations minimal
- For high-risk changes, provide clear justification

### Code Changes

- Prefer minimal diffs over full-file output
- Diffs must be context-complete and syntactically valid
- Do not omit required imports, types, or surrounding logic
- Never regenerate unchanged code
- Before large or multi-file changes, request confirmation

### Architectural Discipline

- Do not introduce new abstractions, patterns, or dependencies unless requested
- When architecture changes are requested:
  - Describe the change in <150 words before writing code
  - Highlight tradeoffs and risks briefly

### Context Management

- Assume workspace files are the source of truth
- If context may be outdated or ambiguous, pause and ask for clarification
- Do not restate known decisions unless they are being challenged or revised

### Clarification Protocol

- If blocked by uncertainty, ask clarifying questions before proceeding
- Batch questions when multiple unknowns exist
- Clearly state what cannot be done without clarification

### Output Discipline

- No summaries, alternatives, or refactors unless they add material value
- When alternatives are materially different, list at most two with one-line tradeoffs
- Stop immediately once the task is complete

---

## 🚨 Rate Limit Awareness

**CRITICAL: Commit incrementally to avoid losing work to rate limits.**

When working on multi-step tasks:

1. **Prioritize completing and committing each step before moving to the next**
2. **If a task has 3+ phases, commit after each phase**
3. **Never leave work uncommitted when approaching complex changes**
4. **Break large tasks into smaller, committable units**

**Rate limits have cut short 10+ sessions with uncommitted work. This prevents that.**

---

## 📦 Project Stack

**Tech Stack**: TypeScript (strict), Next.js 15, Prisma, PostgreSQL (Neon), Vercel

**Mandatory Build Verification**: Before committing, run `npx prisma generate`, `npm run build`, and `npm run lint`.

**For detailed build workflow and requirements**: See [.claude/workflows/build-workflow.md](.claude/workflows/build-workflow.md)

---

## 🔀 Git Workflow

**Branch Strategy:**

- ✅ Always commit to feature branches (`feature/*`, `fix/*`, `docs/*`)
- ❌ NEVER commit directly to `main` (production) or `develop` (staging)

**Key Rule:** Check current branch before ANY git operation, commit early and often.

**For detailed workflow steps**: See [.claude/workflows/git-workflow.md](.claude/workflows/git-workflow.md)

---

## ✅ Task Completion

**When given multiple tasks:**

1. **Complete them in priority order** - highest priority first
2. **Never skip a previously agreed-upon task** - if unsure whether a prior instruction was completed, check before moving on
3. **Always confirm completion of each task explicitly** - mark as done before moving to next
4. **Use TodoWrite to track progress** - check off items as completed
5. **Review the todo list before ending session** - flag anything incomplete

**If Claude forgets a task mid-session, this prevents it. Check the list regularly.**

---

## 🖥️ Server & Dev Environment

**Development server**: `npm run dev` (localhost:3000)

**UI Verification Rule**: Never mark UI tasks complete without browser verification (check console, test both light/dark mode).

**For complete UI verification checklist**: See [.claude/workflows/ui-verification.md](.claude/workflows/ui-verification.md)

---

## 🧪 Testing Requirements

> **⚠️ CRITICAL**: All code changes and bug fixes MUST include tests. No exceptions.

### Mandatory Testing Protocol

**BEFORE marking any bug fix or feature as complete:**

1. **Write Tests First** (Test-Driven Development encouraged)
   - Unit tests for individual functions/utilities
   - Integration tests for API endpoints
   - Component tests for UI changes

2. **Run Test Suite**

   ```bash
   npm run test              # Run all unit/integration tests
   npm run test:coverage     # Verify coverage thresholds
   npm run test:e2e          # Run end-to-end tests (when applicable)
   ```

3. **Verify All Tests Pass**
   - ✅ All existing tests must still pass
   - ✅ New tests must pass
   - ✅ Coverage must not decrease

4. **For Performance Changes: Add Benchmarks**
   - Create benchmark script (e.g., `*.benchmark.ts`)
   - Document baseline vs optimized performance
   - Include query count analysis for database optimizations

### Code Coverage Requirements

**Minimum Coverage Thresholds:**

- **Overall Coverage**: 85% minimum
- **Statements**: 85% minimum
- **Branches**: 80% minimum
- **Functions**: 85% minimum
- **Lines**: 85% minimum

**Enforcement:**

```bash
# Run tests with coverage report
npm run test:coverage

# CI/CD will fail if coverage drops below thresholds
# Check coverage report in: coverage/index.html
```

**Coverage Rules:**

1. **New code must have ≥85% coverage** - No exceptions for features or bug fixes
2. **PRs cannot decrease overall coverage** - Must maintain or improve coverage
3. **Critical paths must have 100% coverage** - Auth, payments, data integrity
4. **Uncovered code requires justification** - Document why in PR description

**Viewing Coverage Reports:**

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
# Windows: start coverage/index.html
# Mac/Linux: open coverage/index.html
```

### Test File Naming Conventions

- **Unit/Integration Tests**: `*.test.ts` or `*.spec.ts`
- **E2E Tests**: `e2e/**/*.spec.ts`
- **Benchmarks**: `*.benchmark.ts`

### Test Location Strategy

**Co-locate tests with source code:**

- `lib/queries/review.ts` → `lib/queries/review.test.ts`
- `app/api/transactions/route.ts` → `app/api/transactions/route.test.ts`
- `app/features/settings/CategoryManagement.tsx` → `app/features/settings/CategoryManagement.test.tsx`

### Testing Tools & Utilities

**Test Framework**: Vitest (configured in `vitest.config.ts`)
**React Testing**: @testing-library/react, @testing-library/user-event
**E2E Testing**: Playwright
**Mocking**: Vitest `vi.mock()` and `vi.fn()`

**Common Test Utilities:**

- `lib/queries/test-utils.tsx` - React Query testing helpers
- `createWrapper(queryClient)` - Wrap hooks with QueryClientProvider
- `createTestQueryClient()` - Fresh QueryClient for each test

### Example Test Structure

```typescript
/**
 * Tests for Bug #X: [Bug Description]
 *
 * Verifies that [what was fixed] works correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Bug #X: [Bug Name]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should [expected behavior]', () => {
    // Arrange
    const input = setupTestData()

    // Act
    const result = performAction(input)

    // Assert
    expect(result).toBe(expected)
  })

  it('should handle edge case: [description]', () => {
    // Test edge cases and error conditions
  })
})
```

### Performance Benchmark Example

```typescript
/**
 * Benchmark for Bug #X: [Performance Fix]
 *
 * Compares OLD approach vs NEW approach with varying data sizes.
 * Run with: npx tsx path/to/file.benchmark.ts
 */

async function runBenchmark() {
  console.log('OLD APPROACH:')
  const oldDuration = await measureOldApproach()

  console.log('NEW APPROACH:')
  const newDuration = await measureNewApproach()

  console.log(`Speedup: ${(oldDuration / newDuration).toFixed(2)}x faster`)
}
```

### Verification Checklist

**Before committing bug fixes:**

- [ ] ✅ Tests written for the bug fix
- [ ] ✅ Tests verify the fix works
- [ ] ✅ Tests prevent regression (bug won't come back)
- [ ] ✅ Edge cases tested
- [ ] ✅ Error conditions tested
- [ ] ✅ All tests pass (`npm run test`)
- [ ] ✅ Coverage meets 85% minimum (`npm run test:coverage`)
- [ ] ✅ Coverage did not decrease from baseline
- [ ] ✅ TypeScript compiles (`npx tsc --noEmit`)
- [ ] ✅ Build succeeds (`npm run build`)
- [ ] ✅ (Performance fixes only) Benchmark shows improvement

### Zero-Bug Production Strategy

**This project follows a strict zero-bug policy:**

1. **Every bug fix must include tests** - No exceptions
2. **Tests must prevent regression** - Fix once, never see again
3. **Benchmarks for performance fixes** - Prove the optimization works
4. **Manual testing for UI changes** - Browser verification required

**Failure to include tests will result in PR rejection.**

**For detailed testing workflows**: See [.claude/workflows/testing-workflow.md](.claude/workflows/testing-workflow.md) (to be created)

---

## Project Overview

**Moneto** is a sophisticated family expense tracking and financial management application designed for multi-user household budgeting with AI-powered transaction categorization.

Multi-user household managing joint and individual finances with intelligent categorization and analytics.

### Key Features

AI-powered classification (Gemini 2.5 Flash), cash flow visualization (Sankey diagrams), multi-bank import (7+ Portuguese banks), tag-based metadata, budget tracking, multi-user support, dark mode, Portuguese-first UI.

### Current Status

✅ Production-ready with: ML-ready taxonomy (273 categories), AI classification, 4,679 transactions (99.96% success), Vitest/Playwright tests, GitHub Actions CI/CD, Zod validation, CSRF protection, feature-based architecture.

For tracked issues: [Known Issues](docs/KNOWN_ISSUES.md)

---

## Architecture Decision Records

**Location**: `docs/archive/architecture/adr/`

### ADR-001: Wealth Progression System (Not Just Expense Tracking)

**Decision**: System designed as wealth progression system, not just expense tracker.
**Key Principles**: Build financial self-awareness, reduce anxiety/shame, emphasize long-term trends, support individual and shared finances.
**Developer Impact**: Explains why we use flexible tags, provide AI reasoning, emphasize visual flow, and allow transaction editing.

**Full Details**: [ADR-001.md](docs/archive/architecture/adr/ADR-001.md)

### ADR-002: Money Movements as Primary Source of Truth

**Decision**: Treat money movements (transactions) as primary source of financial truth.
**Critical Distinction**: External movements (income/expenses) vs Internal transfers (between user's accounts).
**Developer Rules**: Never auto-delete transactions, treat categorization as suggestions, support easy editing, distinguish transfers in analytics.

**Full Details**: [ADR-002.md](docs/archive/architecture/adr/ADR-002.md)

---

## Quick Reference

### Common Commands

**Dev**: `npm run dev` (localhost:3000), `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e`

**DB**: `npx prisma studio` (localhost:5555), `npx prisma db push`, `npx prisma migrate dev`

**Scripts**: `node scripts/backup-database.js`, `node prisma/seed-taxonomy-v4.js`

### Environment Variables

`DATABASE_URL` (Neon PostgreSQL), `JWT_SECRET` (min 32 chars), `GEMINI_API_KEY` (AI), `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (rate limiting)

### Key Endpoints

Auth (`POST /api/auth`), Transactions (`GET|POST|PATCH|DELETE`), AI Classify, Categories, Rules, Cash Flow

**Full API**: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)

### Important URLs

- **Production**: https://moneto.vercel.app
- **Vercel Dashboard**: https://vercel.com/your-username-projects/moneto
- **Neon Console**: https://console.neon.tech
- **GitHub Repo**: https://github.com/your-username/moneto
- **Issues**: https://github.com/your-username/moneto/issues

---

## Documentation Index

### Current Status

**Auto-Generated Status** (run manually before commits):

- **Current Work:** `.claude/status/current-work.json` - Generated by `node .claude/hooks/generate-status.js`
- **Documentation Health:** `.claude/status/doc-health.json` - Generated weekly by `node .claude/hooks/metrics-tracker.js`
- **Drift Report:** `.claude/status/drift-report.json` - Generated weekly by `node .claude/hooks/drift-detection.js`
- **Dashboard:** [.claude/status/README.md](.claude/status/README.md) - Human-readable status overview

**Historical Status:**

- **Changelog:** [docs/CHANGELOG.md](docs/CHANGELOG.md) - Full version history
- **Learning Summaries:** `.claude/learnings/2026-Q1/` - Weekly aggregations and insights
- **Quarterly Archives:** `.claude/learnings/archive/` - Compressed quarterly summaries

### Core Documentation

- **[Architecture](docs/ARCHITECTURE.md)** - System architecture, tech stack, directory structure, data flow
- **[Database Schema](docs/DATABASE.md)** - 13 models, ID-based category taxonomy (273 entries), tag system
- **[API Reference](docs/API_REFERENCE.md)** - All endpoints, authentication, CRUD operations, AI services
- **[Component Architecture](docs/COMPONENTS.md)** - Components, utilities, file references

### Development Documentation

- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Setup, common tasks, best practices, code conventions
- **[Security](docs/SECURITY.md)** - Security issues, best practices, incident response
- **[Known Issues](docs/KNOWN_ISSUES.md)** - Issue tracking by priority

### Specialized Documentation

- **[Multi-Environment Strategy](docs/MULTI_ENVIRONMENT_STRATEGY.md)** - Deployment tiers, $0/month cost
- **[Docker Deployment](docs/DOCKER_DEPLOYMENT.md)** - Container setup and optimization
- **[API Versioning](docs/API_VERSIONING.md)** - URL-based versioning, deprecation warnings
- **[Backup & Restore Strategy](docs/BACKUP_RESTORE_STRATEGY.md)** - Automated daily backups (30-day retention)
- **[Refactoring Guide](docs/REFACTORING_GUIDE.md)** - Feature-based architecture
- **[CSRF Protection](docs/CSRF_PROTECTION.md)** - Double Submit Cookie pattern
- **[Upstash Setup](docs/UPSTASH_SETUP.md)** - Redis rate limiting on free tier

---

## Getting Help

**For AI Agents:** Read [AI Agent Workflow Rules](#-mandatory-ai-agent-workflow-rules) first. NEVER push to `main`/`develop`, ALWAYS use feature branches and create PRs.

**For Developers:**

- **Issues**: https://github.com/your-username/moneto/issues
- **Security**: Create private security advisory on GitHub
- **Questions**: Check [Documentation Index](#documentation-index) first

---

## Changelog

| Date       | Version | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-12 | 2.30    | **🧪 Mandatory Testing Requirements + Coverage Enforcement**: Added comprehensive Testing Requirements section to CLAUDE.md enforcing zero-bug production strategy. **Policy**: All bug fixes and code changes MUST include tests before completion - no exceptions. **Coverage**: Enforced 85% minimum coverage threshold (statements, functions, lines) with 80% branch coverage. **New Section**: Testing Requirements with protocols for unit tests, integration tests, benchmarks, verification checklists, and coverage requirements. **Testing Tools**: Created `lib/queries/test-utils.tsx` with React Query testing helpers (createWrapper, createTestQueryClient, mockFetch). **Framework**: Vitest + @testing-library/react for unit/integration, Playwright for E2E. **Impact**: Prevents future bugs through regression testing, ensures code quality through TDD + coverage enforcement, provides performance validation through benchmarks. Completed Bug #1-#5 tests. |
| 2026-02-11 | 2.29    | **✅ Performance Optimization - Auto-Validation Hooks + Critical Context**: Implemented automated TypeScript validation and added 5 critical documentation sections based on insights analysis of 51 sessions (250 hours). **Hook**: Added `PostToolUse` hook to auto-run `tsc --noEmit` after every Edit/Write operation - catches TypeScript errors immediately instead of at build time. **New Sections**: (1) Rate Limit Awareness - commit incrementally to prevent lost work; (2) Project Stack - mandatory build verification steps; (3) Git Workflow - branch strategy and commit protocols; (4) Task Completion - prevent forgotten instructions; (5) Server & Dev Environment - UI verification checklist. **Impact**: Addresses 35 buggy code instances, 10+ rate limit issues, and task tracking failures.                                                                                                                                                                |
| 2026-02-05 | 2.28    | **⚠️ Workflow Exception Protocol Clarification**: Updated Exception Handling section with mandatory call-and-response protocol to prevent future workflow violations. **Background**: On 2026-02-05, AI agent pushed 8 commits directly to main during emergency production fixes (database backup failures, transaction creation bugs, pagination performance issues). Agent incorrectly assumed "GO GO GO" = permission. **Changes**: Added explicit confirmation requirement - AI MUST ask "Should I push directly to main? If yes, please respond with: 'commit directly to main'" and WAIT for exact phrase. Added examples of correct/incorrect behavior. **Related**: See Issue #117 for incident documentation. **Status**: All emergency fixes were valid and production is stable.                                                                                                                                                                                          |
| 2026-02-04 | 2.27    | **✅ Filter Improvements & Bank Normalization (Issues #98, #96)**: Deployed to production. **Issue #98 (PR #103)**: Sort all filter dropdowns alphabetically using `localeCompare()` - Origin, Bank, Major Category, Category filters now sorted for better UX. **Issue #96 (PR #104)**: Eliminate duplicate banks caused by casing variations - created `getUniqueBanks()` helper, normalized bank names to canonical form, applied normalization in filtering. **Testing**: ✅ 90/90 tests passed, linting passed, preview verified. **Production**: Both fixes deployed successfully to https://moneto.vercel.app/. **Impact**: Improved filter usability, eliminated confusion from duplicate bank entries.                                                                                                                                                                                                                                                                       |
| 2026-02-03 | 2.26    | **🎉 Issue #36 - State Management Migration Phase 2 COMPLETE (PR #88)**: Migrated all remaining features to TanStack Query (2,873 lines total). **Transactions** (789 lines): 6 TanStack Query hooks, removed fetchTransactions() calls, fixed property names. **Review** (1,062 lines): Added useReviewTransactions() + useReviewAction(), removed local ReviewTransaction type, fixed type compatibility (flagged→isFlagged). **CashFlow** (1,022 lines): Added useCashFlowData() + useBanks(), removed 3 useEffect hooks, maintained UI state. **Infrastructure**: Added duplicateOf field to Transaction interface. **Build**: ✅ Compiled successfully (7.4s). All core features now use TanStack Query.                                                                                                                                                                                                                                                                         |
| 2026-02-03 | 2.25    | **🚀 Issue #36 - State Management Migration Phase 1 + Bug Fixes (PR #88)**: Successfully migrated Rules and Stats features to TanStack Query. **Infrastructure**: Added `useApplyRulesToPending()` and `useCreateTransaction()` mutations. **Rules Feature**: Migrated to `useRules()`, `useCreateRule()`, `useDeleteRule()` with automatic caching and optimistic updates. **Stats Feature**: Migrated to `useTransactions()` with updated `useStats` hook. **Bug Fixes**: ✅ #95 - Fixed category filter subcategories. ✅ #100 - Added keyboard navigation to CategorySelector (Arrow keys + Enter). ✅ #93 - Improved Add Transaction dialog layout, removed Balance/Status fields, fixed z-index issues. **Build**: ✅ Compiled successfully (8.5s).                                                                                                                                                                                                                             |

> **For older versions (v2.24 and earlier)**: See [docs/CHANGELOG.md](docs/CHANGELOG.md)

---

**End of Guide**

_This document is maintained alongside the codebase. When making significant changes, update this file accordingly._

_For detailed technical information, see the [Documentation Index](#documentation-index)._
