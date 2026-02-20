# GitHub Issues Roadmap & Dependency Graph

> **Last Updated**: 2026-01-27 12:15 UTC
> **Total Issues**: 26 open (was 28)
> **Purpose**: Task breakdown with dependencies for strategic planning

---

## ✅ Sprint 0: COMPLETE (2026-01-27)

### Completed Issues

#### ✅ #47 - Add DIRECT_URL to GitHub Actions - **CLOSED**

- **Resolved**: 2026-01-27
- **Action**: User added `DIRECT_URL` secret to GitHub repository
- **Impact**: Database schema validation now passes in CI

#### ✅ #42 - xlsx Security Vulnerability - **CLOSED**

- **Resolved**: PR #46 merged to develop (2026-01-27)
- **Changes**: Migrated from `xlsx@0.18.5` to `exceljs@4.4.0`
- **Impact**: 0 vulnerabilities (was 1 high)

#### ✅ #43 - Stats Feature - **MERGED TO MAIN**

- **Resolved**: PR #43 merged to main (2026-01-27)
- **Note**: Merged directly to main, then synced to develop
- **Status**: Stats feature module now in production

### ⚠️ Remaining Issue

#### #48 - Create Unit Test Files

- **Priority**: P2 (Medium)
- **Type**: Testing Infrastructure
- **Status**: **OPEN** - CI currently passes with `passWithNoTests: true` in vitest.config.ts
- **Effort**: 2-4 hours (basic tests)
- **Not Blocking**: CI passes but no actual tests exist yet
- **Dependencies**: None (can start immediately)
- **Tasks**:
  1. Create `lib/parsers.test.ts` with basic tests
  2. Create `lib/formatters.test.ts` with basic tests
  3. Create `lib/validation.test.ts` with basic tests
  4. Remove `passWithNoTests: true` from vitest.config.ts
  5. Verify CI passes with real tests
- **Future Work**: Expand test coverage incrementally

---

## 📊 Current Status Summary

**Sprint 0 Completion**: 3/4 issues resolved (75%)

- ✅ #47 - DIRECT_URL secret
- ✅ #42 - xlsx migration
- ✅ #43 - Stats feature
- ⏳ #48 - Unit tests (non-blocking, can defer)

**Next**: Begin Sprint 1 (Architecture Foundation)

---

## 🏗️ Phase 1: Architecture & Tech Debt (P1)

### #28 - Refactor page.tsx

- **Priority**: P1 (High)
- **Type**: Architecture + Tech Debt
- **Effort**: 2-3 days
- **Blocking**: Clean architecture for future features
- **Dependencies**:
  - Should merge #42 first (security fix)
  - Independent of other issues
