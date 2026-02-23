# Task Breakdown and Dependencies - Moneto

> **Generated**: 2026-01-27
> **Branch**: feature/issue-48-unit-tests
> **DevOps Score**: 6.5/10 (Target: 8.0/10)

---

## Executive Summary

**Total Issues**: 25 open GitHub issues

- **Critical (P0)**: 0 issues ✅
- **High (P1)**: 2 issues (#26 CSRF, #42 xlsx vulnerabilities)
- **Medium (P2)**: 9 issues (architecture, tech debt)
- **Features**: 12 issues (UX, performance, features)
- **In Progress**: Issue #48 (DevOps improvements - 90% complete)

**Completed Recently**: 13 issues closed (#21-25, #27-32, #40, #42, #44, #47)

---

## Current State (What's Done)

### ✅ Issue #48: DevOps Improvements (90% Complete)

**Branch**: feature/issue-48-unit-tests
**Status**: Ready for PR to develop

**Completed**:

- ✅ Unit tests: 29/29 passing (format, validation, parser)
- ✅ Test coverage reporting with @vitest/coverage-v8
- ✅ Prettier: Code formatting configured
- ✅ Husky + lint-staged: Pre-commit hooks working
- ✅ commitlint: Conventional commit enforcement
- ✅ ESLint v9: Security plugin with 12 rules
- ✅ CI pipeline: Format checks + coverage reporting
- ✅ Documentation: DEVOPS_GAPS_ANALYSIS.md + DEVOPS_IMPROVEMENTS_SUMMARY.md

**Remaining for Issue #48**:

- [ ] Create PR from feature/issue-48-unit-tests → develop
- [ ] Merge PR (requires 1 review)
- [ ] Close Issue #48

**Dependencies**: None (standalone)

---

## Priority 0: Critical (Immediate Action Required)

### ✅ ALL P0 ISSUES RESOLVED

**Previously completed**:

- ✅ #21: Remove dev token bypass (resolved)
- ✅ #22: Remove JWT fallback (resolved)
- ✅ #44: CSRF 403 errors (resolved)
- ✅ #47: CI DIRECT_URL variable (resolved)

---

## Priority 1: High (Fix Within Sprint)

### 🔴 Issue #26: Implement CSRF Protection

**Status**: ⚠️ CRITICAL - All API routes vulnerable
**Effort**: 2-4 hours
**Priority**: P1

**Tasks**:

1. [ ] Implement Double Submit Cookie pattern
2. [ ] Add CSRF token generation endpoint
3. [ ] Update all POST/PATCH/DELETE API routes
4. [ ] Update frontend to include CSRF tokens
5. [ ] Add CSRF token validation middleware
6. [ ] Test CSRF protection on all routes
7. [ ] Update documentation

**Dependencies**:

- Blocks: Production deployment safety
- Related: #25 (CSP headers - already done)

**Files to modify**:

- `lib/csrf.ts` (new)
- `middleware.ts` (update)
- All API routes with mutations
- Frontend fetch utilities

**Documentation**: [CSRF_PROTECTION.md](docs/CSRF_PROTECTION.md) exists but not implemented

---

### 🟡 Issue #42: Migrate from xlsx to exceljs

**Status**: ⚠️ High severity vulnerabilities in xlsx
**Effort**: 4-6 hours
**Priority**: P1 (security)

**Tasks**:

1. [ ] Install exceljs package
2. [ ] Create new exceljs parser in lib/parsers.ts
3. [ ] Update all 7 bank parsers to use exceljs
4. [ ] Run tests to verify parsing still works
5. [ ] Update file upload component
6. [ ] Remove xlsx package
7. [ ] Run npm audit to verify vulnerability resolved

**Dependencies**:

- Requires: Test framework (#27 - done ✅)
- Blocks: Security audit passing
- Related: #24 (Zod validation - done ✅)

**Files to modify**:

- `package.json` (remove xlsx, add exceljs)
- `lib/parsers.ts` (rewrite Excel parser)
- `lib/parsers/...` (update all bank parsers)
- Tests: `lib/parsers.test.ts`

**Risk**: Excel parsing logic is bank-specific and complex

---

### 🟢 Issue #48: Complete and Merge DevOps Improvements

**Status**: ✅ 90% done, needs PR merge
**Effort**: 30 minutes
**Priority**: P1 (unblock future work)

**Tasks**:

1. [ ] Create PR: feature/issue-48-unit-tests → develop
2. [ ] Get 1 review approval
3. [ ] Merge PR
4. [ ] Close Issue #48
5. [ ] Delete feature branch

**Dependencies**:

- Blocks: All future development (establishes DevOps baseline)
- Blocks: Issue #28 completion (shared workflow)

**PR Description Template**:

```markdown
## Summary

DevOps maturity improvements for Issue #48

## Changes

- Added Prettier, Husky, lint-staged, commitlint
- Added ESLint security plugin (12 rules)
- Fixed 29 unit tests (format, validation, parser)
- Added test coverage reporting
- Enhanced CI with format checks and coverage
- Created comprehensive DevOps gap analysis

## Metrics

- DevOps Score: 4.5/10 → 6.5/10 (+44%)
- Tests: 0 → 29 passing
- Pre-commit hooks: 0 → 2
- Security rules: 0 → 12

## Breaking Changes

None

## Documentation

- DEVOPS_GAPS_ANALYSIS.md
- DEVOPS_IMPROVEMENTS_SUMMARY.md
- Updated CLAUDE.md (v2.15)
```

---

### 🟣 Owner's Production Monitoring Tasks

**Status**: ⚠️ Not started (from OWNER_RESPONSIBILITY.md)
**Effort**: 15 minutes total
**Priority**: P1 (production visibility)

**Tasks**:

1. [ ] Enable Dependabot (1 min)
   - Go to GitHub Settings → Security → Enable Dependabot
2. [ ] Sign up for Sentry (5 min) 🔴 MOST IMPORTANT
   - Sign up at https://sentry.io/signup/
   - Get DSN key
   - Add to .env.local: `NEXT_PUBLIC_SENTRY_DSN=...`
   - Run: `npx @sentry/wizard@latest -i nextjs`
3. [ ] Set up UptimeRobot (5 min)
   - Sign up at https://uptimerobot.com/signUp
   - Add monitor for production URL
4. [ ] Run npm audit (30 sec)
   - Run: `npm audit`
   - Fix: `npm audit fix` (if needed)

**Dependencies**:

- Independent tasks (can run in parallel)
- Impact: Production monitoring & error visibility

**Cost**: $0 (100% free)

---

## Priority 2: Medium (Plan for Next Quarter)

### Architecture & Tech Debt

#### Issue #28: Complete page.tsx Refactoring

**Status**: 🟡 Architecture done, Stats feature pending
**Effort**: 4-6 hours (Stats feature completion)
**Priority**: P2

**Current State**:

- ✅ Shared hooks (useAuth, useNotification, useTheme)
- ✅ Transactions feature (fully implemented)
- ✅ Rules feature (PR #41 merged)
- 🔨 Stats feature (placeholder + useStats hook exists)
- ⏳ Settings feature (architecture only)
- ⏳ Review feature (architecture only)

**Tasks for Stats Feature**:

1. [ ] Implement useStats hook data processing
2. [ ] Create Recharts visualizations (line, pie, bar)
3. [ ] Add key metrics cards with month-over-month
4. [ ] Build financial insights panel
5. [ ] Implement date range and origin filters
6. [ ] Add top transactions sections
7. [ ] Create responsive layout

**Dependencies**:

- Requires: Issue #48 merged (establishes workflow)
- Blocks: Issue #36 (state management refactor)
- Related: Issue #6 (virtualization for performance)

**Files**:

- `features/stats/hooks/useStats.ts` (complete implementation)
- `features/stats/components/...` (create visualizations)
- `features/stats/index.tsx` (wire up components)

---

#### Issue #2 & #33: Complete Category ID Migration

**Status**: 🟡 Dual-write pattern exists
**Effort**: 6-8 hours
**Priority**: P2 (tech debt)

**Current State**:

- ID-based taxonomy: ✅ Complete (273 entries)
- Name-based taxonomy: 🔴 Still in use (dual-write)
- Migration script: ✅ Exists

**Tasks**:

1. [ ] Verify all transactions use category IDs
2. [ ] Update API routes to only accept/return IDs
3. [ ] Remove category name fields from database
4. [ ] Update frontend to use IDs only
5. [ ] Update rules engine to use IDs
6. [ ] Remove dual-write logic from codebase
7. [ ] Run database migration
8. [ ] Update tests

**Dependencies**:

- Blocks: ML integration (simpler data structure)
- Blocks: Issue #36 (state management - cleaner data flow)
- Related: Issue #33 (same fix)

**Risk**: Breaking change for existing data

---

#### Issue #3 & #36: Implement Proper State Management

**Status**: 🟡 Currently using useState/prop drilling
**Effort**: 8-12 hours
**Priority**: P2 (improves developer experience)

**Proposed Solution**:

- **Server State**: TanStack Query (React Query)
- **Client State**: Zustand
- **Form State**: React Hook Form (already partially used)

**Tasks**:

1. [ ] Install TanStack Query + Zustand
2. [ ] Create query hooks for all API endpoints
3. [ ] Set up Zustand stores for client state (filters, UI state)
4. [ ] Refactor Transactions feature to use queries
5. [ ] Refactor Rules feature to use queries
6. [ ] Refactor Stats feature to use queries
7. [ ] Remove prop drilling from shared hooks
8. [ ] Add optimistic updates for mutations
9. [ ] Update tests

**Dependencies**:

- Requires: Issue #28 complete (modular architecture)
- Requires: Issue #2 complete (simpler data model)
- Benefits: All features (cleaner data flow)

**Benefits**:

- Automatic caching and revalidation
- Optimistic updates
- Better loading/error states
- Reduced prop drilling
- Better performance

---

#### Issue #34: Implement Audit Logging

**Status**: 🔴 No audit trail
**Effort**: 4-6 hours
**Priority**: P2 (security + compliance)

**Tasks**:

1. [ ] Create audit log database model
2. [ ] Design audit log schema (user, action, resource, timestamp, changes)
3. [ ] Create audit logging middleware
4. [ ] Add audit logs to transaction mutations
5. [ ] Add audit logs to rule mutations
6. [ ] Add audit logs to category mutations
7. [ ] Create audit log viewer UI (admin only)
8. [ ] Add audit log filtering and search

**Dependencies**:

- Independent (can implement anytime)
- Benefits: Debugging, compliance, user trust

**Database Schema**:

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // CREATE, UPDATE, DELETE
  resource  String   // Transaction, Rule, Category
  resourceId String
  changes   Json     // Before/after values
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
}
```

---

#### Issue #35: Implement Soft Deletes

**Status**: 🔴 Hard deletes (data loss risk)
**Effort**: 3-4 hours
**Priority**: P2 (data safety)

**Tasks**:

1. [ ] Add deletedAt field to Transaction model
2. [ ] Add deletedAt field to Rule model
3. [ ] Add deletedAt field to Category model (if needed)
4. [ ] Create database migration
5. [ ] Update all delete mutations to soft delete
6. [ ] Update all queries to filter out deleted records
7. [ ] Add "Restore" functionality to UI
8. [ ] Add "Permanently Delete" admin function
9. [ ] Update tests

**Dependencies**:

- Requires: Database migration
- Benefits: Data recovery, safer operations

**Risk**: Existing deleted data cannot be recovered

---

#### Issue #37: Structured Logging

**Status**: 🔴 Using console.log
**Effort**: 4-6 hours
**Priority**: P2 (observability)

**Proposed Solution**: Pino (fast, structured)

**Tasks**:

1. [ ] Install pino + pino-pretty
2. [ ] Create logger utility (lib/logger.ts)
3. [ ] Replace all console.log with logger
4. [ ] Add log levels (debug, info, warn, error)
5. [ ] Add structured context (userId, requestId, etc.)
6. [ ] Configure production log output (JSON)
7. [ ] Configure development log output (pretty)
8. [ ] Add log rotation strategy

**Dependencies**:

- Benefits: Issue #38 (observability stack)
- Benefits: Production debugging

---

#### Issue #38: Observability Stack

**Status**: 🔴 No monitoring
**Effort**: 6-8 hours
**Priority**: P2 (production visibility)

**Proposed Solution**:

- Health checks endpoint
- Prometheus metrics (if needed later)
- OpenTelemetry APM (optional)

**Tasks**:

1. [ ] Create /api/health endpoint
2. [ ] Add basic health checks (database, Redis)
3. [ ] Add response time tracking
4. [ ] Add error rate tracking
5. [ ] Add custom metrics (transactions created, AI classifications, etc.)
6. [ ] Set up APM (optional - Sentry already provides this)
7. [ ] Create monitoring dashboard

**Dependencies**:

- Requires: Issue #37 (structured logging)
- Requires: Owner tasks (Sentry, UptimeRobot)

---

## Features & Enhancements

### Performance Improvements

#### Issue #5: Lazy Load Visualization Libraries

**Status**: 🔴 Not implemented
**Effort**: 2-3 hours
**Priority**: Low (optimization)

**Libraries to Lazy Load**:

- @nivo/sankey (large)
- recharts (large)
- @xyflow/react (large)

**Tasks**:

1. [ ] Use dynamic imports for visualization components
2. [ ] Add loading states
3. [ ] Measure bundle size improvement
4. [ ] Update Stats feature to lazy load charts

**Dependencies**:

- Requires: Issue #28 complete (Stats feature)

**Expected Impact**: 20-30% smaller initial bundle

---

#### Issue #6: Virtualization for Transactions List

**Status**: 🔴 Not implemented
**Effort**: 4-6 hours
**Priority**: Medium (performance)

**Problem**: Rendering 10,000+ transactions is slow

**Proposed Solution**: TanStack Virtual (react-virtual)

**Tasks**:

1. [ ] Install @tanstack/react-virtual
2. [ ] Refactor transactions list to use virtualization
3. [ ] Test with large datasets (10k+ transactions)
4. [ ] Measure performance improvement
5. [ ] Update pagination logic (virtual scrolling vs pages)

**Dependencies**:

- Requires: Issue #28 complete (Transactions feature)
- Related: Issue #32 (cursor pagination - done ✅)

**Expected Impact**: 10x faster rendering for large datasets

---

### Feature Additions

#### Issue #7: Recurring Transaction Detection

**Status**: 🔴 Not implemented
**Effort**: 6-8 hours
**Priority**: Medium (valuable feature)

**Use Cases**:

- Netflix, Spotify (monthly subscriptions)
- Gym membership
- Rent/mortgage
- Utility bills

**Tasks**:

1. [ ] Design recurring transaction detection algorithm
2. [ ] Create database model for recurring patterns
3. [ ] Implement detection logic (amount + frequency)
4. [ ] Add "Mark as Recurring" UI
5. [ ] Create recurring transactions dashboard
6. [ ] Add forecasting based on recurring transactions
7. [ ] Add notifications for missed recurring transactions

**Dependencies**:

- Requires: Large dataset (6+ months of data)
- Benefits: Issue #8 (budget alerts)

---

#### Issue #8: Budget Alerts and Notifications

**Status**: 🟡 Budget model exists, UI pending
**Effort**: 4-6 hours
**Priority**: Medium (valuable feature)

**Current State**:

- Budget database model: ✅ Exists
- Budget UI: ⏳ Basic only
- Notifications: 🔴 None

**Tasks**:

1. [ ] Design budget alert system
2. [ ] Create notification service
3. [ ] Add budget progress tracking
4. [ ] Implement alert triggers (80%, 100%, 120%)
5. [ ] Add email notifications (optional)
6. [ ] Create notification UI
7. [ ] Add budget alert settings

**Dependencies**:

- Requires: Budget model (exists ✅)
- Benefits: User engagement

---

#### Issue #9: Excel Export

**Status**: 🟡 CSV exists, Excel pending
**Effort**: 2-3 hours
**Priority**: Low (nice-to-have)

**Tasks**:

1. [ ] Use exceljs for export (after Issue #42)
2. [ ] Create Excel export endpoint
3. [ ] Add Excel download button to UI
4. [ ] Support filtering before export
5. [ ] Add formatting (headers, currency, dates)

**Dependencies**:

- Requires: Issue #42 (exceljs migration)

---

#### Issue #10: Multi-Currency Support

**Status**: 🔴 Not implemented
**Effort**: 12-16 hours
**Priority**: Low (complex, niche use case)

**Use Cases**:

- Travel expenses
- Foreign investments
- International freelancing

**Tasks**:

1. [ ] Add currency field to Transaction model
2. [ ] Add exchange rate tracking
3. [ ] Create currency conversion API
4. [ ] Update all financial calculations
5. [ ] Add currency selector to UI
6. [ ] Display amounts in multiple currencies
7. [ ] Add exchange rate history

**Dependencies**:

- Requires: Issue #2 (clean data model)
- Requires: External API (exchange rates)

**Risk**: High complexity, low user demand

---

### UX Improvements

#### Issue #11: Rotate JWT Secret

**Status**: 🟡 Manual task
**Effort**: 10 minutes
**Priority**: High (security hardening)

**Tasks**:

1. [ ] Generate new 32+ char secret
2. [ ] Update production .env
3. [ ] Restart application
4. [ ] Test authentication still works
5. [ ] Document secret rotation process

**Dependencies**:

- Independent (production task)

---

#### Issue #13: Improve Mobile Responsiveness

**Status**: 🔴 Mobile UX needs improvement
**Effort**: 6-8 hours
**Priority**: Medium (user experience)

**Areas to Improve**:

- Transaction list (cramped)
- Filters (hard to use on mobile)
- Forms (small touch targets)
- Cash Flow chart (too small)

**Tasks**:

1. [ ] Audit mobile experience on real devices
2. [ ] Redesign transaction list for mobile
3. [ ] Create mobile-friendly filters (bottom sheet)
4. [ ] Improve form touch targets
5. [ ] Make charts responsive
6. [ ] Add mobile-specific gestures (swipe to delete, etc.)
7. [ ] Test on multiple devices/browsers

**Dependencies**:

- Requires: Issue #28 complete (modular components)

---

#### Issue #14: Keyboard Shortcuts

**Status**: 🔴 Not implemented
**Effort**: 4-6 hours
**Priority**: Low (power users)

**Proposed Shortcuts**:

- j/k: Navigate transactions
- c: Categorize selected transaction
- f: Focus filter input
- n: New transaction
- /: Focus search
- ?: Show shortcuts help

**Tasks**:

1. [ ] Install keyboard shortcut library
2. [ ] Implement navigation shortcuts
3. [ ] Implement action shortcuts
4. [ ] Create shortcuts help modal
5. [ ] Add visual indicators for shortcut keys
6. [ ] Handle conflicts with browser shortcuts

**Dependencies**:

- Requires: Issue #28 complete (modular features)

---

#### Issue #15: Undo/Redo for Transaction Edits

**Status**: 🔴 Not implemented
**Effort**: 6-8 hours
**Priority**: Medium (reduces user anxiety)

**Use Cases**:

- Bulk edits gone wrong
- Accidental deletions
- Categorization mistakes

**Tasks**:

1. [ ] Design undo stack data structure
2. [ ] Implement undo/redo logic
3. [ ] Add undo/redo to transaction mutations
4. [ ] Create undo/redo UI (top bar)
5. [ ] Add keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
6. [ ] Add undo history viewer
7. [ ] Set undo stack limits (prevent memory issues)

**Dependencies**:

- Requires: Issue #36 (state management)
- Benefits: User confidence

---

### Bug Fixes

#### Issue #16: Add Transaction Form Missing Notes Field

**Status**: 🔴 Bug
**Effort**: 30 minutes
**Priority**: Low (minor bug)

**Tasks**:

1. [ ] Add Notes field to Add Transaction form
2. [ ] Verify Notes saves correctly
3. [ ] Test form validation

**Dependencies**: None (quick fix)

---

#### Issue #17: Search Subcategories and Auto-Populate

**Status**: 🔴 Enhancement
**Effort**: 2-3 hours
**Priority**: Low (UX improvement)

**Tasks**:

1. [ ] Add search to category selector
2. [ ] Enable searching subcategories
3. [ ] Auto-populate parent category when subcategory selected
4. [ ] Add keyboard navigation to search results

**Dependencies**:

- Related: Issue #2 (category ID migration)

---

#### Issue #18: Date Field Manual Editing

**Status**: 🔴 Bug
**Effort**: 1-2 hours
**Priority**: Low (UX bug)

**Tasks**:

1. [ ] Replace date picker with editable input
2. [ ] Add date format validation
3. [ ] Keep date picker as optional UI
4. [ ] Test date parsing and formatting

**Dependencies**: None (quick fix)

---

#### Issue #19: Convert Portuguese to English

**Status**: 🔴 Inconsistent i18n
**Effort**: 2-3 hours
**Priority**: Low (cleanup)

**Tasks**:

1. [ ] Audit all UI text
2. [ ] Create i18n strings file
3. [ ] Replace hardcoded Portuguese text
4. [ ] Support language switching (optional)

**Dependencies**: None (cleanup task)

---

#### Issue #20: Origin Field Duplicate Values

**Status**: 🔴 Bug (data inconsistency)
**Effort**: 1-2 hours
**Priority**: Medium (data quality)

**Problem**: Both 'Couple' and 'Comum' exist for same meaning

**Tasks**:

1. [ ] Decide on canonical value ('Couple' or 'Comum')
2. [ ] Create data migration script
3. [ ] Update all 'Comum' → 'Couple' (or vice versa)
4. [ ] Update validation schemas
5. [ ] Update UI dropdowns
6. [ ] Run migration on production

**Dependencies**:

- Requires: Database migration
- Requires: Issue #24 validation (done ✅)

---

## Dependency Graph

```
Legend:
→ Blocks
⟿ Benefits
⊙ Related

Current Work:
┌─────────────────────────────────────┐
│ Issue #48 (DevOps) - 90% Complete   │
│ → Create PR → Merge → Close         │
└─────────────────────────────────────┘
            ↓ (unblocks future work)

High Priority (P1):
┌─────────────────────────────────────┐
│ Issue #26: CSRF Protection          │ ← CRITICAL
│ → All API routes vulnerable         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #42: Migrate to exceljs       │ ← Security
│ ⟿ Issue #9 (Excel export)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Owner's Tasks (15 min)              │ ← Production Monitoring
│ - Sentry, Dependabot, UptimeRobot   │
│ ⟿ Issue #38 (observability)         │
└─────────────────────────────────────┘

Medium Priority (P2):
┌─────────────────────────────────────┐
│ Issue #28: Complete page.tsx        │
│ (Stats feature implementation)      │
│ → Issue #36 (state management)      │
│ ⟿ Issue #5, #6 (performance)        │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Issue #2/#33: Category ID Migration │
│ → Issue #36 (cleaner data)          │
│ ⟿ ML integration (simpler model)    │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Issue #3/#36: State Management      │
│ (TanStack Query + Zustand)          │
│ ⟿ All features (better DX)          │
└─────────────────────────────────────┘

Tech Debt (P2):
┌─────────────────────────────────────┐
│ Issue #34: Audit Logging            │ Independent
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #35: Soft Deletes             │ Independent
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #37: Structured Logging       │
│ → Issue #38 (observability)         │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Issue #38: Observability Stack      │
│ (Health checks, metrics)            │
└─────────────────────────────────────┘

Features (Lower Priority):
┌─────────────────────────────────────┐
│ Issue #5: Lazy Load Charts          │
│ ⊙ Issue #28 (Stats feature)         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #6: Virtualization            │
│ ⊙ Issue #28 (Transactions feature)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #7: Recurring Transactions    │
│ ⟿ Issue #8 (budget alerts)          │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Issue #8: Budget Alerts             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #9: Excel Export              │
│ ⊙ Issue #42 (exceljs)               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #10: Multi-Currency           │ Complex
│ ⊙ Issue #2 (clean data model)       │
└─────────────────────────────────────┘

UX Improvements:
┌─────────────────────────────────────┐
│ Issue #11: Rotate JWT Secret        │ Manual (10 min)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #13: Mobile Responsiveness    │
│ ⊙ Issue #28 (modular components)    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #14: Keyboard Shortcuts       │
│ ⊙ Issue #28 (modular features)      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #15: Undo/Redo                │
│ ⊙ Issue #36 (state management)      │
└─────────────────────────────────────┘

Bug Fixes (Quick Wins):
┌─────────────────────────────────────┐
│ Issue #16: Add Notes Field          │ 30 min
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #17: Search Subcategories     │ 2-3 hours
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #18: Date Field Editing       │ 1-2 hours
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #19: i18n Consistency         │ 2-3 hours
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Issue #20: Origin Field Duplicates  │ 1-2 hours
└─────────────────────────────────────┘
```

---

## Recommended Sprint Plan

### Sprint 1 (Current): Complete DevOps Foundation

**Goal**: Merge Issue #48, establish production monitoring
**Duration**: 1-2 days

**Tasks**:

1. ✅ Merge Issue #48 PR
2. ⏳ Owner: Enable Dependabot, Sentry, UptimeRobot (15 min)
3. ⏳ Implement Issue #26 (CSRF protection) - 2-4 hours
4. ⏳ Quick wins: Issues #16, #18, #20 (bug fixes) - 3 hours

**Outcome**: Secure foundation + production visibility

---

### Sprint 2: Security & Performance

**Goal**: Resolve security issues, improve data quality
**Duration**: 1 week

**Tasks**:

1. ⏳ Issue #42: Migrate to exceljs (4-6 hours)
2. ⏳ Issue #11: Rotate JWT secret (10 min)
3. ⏳ Issue #2/#33: Complete category ID migration (6-8 hours)
4. ⏳ Issue #17: Search subcategories (2-3 hours)

**Outcome**: Zero security vulnerabilities + cleaner data model

---

### Sprint 3: Complete page.tsx Refactoring

**Goal**: Finish Stats feature, improve architecture
**Duration**: 1-2 weeks

**Tasks**:

1. ⏳ Issue #28: Complete Stats feature (4-6 hours)
2. ⏳ Issue #36: Implement state management (8-12 hours)
3. ⏳ Issue #5: Lazy load charts (2-3 hours)
4. ⏳ Issue #6: Virtualization (4-6 hours)

**Outcome**: Modular architecture + better performance

---

### Sprint 4: Production Hardening

**Goal**: Observability and reliability
**Duration**: 1 week

**Tasks**:

1. ⏳ Issue #37: Structured logging (4-6 hours)
2. ⏳ Issue #38: Observability stack (6-8 hours)
3. ⏳ Issue #34: Audit logging (4-6 hours)
4. ⏳ Issue #35: Soft deletes (3-4 hours)

**Outcome**: Production-grade observability + data safety

---

### Sprint 5+: Features & UX

**Goal**: User-facing features
**Duration**: Ongoing

**Priority Order**:

1. Issue #7: Recurring transactions (valuable feature)
2. Issue #8: Budget alerts (valuable feature)
3. Issue #13: Mobile responsiveness (UX)
4. Issue #15: Undo/redo (UX)
5. Issue #9: Excel export (convenience)
6. Issue #14: Keyboard shortcuts (power users)
7. Issue #19: i18n cleanup (polish)
8. Issue #10: Multi-currency (niche, complex)

---

## Success Metrics

### DevOps Maturity

- **Current**: 6.5/10
- **Target (Sprint 1)**: 7.0/10 (CSRF + monitoring)
- **Target (Sprint 2)**: 7.5/10 (security resolved)
- **Target (Sprint 4)**: 8.0/10 (observability complete)

### Code Quality

- **Test Coverage**: Track % coverage (target: 70%+)
- **Lint Errors**: 0 (enforced by pre-commit hooks)
- **Security Vulnerabilities**: 0 (enforced by npm audit)
- **Bundle Size**: Track JS bundle size (target: < 500KB)

### User Experience

- **Mobile Responsiveness**: Lighthouse mobile score 90+
- **Performance**: Page load < 2 seconds
- **Error Rate**: < 0.1% (tracked by Sentry)
- **Uptime**: 99.9% (tracked by UptimeRobot)

---

## Risk Assessment

### High Risk Items

1. **Issue #2 (Category Migration)**: Breaking change, requires careful testing
2. **Issue #42 (Excel Migration)**: Bank parser logic is complex
3. **Issue #10 (Multi-Currency)**: High complexity, low ROI

### Medium Risk Items

1. **Issue #36 (State Management)**: Large refactor, affects all features
2. **Issue #28 (Stats Feature)**: Complex visualizations

### Low Risk Items

1. **Issue #26 (CSRF)**: Well-defined pattern
2. **Bug fixes (#16-20)**: Small, isolated changes
3. **DevOps improvements**: Already tested

---

## Notes

- All task estimates are conservative (include testing + documentation)
- Dependencies assume sequential execution - parallelization possible in some cases
- Quick wins (< 2 hours) are good for context switching between larger tasks
- Production monitoring (Owner's tasks) should be highest priority - currently blind to errors

---

**End of Task Breakdown**
