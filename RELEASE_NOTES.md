# Release Notes - Moneto v2.0.0

**Release Date**: 2026-01-29
**Status**: Production Release 🎉

---

## 🎯 Release Highlights

This is a **major production release** focusing on:

- ✅ **Customer Experience**: Inline tag creation, improved error handling
- ✅ **Technical Debt**: Structured logging, dual-write pattern removal
- ✅ **Production Readiness**: Comprehensive testing, build optimization

---

## 📦 What's Included

### Customer-Facing Features

#### Issue #60: Inline Tag Creation (PR #64)

- **What**: Create tags directly during transaction editing without leaving the page
- **Why**: Streamlines workflow, reduces context switching
- **Features**:
  - Smart namespace parsing (supports `namespace:value` or defaults to `type:value`)
  - Enter key support for quick creation
  - Loading states and error handling
  - CSRF protection
  - Instant tag definition refresh

**Example**: Type "trip:croatia" and press Enter → tag created immediately

---

### Technical Improvements

#### Issue #37 Phase 1: Structured Logging Foundation (PR #65)

- **What**: Production-ready logging system replacing console.log
- **Components**:
  - `pino` logger with JSON output (production) and pretty printing (development)
  - Custom error classes: `AppError`, `ValidationError`, `AuthenticationError`, `AuthorizationError`, `RateLimitError`, `ConflictError`, `NotFoundError`
  - Centralized error handler with correlation IDs
  - Sensitive field redaction (passwords, tokens, API keys)

**Benefits**:

- Structured JSON logs for production monitoring
- Correlation IDs for distributed request tracing
- Consistent error responses across all endpoints

---

#### Issue #37 Phase 2: Route Migration (PR #66)

- **What**: Migrated critical routes to structured logging
- **Routes Updated**:
  - `POST /api/auth` (register, login, logout)
  - `GET|POST|PATCH|DELETE /api/transactions`
  - `GET|POST|PATCH /api/tags`

**Before**:

```typescript
console.error('Auth error:', error)
return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
```

**After**:

```typescript
const log = createRequestLogger(request)
log.error({ err: error }, 'Auth error')
return handleApiError(error, log)
```

**Benefits**:

- Correlation IDs in every log entry
- Automatic sensitive field redaction
- Consistent error responses with correlation IDs for support

---

#### Issue #33: Remove Dual-Write Pattern (PR #67)

- **What**: Migrated from text-based to ID-based category system
- **Changes**:
  - Removed `majorCategory`/`category` text field writes from `ai-classify` route
  - Removed `majorCategory`/`category` text field writes from `auto-categorize` route
  - Cleaned up unused imports (`idsToNames`, `categoryNames`)
  - Marked text fields as `DEPRECATED` in schema

**Before**:

```typescript
data: {
  majorCategory: categoryNames.majorCategory,  // ❌ Text field
  category: categoryNames.category,            // ❌ Text field
  majorCategoryId: classification.majorCategoryId,
  categoryId: classification.categoryId,
}
```

**After**:

```typescript
data: {
  majorCategoryId: classification.majorCategoryId,  // ✅ ID only
  categoryId: classification.categoryId,            // ✅ ID only
}
```

**Benefits**:

- Single source of truth (ID-based)
- Cleaner codebase
- Prepares for future text field removal
- ML-ready category system

---

## 🧪 Testing & Quality

- ✅ **90/90 unit tests passing** (Vitest)
- ✅ **TypeScript check passed** (`npx tsc --noEmit`)
- ✅ **Production build successful** (`npm run build`)
- ✅ **Pre-commit hooks passing** (Prettier + ESLint)
- ✅ **CI pipeline green** (GitHub Actions)

---

## 📊 Bundle Size Impact

| Page      | Before | After  | Change                     |
| --------- | ------ | ------ | -------------------------- |
| Main page | 502 kB | 385 kB | **-23.7%** (from Issue #5) |
| Cash flow | 188 kB | 130 kB | **-30.9%** (from Issue #5) |

_Note: Bundle size improvements from Issue #5 (PR #61) included in this release_

---

## 🔧 Database Schema Changes

### Schema Updates (Backward Compatible)

```prisma
model Transaction {
  // OLD: Text-based categories (DEPRECATED - kept for backward compatibility)
  majorCategory  String?  // DEPRECATED: Use majorCategoryId instead
  category       String?  // DEPRECATED: Use categoryId instead
  subCategory    String?  // DEPRECATED: Use tags instead

  // NEW: ID-based categories (2-level only: Major → Category)
  majorCategoryId  String?
  categoryId       String?
}

model Rule {
  majorCategory  String  // DEPRECATED: Legacy text-based major category
  category       String  // DEPRECATED: Legacy text-based category
}
```

**Migration Notes**:

- Text fields remain in database for backward compatibility
- No data migration required
- Future cleanup will remove deprecated fields after confirmation

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [x] All tests passing
- [x] Build successful
- [x] Documentation updated (CLAUDE.md v2.20)
- [x] Release notes created

### Deployment Steps

1. [x] Merge `develop` → `main`
2. [x] Tag `v2.0.0`
3. [ ] Push to GitHub
4. [ ] Vercel auto-deploys production
5. [ ] Verify production deployment
6. [ ] Close completed issues (#33, #37, #60)

---

## 📝 Breaking Changes

**None** - This release is fully backward compatible.

---

## 🐛 Known Issues

See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) for full list.

**Priority Issues**:

- None blocking production deployment

---

## 🙏 Credits

- Development: Claude Sonnet 4.5 + Developer
- Issues Resolved: #33, #37, #58, #59, #60
- PRs Merged: #63, #64, #65, #66, #67

---

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Project guide (v2.20)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) - API endpoints
- [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) - Issue tracking

---

## 🔮 Next Steps

After v2.0.0 release:

1. Monitor production logs for errors
2. Gather user feedback on inline tag creation
3. Plan v2.1.0 features based on priorities

---

**End of Release Notes**

_Generated: 2026-01-29_
_Release Manager: Claude Sonnet 4.5_
