# Known Issues

> **Part of**: [Moneto Documentation](../CLAUDE.md)
> **Last Updated**: 2026-01-28

## Table of Contents

1. [Overview](#overview)
2. [Priority: CRITICAL (P0)](#priority-critical-p0-)
3. [Priority: HIGH (P1)](#priority-high-p1-)
4. [Priority: MEDIUM (P2)](#priority-medium-p2-)
5. [Features & Enhancements](#features--enhancements)
6. [Issue Tracking Dashboard](#issue-tracking-dashboard)
7. [Related Documentation](#related-documentation)

---

## Overview

Issues are tracked on GitHub: https://github.com/your-username/moneto/issues

**Total Open Issues**: 19 (as of 2026-01-28)

- **Critical (P0)**: 0 issues (✅ All resolved and closed: #21-22)
- **High (P1)**: 0 issues 🎉 (✅ #23-28, #29-32, #40, #42 ALL resolved and closed!)
- **Medium (P2)**: 9 issues (#2-3, #33-38) - Architecture, features, tech debt (✅ Closed duplicates: #1, #4)
- **Features & Enhancements**: 10 issues (#5-11, #13-19) - UX, bugs, improvements (✅ Closed duplicates: #12, #20)

---

## Priority: CRITICAL (P0) 🔴

### ✅ ALL P0 ISSUES RESOLVED!

#### ✅ RESOLVED: [Issue #21](https://github.com/your-username/moneto/issues/21) - Remove hardcoded dev token authentication bypass

**Status**: Fixed ✅
**Location**: `lib/auth.ts:50-53`
**Resolution**: Dev token now restricted to `NODE_ENV === 'development'` only
**Impact**: Production environments cannot use dev token bypass

---

#### ✅ RESOLVED: [Issue #22](https://github.com/your-username/moneto/issues/22) - Remove default JWT secret fallback

**Status**: Fixed ✅
**Location**: `lib/auth.ts:5-17`
**Resolution**: Application fails fast if JWT_SECRET missing or too short (< 32 chars)
**Impact**: Eliminates default secret vulnerability

---

## Priority: HIGH (P1) 🟠

### ✅ RESOLVED Issues

#### ✅ [Issue #23](https://github.com/your-username/moneto/issues/23) - Implement Redis-based rate limiting

**Status**: Implemented ✅
**Implementation**: Upstash Redis with automatic fallback to in-memory for development
**Documentation**: [docs/UPSTASH_SETUP.md](UPSTASH_SETUP.md)
**Cost**: Free tier (10,000 requests/day)

---

#### ✅ [Issue #24](https://github.com/your-username/moneto/issues/24) - Add input validation with Zod

**Status**: Fully Implemented ✅ (PR #51 merged)
**Implementation**:

- Created `lib/validation.ts` with comprehensive Zod schemas
- Created `lib/validate-request.ts` with validation utilities
- Updated ALL API routes: `/api/auth`, `/api/transactions`, `/api/rules`, `/api/ai/*`, `/api/categories/*`, `/api/banks/*`
- Type-safe request handling with inferred TypeScript types
- Complete input validation coverage across all mutation endpoints

---

#### ✅ [Issue #25](https://github.com/your-username/moneto/issues/25) - Add Content-Security-Policy and HSTS headers

**Status**: Implemented ✅
**Location**: `next.config.js`
**Implementation**:

- Comprehensive CSP with directives for Next.js, Google Fonts, Gemini API, Upstash
- HSTS with 1-year max-age, includeSubDomains, and preload
- Protection against XSS, clickjacking, and forced HTTPS enforcement

---

#### ✅ [Issue #27](https://github.com/your-username/moneto/issues/27) - Add testing framework

**Status**: Implemented ✅
**Implementation**:

- Vitest for unit/integration tests with coverage reporting
- Playwright for E2E tests (Chromium, Firefox, WebKit)
- Testing Library for React component testing
- Example tests created
- CI pipeline includes automated test execution

---

#### ✅ [Issue #28](https://github.com/your-username/moneto/issues/28) - Refactor page.tsx (Architecture)

**Status**: Fully Complete ✅ (PR #53 merged)
**Impact**: 228KB monolithic file refactored into modular feature-based architecture
**Implementation**:

- **Shared infrastructure**: useAuth, useNotification, useTheme hooks with comprehensive tests (37 tests)
- **Transactions Feature**: Full implementation with 3 hooks and complete UI
- **Rules Feature**: Full implementation (PR #41 merged)
- **Stats Feature**: Full implementation with interactive visualizations (PR #43 merged)
- **Settings/Review Features**: Architecture established
- **Legacy file preserved**: `page.legacy.tsx` for reference

**Documentation**: [docs/REFACTORING_GUIDE.md](REFACTORING_GUIDE.md)
**Test Coverage**: 90 tests across feature modules (PR #54 merged)

---

#### ✅ [Issue #29](https://github.com/your-username/moneto/issues/29) - Add GitHub Actions CI/CD pipeline

**Status**: Implemented ✅
**Workflows**:

- `ci.yml`: Lint, type-check, unit tests, build, database validation, security audit
- `pr-checks.yml`: PR validation, commit format, bundle analysis, security checks
- `backup-database.yml`: Daily automated backups with 30-day retention

---

#### ✅ [Issue #30](https://github.com/your-username/moneto/issues/30) - Create Dockerfile for containerized deployment

**Status**: Implemented ✅
**Documentation**: [docs/DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
**Features**: Multi-stage build, Docker Compose, production-optimized, security hardened

---

#### ✅ [Issue #31](https://github.com/your-username/moneto/issues/31) - Add API versioning

**Status**: Implemented ✅
**Documentation**: [docs/API_VERSIONING.md](API_VERSIONING.md)
**Implementation**: URL-based versioning (`/api/v1/resource`), deprecation warnings, migration support

---

#### ✅ [Issue #32](https://github.com/your-username/moneto/issues/32) - Implement pagination on list endpoints

**Status**: Implemented ✅
**Implementation**: Cursor-based pagination with configurable page size
**Benefits**: Better performance for large datasets (10,000+ transactions)

---

#### ✅ [Issue #40](https://github.com/your-username/moneto/issues/40) - Add multi-environment deployment strategy

**Status**: Complete ✅ (Manual GitHub configuration pending)
**Implementation**:

- Environment tiers: Development → Preview → Staging → Production
- Branch strategy: feature → develop → main
- GitHub environments and workflows created
- Neon database branching strategy
- $0/month cost using free tiers

**Documentation**: [docs/MULTI_ENVIRONMENT_STRATEGY.md](MULTI_ENVIRONMENT_STRATEGY.md), [docs/GITHUB_SETUP.md](GITHUB_SETUP.md)

---

#### ✅ [Issue #26](https://github.com/your-username/moneto/issues/26) - Implement CSRF protection

**Status**: Implemented ✅ (PR #50 merged)
**Implementation**: Double Submit Cookie pattern with HMAC-signed tokens
**Coverage**: All mutation API routes protected
**Documentation**: [docs/CSRF_PROTECTION.md](CSRF_PROTECTION.md)
**Features**:

- `lib/csrf.ts`: Token generation and validation
- Middleware integration on all POST/PATCH/DELETE endpoints
- Cookie-based token delivery with HttpOnly + Secure flags
- HMAC signing with CSRF_SECRET environment variable

---

### ⚠️ PENDING Issues

**🎉 No Pending P1 Issues!** All high-priority security issues have been resolved.

---

#### ✅ [Issue #42](https://github.com/your-username/moneto/issues/42) - xlsx package security vulnerabilities

**Status**: Resolved ✅ (PR #46 merged to develop on 2026-01-27)
**Resolution**: Migrated from vulnerable `xlsx@0.18.5` to secure `exceljs@4.4.0`
**Security Impact**:

- ❌ Eliminated: Prototype Pollution ([GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6))
- ❌ Eliminated: Regular Expression Denial of Service ([GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9))

**Files Changed**:

- `lib/parsers.ts` - Updated to use ExcelJS API
- `lib/parsers.ts` - Consolidated to use ExcelJS API for all XLSX files
- `package.json` - Replaced xlsx with exceljs dependency

**npm audit**: ✅ 0 vulnerabilities (was 1 high severity)

---

## Priority: MEDIUM (P2) 🟡

### Architecture & Tech Debt

#### ✅ CLOSED: [Issue #1](https://github.com/your-username/moneto/issues/1) - Split monolithic page.tsx

**Status**: Closed as duplicate of Issue #28 (architecture complete)

---

#### [Issue #2](https://github.com/your-username/moneto/issues/2) - Complete category ID migration

**Impact**: Dual-write complexity, duplicate data
**Effort**: 1-2 days
**Benefits**: Simpler codebase, easier ML integration
**Related**: Issue #33

---

#### [Issue #3](https://github.com/your-username/moneto/issues/3) - Add proper state management solution

**Impact**: Prop drilling, complex state logic
**Suggested**: Zustand or Jotai
**Effort**: 1-2 days
**Related**: Issue #36

---

#### ✅ CLOSED: [Issue #4](https://github.com/your-username/moneto/issues/4) - Add automated test suite

**Status**: Closed as duplicate of Issue #27 (testing framework complete)

---

#### [Issue #33](https://github.com/your-username/moneto/issues/33) - Remove dual-write pattern for categories

**Impact**: Dual-write complexity, code duplication
**Fix**: Complete migration to ID-based taxonomy only
**Benefits**: Simpler codebase, reduced bugs
**Related**: Issue #2

---

#### [Issue #34](https://github.com/your-username/moneto/issues/34) - Implement audit logging

**Impact**: No audit trail for sensitive operations
**Fix**: Add audit log table for transactions, categories, rules
**Benefits**: Compliance, debugging, user trust

---

#### [Issue #35](https://github.com/your-username/moneto/issues/35) - Implement soft deletes

**Impact**: Data loss risk, no recovery mechanism
**Fix**: Add `deletedAt` field to critical models
**Benefits**: Data recovery, audit trail

---

#### [Issue #36](https://github.com/your-username/moneto/issues/36) - Implement proper state management

**Impact**: Prop drilling, cache inconsistencies
**Suggested**: TanStack Query for server state, Zustand for client state
**Benefits**: Better performance, cleaner code
**Related**: Issue #3

---

#### [Issue #37](https://github.com/your-username/moneto/issues/37) - Improve error handling with structured logging

**Impact**: Hard to debug production issues
**Suggested**: Pino/Winston for structured logging, error boundaries
**Benefits**: Better observability, faster debugging

---

#### [Issue #38](https://github.com/your-username/moneto/issues/38) - Add observability stack

**Impact**: No visibility into production performance
**Suggested**: Health endpoints, Prometheus metrics, OpenTelemetry APM
**Benefits**: Proactive monitoring, performance insights

---

## Features & Enhancements

### Performance

#### [Issue #5](https://github.com/your-username/moneto/issues/5) - Lazy load visualization libraries

**Benefit**: Faster initial load
**Libraries**: @nivo/sankey, recharts, @xyflow/react
**Effort**: Low

---

#### [Issue #6](https://github.com/your-username/moneto/issues/6) - Add pagination/virtualization for transactions

**Impact**: Performance with 10,000+ transactions
**Suggested**: react-virtual (TanStack Virtual)
**Effort**: Medium

---

### Feature Additions

#### [Issue #7](https://github.com/your-username/moneto/issues/7) - Add recurring transaction detection

**Benefit**: Subscription tracking, forecasting
**Use Cases**: Netflix, gym membership, rent
**Effort**: Medium

---

#### [Issue #8](https://github.com/your-username/moneto/issues/8) - Implement budget alerts

**Status**: Budget model exists, UI pending
**Benefit**: Overspending notifications
**Effort**: Low-Medium

---

#### [Issue #9](https://github.com/your-username/moneto/issues/9) - Add Excel export

**Status**: CSV export exists, Excel pending
**Benefit**: Better compatibility with Excel users
**Effort**: Low

---

#### [Issue #10](https://github.com/your-username/moneto/issues/10) - Add multi-currency support

**Benefit**: International transactions tracking
**Use Cases**: Travel expenses, foreign investments
**Effort**: High

---

### UX Improvements

#### [Issue #11](https://github.com/your-username/moneto/issues/11) - Rotate JWT secret

**Status**: Ready for Action ✅ (Documentation complete)
**Priority**: High
**Impact**: Production security hardening
**Documentation**: [docs/JWT_SECRET_ROTATION.md](JWT_SECRET_ROTATION.md)
**Tools**: `scripts/generate-secret.js` - Automated secret generation
**Effort**: < 15 minutes (including deployment)
**Recommendation**: Rotate every 90 days (next due: user decision)
**Related**: Resolved Issue #22

---

#### ✅ CLOSED: [Issue #12](https://github.com/your-username/moneto/issues/12) - Remove dev token bypass

**Status**: Closed as duplicate of Issue #21 (resolved)

---

#### [Issue #13](https://github.com/your-username/moneto/issues/13) - Improve mobile responsiveness

**Impact**: Mobile UX
**Effort**: Medium
**Areas**: Transaction list, filters, forms

---

#### [Issue #14](https://github.com/your-username/moneto/issues/14) - Add keyboard shortcuts

**Suggested**: j/k navigation, c for categorize, f for filter
**Benefit**: Power user efficiency
**Effort**: Low-Medium

---

#### [Issue #15](https://github.com/your-username/moneto/issues/15) - Add undo/redo

**Benefit**: Reduce user anxiety about mistakes
**Use Cases**: Bulk edits, accidental deletions
**Effort**: Medium

---

### Bugs

#### [Issue #16](https://github.com/your-username/moneto/issues/16) - Add Transaction form missing Notes field

**Impact**: Can't add notes during creation
**Severity**: Minor
**Effort**: Low

---

#### [Issue #17](https://github.com/your-username/moneto/issues/17) - Search subcategories and auto-populate

**Benefit**: Faster categorization
**Effort**: Low

---

#### [Issue #18](https://github.com/your-username/moneto/issues/18) - Date field doesn't allow manual editing

**Impact**: Poor UX for date input
**Effort**: Low

---

#### [Issue #19](https://github.com/your-username/moneto/issues/19) - Convert remaining Portuguese text to English

**Impact**: Inconsistent i18n
**Effort**: Low

---

#### ✅ CLOSED: [Issue #20](https://github.com/your-username/moneto/issues/20) - Origin field has duplicate values

**Status**: Resolved ✅ (PR #52 merged)
**Resolution**: Standardized all 'Comum' values to 'Couple'
**Impact**: Data consistency achieved across all transactions

---

## Issue Tracking Dashboard

### By Priority

- **P0 (Critical)**: 0 open, 2 resolved and closed ✅
- **P1 (High)**: 0 open 🎉, 13 resolved and closed ✅ (#23-26, #27-28, #29-32, #40, #42)
- **P2 (Medium)**: 9 open (#2-3, #33-38), 2 closed as duplicates (#1, #4)
- **Features**: 10 open (#5-11, #13-19), 2 closed as duplicates (#12, #20)

### By Category

- **Security**: 0 open 🎉, 10 closed (#21-22, #24-26, #42)
- **Architecture**: 3 open (#2-3, #33), 2 closed as duplicates (#1, #4)
- **Infrastructure**: 0 open, 4 resolved and closed (#27, #29-30, #40)
- **Features**: 6 open (#5-10)
- **UX**: 4 open (#13-15, #19)
- **Bugs**: 3 open (#16-18)
- **Tech Debt**: 4 open (#34-38)

---

## Related Documentation

- [Main Guide](../CLAUDE.md) - Project overview
- [Security](SECURITY.md) - Detailed security documentation
- [Development Guide](DEVELOPMENT_GUIDE.md) - How to fix issues
- [Architecture](ARCHITECTURE.md) - System architecture