- **Tasks**:
  1. ✅ Complete Transactions feature module (done)
  2. ✅ Complete Rules feature module (PR #41 merged)
  3. ⏳ Complete Stats feature module (PR #43)
  4. Create Settings feature module
  5. Create shared hooks and types
  6. Remove original monolithic page.tsx
- **Impact**: Enables parallel feature development

### #24 - Zod Input Validation

- **Priority**: P1 (High - Security)
- **Type**: Security Enhancement
- **Effort**: 1-2 days
- **Dependencies**:
  - Can start after #42 merges
  - Independent of #28
- **Tasks**:
  1. Add Zod validation to auth routes
  2. Add Zod validation to transaction routes
  3. Add Zod validation to category routes
  4. Add Zod validation to rule routes
  5. Add comprehensive error messages
  6. Document validation schemas

---

## 🔧 Phase 2: Infrastructure & DevOps (P2)

### #40 - Multi-Environment Deployment

- **Priority**: P2 (Medium)
- **Type**: DevOps
- **Effort**: 1 day
- **Dependencies**:
  - Requires #47 (DIRECT_URL) to be resolved
  - Should complete after #28 (clean architecture)
- **Tasks**:
  1. Create GitHub environments (dev, staging, production)
  2. Set up Neon database branches
  3. Configure environment-specific secrets
  4. Update deployment workflows
  5. Document deployment process

### #38 - Observability Stack

- **Priority**: P2 (Medium)
- **Type**: DevOps
- **Effort**: 2-3 days
- **Dependencies**:
  - Best done after #40 (multi-environment)
  - Requires #37 (structured logging)
- **Tasks**:
  1. Add health check endpoint
  2. Implement structured logging
  3. Add Prometheus metrics
  4. Set up APM (Application Performance Monitoring)
  5. Create dashboards

### #37 - Structured Logging

- **Priority**: P2 (Medium)
- **Type**: Architecture
- **Effort**: 1 day
- **Dependencies**: Independent
- **Tasks**:
  1. Choose logging library (pino/winston)
  2. Create logger utility
  3. Add structured logging to API routes
  4. Add correlation IDs for request tracking
  5. Configure log levels per environment

---

## 🗄️ Phase 3: Database & State Management (P2)

### #33 - Remove Dual-Write Pattern

- **Priority**: P2 (Medium)
- **Type**: Tech Debt
- **Effort**: 1 day
- **Dependencies**:
  - Requires #2 (category ID migration) to be complete
  - Best done after #28 (refactored architecture)
- **Tasks**:
  1. Verify all code uses category IDs
  2. Remove string-based category lookups
  3. Remove categoryMap constant
  4. Update tests
  5. Clean up type definitions

### #35 - Implement Soft Deletes

- **Priority**: P2 (Medium)
- **Type**: Enhancement
- **Effort**: 2 days
- **Dependencies**:
  - Should complete after #28 (refactored architecture)
  - Requires #34 (audit logging) for proper tracking
- **Tasks**:
  1. Add `deletedAt` field to transactions table
  2. Update Prisma schema
  3. Create migration
  4. Update API routes to filter deleted records
  5. Add "restore" functionality
  6. Update UI to hide deleted records

### #36 - State Management (TanStack Query + Zustand)

- **Priority**: P2 (Medium)
- **Type**: Architecture
- **Effort**: 3-4 days
- **Dependencies**:
  - **CRITICAL**: Must complete after #28 (refactored architecture)
  - Replaces current prop drilling in page.tsx
- **Tasks**:
  1. Install TanStack Query + Zustand
  2. Create query hooks for transactions
  3. Create query hooks for categories/rules/tags
  4. Create Zustand stores for UI state
  5. Migrate features to use new state management
  6. Remove prop drilling from components

### #34 - Audit Logging

- **Priority**: P2 (Medium)
- **Type**: Security
- **Effort**: 2-3 days
- **Dependencies**:
  - Requires #37 (structured logging)
  - Best done after #28 (refactored architecture)
- **Tasks**:
  1. Create audit_logs table
  2. Define audit events (create, update, delete, export)
  3. Add audit middleware
  4. Log all financial data changes
  5. Create audit log viewer UI

---

## 🐛 Phase 4: Bug Fixes (P3)

### #20 - Duplicate Origin Values

- **Priority**: P3 (Low)
- **Effort**: 1 hour
- **Dependencies**: None
- **Tasks**:
  1. Update database to use single value ('Comum')
  2. Update validation to reject 'Couple'
  3. Add migration to normalize existing data

### #18 - Date Field Manual Editing

- **Priority**: P3 (Low)
- **Effort**: 2 hours
- **Dependencies**: Independent
- **Tasks**:
  1. Replace date picker with hybrid component
  2. Allow manual text input with validation
  3. Add date format hints

### #16 - Missing Notes Field in Add Form

- **Priority**: P3 (Low)
- **Effort**: 30 minutes
- **Dependencies**: Independent
- **Tasks**:
  1. Add notes field to AddTransactionForm
  2. Add notes to transaction creation API
  3. Test notes persistence

---

## ✨ Phase 5: Features (P3)

### #17 - Subcategory Search with Auto-Populate

- **Priority**: P3 (Low)
- **Effort**: 1 day
- **Dependencies**:
  - Best done after #28 (refactored architecture)
  - Best done after #36 (state management)
- **Tasks**:
  1. Add search to CategorySelector component
  2. Implement fuzzy search for subcategories
  3. Auto-select parent when subcategory chosen
  4. Add keyboard navigation

### #15 - Undo/Redo for Edits

- **Priority**: P3 (Low)
- **Effort**: 2-3 days
- **Dependencies**:
  - **REQUIRES**: #36 (state management for undo stack)
  - Best done after #28 (refactored architecture)
- **Tasks**:
  1. Implement undo/redo state manager
  2. Track edit history
  3. Add undo/redo UI buttons
  4. Add keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)

### #14 - Keyboard Shortcuts

- **Priority**: P3 (Low)
- **Effort**: 2 days
- **Dependencies**:
  - Best done after #28 (refactored architecture)
- **Tasks**:
  1. Define shortcut key map
  2. Implement keyboard handler hook
  3. Add shortcuts for: add transaction, search, navigate, edit, delete
  4. Create keyboard shortcuts help modal

### #13 - Mobile Responsiveness

- **Priority**: P3 (Low)
- **Effort**: 2-3 days
- **Dependencies**:
  - Best done after #28 (refactored architecture)
- **Tasks**:
  1. Audit mobile breakpoints
  2. Make transaction list responsive
  3. Make cash flow visualization responsive
  4. Make stats charts responsive
  5. Add mobile navigation

### #11 - Rotate JWT Secret

- **Priority**: P3 (Low - Security)
- **Effort**: 1 hour
- **Dependencies**:
  - Should complete after #40 (multi-environment)
- **Tasks**:
  1. Generate new JWT secret (32+ chars)
  2. Update production environment variables
  3. Force user re-authentication
  4. Document secret rotation procedure

### #10 - Multi-Currency Support

- **Priority**: P3 (Low)
- **Effort**: 3-4 days
- **Dependencies**:
  - Best done after #28 (refactored architecture)
  - Requires database schema changes
- **Tasks**:
  1. Add currency field to transactions table
  2. Add exchange rate API integration
  3. Create currency selector component
  4. Update formatters to handle multiple currencies
  5. Update visualizations to convert currencies

### #9 - Export Transactions

- **Priority**: P3 (Low)
- **Effort**: 1-2 days
- **Dependencies**: Independent
- **Tasks**:
  1. Create export API endpoint
  2. Support CSV, XLSX, JSON formats
  3. Add export button to UI
  4. Add date range filter for exports
  5. Add category filter for exports

### #8 - Budget Alerts

- **Priority**: P3 (Low)
- **Effort**: 2-3 days
- **Dependencies**:
  - Requires notification system (not yet implemented)
- **Tasks**:
  1. Create budget_alerts table
  2. Define alert thresholds (50%, 80%, 100%)
  3. Create alert checking job
  4. Add notification system
  5. Create alert preferences UI

### #7 - Recurring Transaction Detection

- **Priority**: P3 (Low)
- **Effort**: 2-3 days
- **Dependencies**:
  - Best done after AI improvements
- **Tasks**:
  1. Create recurring detection algorithm
  2. Identify monthly patterns
  3. Add "recurring" flag to transactions
  4. Create recurring transaction UI
  5. Add auto-categorization for recurring transactions

### #6 - Pagination/Virtualization

- **Priority**: P3 (Low - Performance)
- **Effort**: 1-2 days
- **Dependencies**:
  - Best done after #28 (refactored architecture)
  - Best done after #36 (state management)
- **Tasks**:
  1. Choose virtualization library (react-window/react-virtual)
  2. Update transaction list to use virtualization
  3. Add pagination controls
  4. Update API to support cursor-based pagination
  5. Performance test with 10k+ transactions

### #5 - Lazy Load Visualization Libraries

- **Priority**: P3 (Low - Performance)
- **Effort**: 1 day
- **Dependencies**: Independent
- **Tasks**:
  1. Audit bundle size of visualization libraries
  2. Add dynamic imports for Recharts
  3. Add dynamic imports for Nivo (Sankey)
  4. Add loading states
  5. Measure bundle size improvement

### #3 - State Management Solution

- **Priority**: P3 (Low)
- **Status**: Duplicate of #36
- **Action**: Close as duplicate of #36

### #2 - Category ID Migration

- **Priority**: P3 (Low)
- **Status**: Needs verification
- **Effort**: 1 hour
- **Tasks**:
  1. Verify migration completed
  2. Check all code uses IDs
  3. Close if complete, or fix remaining issues

### #19 - i18n: Portuguese to English

- **Priority**: P3 (Low)
- **Effort**: 1-2 days
- **Dependencies**: Independent
- **Tasks**:
  1. Audit remaining Portuguese text
  2. Create translation file
  3. Update UI strings
  4. Add language switcher (optional)

---

## 📊 Dependency Graph Summary

```
IMMEDIATE (Blockers):
  #47 (DIRECT_URL) ────┐
                       ├──> [Unblocks ALL PRs]
  #48 (Unit Tests) ────┘

READY TO MERGE (After CI):
  #42 (xlsx security) ──> Merge after #47, #48
  #43 (Stats feature) ──> Merge after #47, #48

PHASE 1 (Architecture):
  #28 (Refactor) ──────┐
                       ├──> [Enables clean feature development]
  #24 (Validation) ────┘

PHASE 2 (Infrastructure):
  #47 ──> #40 (Multi-env) ──> #38 (Observability)
                                 ▲
                                 │
  #37 (Logging) ────────────────┘

PHASE 3 (Database):
  #28 ──> #36 (State Mgmt) ──┐
                              ├──> [Enables advanced features]
  #37 ──> #34 (Audit) ──> #35 (Soft Deletes)

  #2 ──> #33 (Remove Dual-Write)

PHASE 4 (Bugs):
  [Independent - can do anytime]
  #20, #18, #16

PHASE 5 (Features):
  #28 + #36 ──> #15 (Undo/Redo)
  #28 ──> #17 (Subcategory Search)
  #28 ──> #14 (Keyboard Shortcuts)
  #28 ──> #13 (Mobile)
  #28 + #36 ──> #6 (Virtualization)

  [Independent]
  #9 (Export), #5 (Lazy Load), #19 (i18n)

  [Require New Systems]
  #8 (Alerts - needs notifications)
  #7 (Recurring - needs AI)
  #10 (Multi-currency - needs exchange API)

  [Production Only]
  #40 ──> #11 (JWT Rotation)
```

---

## 🎯 Recommended Execution Order

### Sprint 0: Unblock CI (ASAP)

1. #47 - Add DIRECT_URL (5 min) 🚨
2. #48 - Create basic unit tests (2-4 hours) 🚨
3. #42 - Merge xlsx security fix (PR #46) ✅
4. #43 - Merge Stats feature (PR #43) ✅

### Sprint 1: Architecture Foundation (1 week)

1. #28 - Complete page.tsx refactor
2. #24 - Add Zod validation
3. #37 - Add structured logging

### Sprint 2: Infrastructure (1 week)

1. #40 - Multi-environment deployment
2. #34 - Audit logging
3. #38 - Observability stack

### Sprint 3: State & Data (1 week)

1. #36 - State management (TanStack Query + Zustand)
2. #33 - Remove dual-write pattern
3. #35 - Soft deletes

### Sprint 4: Quick Wins (1 week)

1. #20, #18, #16 - Bug fixes (1 day)
2. #9 - Export functionality (2 days)
3. #5 - Lazy load viz libraries (1 day)
4. #19 - i18n cleanup (1 day)

### Sprint 5+: Features (2-3 weeks)

1. #17 - Subcategory search
2. #14 - Keyboard shortcuts
3. #13 - Mobile responsiveness
4. #15 - Undo/redo
5. #6 - Virtualization
6. #10 - Multi-currency
7. #7 - Recurring transactions
8. #8 - Budget alerts

---

## 📈 Effort Summary

| Phase     | Issues | Total Effort | Priority |
| --------- | ------ | ------------ | -------- |
| Sprint 0  | 4      | 4-8 hours    | P0/P1    |
| Sprint 1  | 3      | 4-5 days     | P1       |
| Sprint 2  | 3      | 4-6 days     | P2       |
| Sprint 3  | 3      | 5-7 days     | P2       |
| Sprint 4  | 6      | 5 days       | P3       |
| Sprint 5+ | 12     | 20-30 days   | P3       |

**Total**: 28 issues, ~40-55 days of work

---

## 🎯 Next Action Items

1. **Immediate**: Fix #47 (5 min) - User must add DIRECT_URL secret
2. **Today**: Start #48 (2-4 hours) - Create basic unit tests
3. **After CI passes**: Merge PR #46 and PR #43
4. **This week**: Start Sprint 1 (#28, #24, #37)

---

**Generated by Claude Code** | Last Updated: 2026-01-27
