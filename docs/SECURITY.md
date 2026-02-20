# Security Documentation

> **Part of**: [Moneto Documentation](../CLAUDE.md)
> **Last Updated**: 2026-01-26

## Table of Contents

1. [Overview](#overview)
2. [Priority: CRITICAL (P0)](#priority-critical-p0-)
3. [Priority: HIGH (P1)](#priority-high-p1-)
4. [Security Best Practices](#security-best-practices)
5. [Environment Variable Security](#environment-variable-security)
6. [Security Audit Checklist](#security-audit-checklist)
7. [Incident Response Plan](#incident-response-plan)
8. [Security Resources](#security-resources)
9. [Contact](#contact)

---

## Overview

This document tracks security issues, resolutions, and best practices for the Moneto application.

**Security Issue Tracking**: [GitHub Issues](https://github.com/your-username/moneto/issues?q=is%3Aissue+label%3Asecurity)

## Priority: CRITICAL (P0) 🔴

### ✅ ALL P0 ISSUES RESOLVED!

#### ✅ RESOLVED: Issue #21 - Remove Hardcoded Dev Token Bypass

**Status**: Fixed ✅
**GitHub**: [Issue #21](https://github.com/your-username/moneto/issues/21)
**Location**: `lib/auth.ts:50-53`

**Problem**:

```typescript
// SECURITY VULNERABILITY - Anyone could bypass auth
if (token === 'dev-token-no-auth') {
  return { userId: 'cmj95p60f0000xweq4znl3xbp' }
}
```

**Solution**:

```typescript
// Only allow in development environment
if (process.env.NODE_ENV === 'development' && token === 'dev-token-no-auth') {
  console.warn('⚠️ Dev authentication bypass used')
  return { userId: 'cmj95p60f0000xweq4znl3xbp' }
}
```

**Impact**: Production environments cannot use dev token bypass.

---

#### ✅ RESOLVED: Issue #22 - Remove Default JWT Secret Fallback

**Status**: Fixed ✅
**GitHub**: [Issue #22](https://github.com/your-username/moneto/issues/22)
**Location**: `lib/auth.ts:5-17`

**Problem**:

```typescript
// SECURITY VULNERABILITY - Default fallback is known
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'
```

**Solution**:

```typescript
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required')
}

if (JWT_SECRET.length < 32) {
  throw new Error('FATAL: JWT_SECRET must be at least 32 characters')
}
```

**Impact**: Application fails fast if JWT_SECRET missing or too short (< 32 chars).

---

## Priority: HIGH (P1) 🟠

### ✅ RESOLVED: Issue #23 - Implement Redis-Based Rate Limiting

**Status**: Implemented ✅
**GitHub**: [Issue #23](https://github.com/your-username/moneto/issues/23)
**Location**: `lib/rate-limiter.ts`

**Implementation**:

- Uses Upstash Redis for production-ready rate limiting
- Falls back to in-memory implementation when Redis not configured
- Supports sliding window algorithm (5 requests per 15 minutes)
- Requires environment variables:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

**Setup**: See [docs/UPSTASH_SETUP.md](UPSTASH_SETUP.md)

**Cost**: Free tier (10,000 requests/day)

---

### ✅ RESOLVED: Issue #24 - Add Input Validation with Zod

**Status**: Implemented for core routes ✅
**GitHub**: [Issue #24](https://github.com/your-username/moneto/issues/24)
**Locations**: `lib/validation.ts`, `lib/validate-request.ts`

**Implementation**:

- Created comprehensive Zod schemas for validation
- Updated API routes with validation:
  - `/api/auth` - Discriminated union validation for login/register/logout
  - `/api/transactions` - POST/PATCH/DELETE validation
  - `/api/rules` - POST/DELETE validation
- Type-safe request handling with inferred TypeScript types
- Consistent error responses (400 Bad Request with detailed validation errors)

**Example Schema**:

```typescript
export const TransactionCreateSchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
  amount: z.number(),
  balance: z.number().optional(),
  origin: z.enum(['User 1', 'User 2', 'Couple']),
  bank: z.string().min(1).max(100),
  majorCategoryId: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
})
```

**Remaining Work**: Add validation to `/api/ai/*`, `/api/categories/*`, `/api/banks/*` routes

---

### ✅ RESOLVED: Issue #25 - Add Security Headers

**Status**: Implemented ✅
**GitHub**: [Issue #25](https://github.com/your-username/moneto/issues/25)
**Location**: `next.config.js`

**Implementation**:

**Content-Security-Policy (CSP)**:

```javascript
;("default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Required for Next.js
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://generativelanguage.googleapis.com https://*.upstash.io",
  "frame-ancestors 'none'", // Prevent clickjacking
  "base-uri 'self'",
  "form-action 'self'")
```

**Strict-Transport-Security (HSTS)**:

```javascript
'max-age=31536000; includeSubDomains; preload'
```

**Security Impact**:

- ✅ Prevents XSS attacks through CSP
- ✅ Forces HTTPS connections
- ✅ Prevents clickjacking
- ✅ Restricts resource loading to trusted sources

---

### ⚠️ PENDING: Issue #26 - Implement CSRF Protection

**Status**: Pending ⚠️
**GitHub**: [Issue #26](https://github.com/your-username/moneto/issues/26)

**Problem**: All API routes vulnerable to CSRF attacks.

**Proposed Solution**: Implement CSRF tokens using Double Submit Cookie pattern.

**Priority**: HIGH (P1) - Should be addressed soon

---

### ⚠️ NEW: Issue #42 - xlsx Package Security Vulnerabilities

**Status**: Identified 2026-01-26
**GitHub**: [Issue #42](https://github.com/your-username/moneto/issues/42)
**Location**: `package.json` (xlsx@0.18.5)

**Problem**: The xlsx package has two high severity vulnerabilities with no fix available:

1. **Prototype Pollution** ([GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6))
2. **Regular Expression Denial of Service (ReDoS)** ([GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9))

**Impact**:

- Used for Excel bank statement parsing (ActivoBank, CGD, Santander, Montepio)
- Critical functionality for file imports
- Latest version (0.18.5) still vulnerable

**Mitigation Factors**:

- File uploads require authentication
- Limited to trusted users (family members)
- Files from known sources (banks)
- Server-side processing only

**Proposed Solutions**:

1. **Short-term**: Document risk, add file size limits (max 10MB), upload warnings
2. **Long-term**: Migrate to `exceljs` alternative library

**Priority**: HIGH (P1) - Known vulnerability in production dependency

---

## Security Best Practices

### 1. Never Trust User Input

- ✅ Validate everything with Zod schemas (Issue #24)
- ✅ Use parameterized queries (Prisma prevents SQL injection)
- ⚠️ Add validation to remaining routes (`/api/ai/*`, `/api/categories/*`, `/api/banks/*`)

### 2. Rate Limiting

- ✅ Implemented with Upstash Redis (Issue #23)
- ✅ All public endpoints protected
- 5 requests per 15 minutes for authentication
- Configurable per endpoint

### 3. HTTPS Only

- ✅ Enforced by Vercel hosting
- ✅ HSTS headers configured (Issue #25)

### 4. Security Headers

- ✅ Content-Security-Policy (CSP)
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Frame-Options via `frame-ancestors 'none'`

### 5. CSRF Protection

- ⚠️ Pending implementation (Issue #26)
- Should be added for all state-changing operations

### 6. Secrets Management

- ✅ Environment variables only (never commit secrets)
- ✅ JWT_SECRET validation (min 32 chars)
- ✅ Dev token restricted to development environment
- Production secrets stored in Vercel environment variables

### 7. JWT Security

- ✅ 30-day expiry
- ✅ Secure token signing with validated secret
- ✅ Token verification on every request
- Future: Add refresh tokens for longer sessions

### 8. Authentication

- ✅ bcrypt password hashing (12 rounds)
- ✅ PIN-based authentication for family use
- ✅ Dev bypass restricted to development only
- Token stored in localStorage (client-side)

---

## Environment Variable Security

### Required Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgres://user:pass@host.neon.tech/database?sslmode=require
DIRECT_URL=postgresql://user:pass@host.neon.tech/database?sslmode=require

# Authentication (REQUIRED - no fallback)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# AI Classification (Google Gemini)
GEMINI_API_KEY=your-google-ai-api-key

# Rate Limiting (Upstash Redis) - Optional for development, REQUIRED for production
UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### Security Checklist

When deploying to production:

- [ ] JWT_SECRET is set and ≥32 characters
- [ ] JWT_SECRET is cryptographically random (not a password)
- [ ] DATABASE_URL uses SSL mode (`?sslmode=require`)
- [ ] UPSTASH_REDIS_REST_URL and TOKEN are set
- [ ] GEMINI_API_KEY has appropriate quotas/rate limits
- [ ] No `.env` file committed to git (in `.gitignore`)
- [ ] Environment variables set in Vercel dashboard
- [ ] Different secrets for staging vs production

---

## Security Audit Checklist

### Authentication & Authorization

- [x] JWT secret is validated and strong
- [x] Dev token bypass restricted to development
- [x] Password hashing with bcrypt (12 rounds)
- [x] Token expiry (30 days)
- [ ] Refresh token implementation (future)
- [x] Rate limiting on auth endpoints

### Input Validation

- [x] Zod validation for auth routes
- [x] Zod validation for transaction routes
- [x] Zod validation for rules routes
- [ ] Zod validation for AI routes
- [ ] Zod validation for category routes
- [ ] Zod validation for bank routes

### Security Headers

- [x] Content-Security-Policy
- [x] Strict-Transport-Security
- [x] X-Frame-Options (via CSP)
- [x] Base URI restriction
- [x] Form action restriction

### CSRF Protection

- [ ] CSRF tokens implementation (Issue #26)
- [ ] Double Submit Cookie pattern
- [ ] SameSite cookie attributes

### Rate Limiting

- [x] Redis-based rate limiter
- [x] Authentication endpoints protected
- [x] Fallback for development
- [ ] Per-user rate limits (future)

### Data Protection

- [x] HTTPS only (Vercel enforced)
- [x] Sensitive data not logged
- [ ] Audit logging (Issue #34)
- [ ] Soft deletes (Issue #35)

---

## Incident Response Plan

### If a Security Issue is Discovered

1. **Assess Severity**
   - Critical (P0): Data breach, authentication bypass
   - High (P1): XSS, CSRF, injection vulnerabilities
   - Medium (P2): Information disclosure
   - Low (P3): Minor issues

2. **Immediate Actions for P0/P1**
   - Do NOT create public GitHub issue
   - Create private security advisory on GitHub
   - Notify repository owner immediately
   - Deploy hotfix if needed

3. **Document & Fix**
   - Document the vulnerability
   - Create fix with tests
   - Test thoroughly in staging
   - Deploy to production
   - Update this document

4. **Post-Mortem**
   - How was it discovered?
   - What was the impact?
   - How was it fixed?
   - How can we prevent similar issues?

---

## Security Resources

### Internal Documentation

- [Architecture](ARCHITECTURE.md) - System architecture and security design
- [Database](DATABASE.md) - Database security and access patterns
- [API Reference](API_REFERENCE.md) - API authentication and authorization
- [Development Guide](DEVELOPMENT_GUIDE.md) - Secure coding practices

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [Prisma Security](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization)
- [Vercel Security](https://vercel.com/docs/security)

### Security Tools

- `npm audit` - Dependency vulnerability scanning (automated in CI)
- GitHub Dependabot - Automated dependency updates
- GitHub Code Scanning - Static analysis (optional)

---

## Contact

For security issues:

- **Private Security Advisory**: [GitHub Security](https://github.com/your-username/moneto/security)
- **Repository Owner**: @your-username
