# Multi-Environment Deployment Strategy

> **Status**: Implemented (Issue #40)
> **Last Updated**: 2026-01-25
> **Deployment Model**: Development → Preview → Staging → Production

## Overview

This document outlines the comprehensive multi-environment deployment strategy for Moneto, ensuring safe, tested deployments with proper isolation between environments.

## Environment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Development (Local)                       │
│  - Developer machines                                        │
│  - Hot reload, debug mode                                   │
│  - Local PostgreSQL or Neon dev branch                      │
│  - No Redis (in-memory fallback)                            │
└─────────────────────────────────────────────────────────────┘
                            ↓ (git push)
┌─────────────────────────────────────────────────────────────┐
│               Preview (Vercel Preview Deployments)           │
│  - Automatic on every PR                                     │
│  - Unique URL per PR (e.g., pr-123.vercel.app)             │
│  - Shared staging database                                   │
│  - Ephemeral, destroyed when PR closes                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ (PR merge to develop)
┌─────────────────────────────────────────────────────────────┐
│                  Staging (Pre-Production)                    │
│  - Vercel deployment from 'develop' branch                   │
│  - staging.moneto.com                               │
│  - Staging database (Neon branch)                           │
│  - Production-like configuration                             │
│  - Manual testing & QA                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓ (Manual promotion)
┌─────────────────────────────────────────────────────────────┐
│                    Production (Live)                         │
│  - Vercel deployment from 'main' branch                      │
│  - moneto.vercel.app                                │
│  - Production database (Neon main)                          │
│  - Production Redis (Upstash)                               │
│  - **REQUIRES MANUAL APPROVAL**                             │
└─────────────────────────────────────────────────────────────┘
```

## Environments

### 1. Development (Local)

**Purpose**: Local development and testing

**Configuration**:

- Branch: Any feature branch
- URL: `http://localhost:3000`
- Database: Local PostgreSQL or Neon dev branch
- Redis: Not required (in-memory fallback)

**Environment Variables** (`.env.local`):

```env
NODE_ENV=development
NEXT_PUBLIC_ENVIRONMENT=development
DATABASE_URL=postgresql://...dev-branch
JWT_SECRET=dev-jwt-secret-not-for-production
```

---

### 2. Preview (Vercel Preview Deployments)

**Purpose**: Automatic deployments for pull requests

**Configuration**:

- Branch: Any PR branch
- URL: `https://moneto-git-{branch}.vercel.app`
- Database: Shared staging database
- Automatic deployment on every commit

---

### 3. Staging (Pre-Production)

**Purpose**: Pre-production testing, QA validation

**Configuration**:

- Branch: `develop`
- URL: `https://staging.moneto.com`
- Database: Staging database (Neon staging branch)
- Automatic deployment on merge to develop

---

### 4. Production (Live)

**Purpose**: Live production environment

**Configuration**:

- Branch: `main`
- URL: `https://moneto.vercel.app`
- Database: Production database
- **MANUAL APPROVAL REQUIRED**

---

## Branch Strategy

```
main (production)
  └── develop (staging)
        ├── feature/...
        ├── bugfix/...
        └── hotfix/...
```

**Branch Policies**:

- `main`: Direct commits forbidden, requires 2 reviews, manual approval
- `develop`: Requires 1 review, automatic staging deployment
- Feature branches: Automatic preview deployments

---

## Deployment Workflows

### CI Pipeline (All Branches)

- Lint & type-check
- Unit tests
- Build validation
- Security audit

### Preview Deployment (PR Branches)

- Automatic deployment to Vercel preview
- Comment on PR with preview URL
- E2E tests against preview

### Staging Deployment (Develop Branch)

- Automatic deployment to staging
- Smoke tests
- Team notification

### Production Deployment (Main Branch)

- **Manual approval required**
- Full CI pipeline
- Post-deployment checks
- Rollback capability

---

## Database Strategy

**Neon Branching**:

- `main` - Production database
- `staging` - Staging database (copy of main)
- `dev` - Development database

**Benefits**:

- Isolated data per environment
- Instant branch creation
- Cost-effective

---

## Rollback Procedures

**Automatic Rollback**:

- Health check failures
- Error rate > 5%
- Critical database errors

**Manual Rollback**:

```bash
git revert <commit-sha>
git push origin main
```

---

## Monitoring

- Health checks: `/api/health`
- Error tracking: Sentry (optional)
- Performance: Vercel Analytics
- Database: Neon metrics

---

## Cost Optimization

**Free Tier Strategy**:

- Vercel (Hobby): Unlimited preview deployments
- Neon (Free): 3 branches, 3 GB storage
- Upstash (Free): 10,000 requests/day

**Total Monthly Cost**: $0 (within free tier limits)

---

## Related Documentation

- [Docker Deployment Guide](./DOCKER_DEPLOYMENT.md)
- [Backup & Restore Strategy](./BACKUP_RESTORE_STRATEGY.md)
- [API Versioning](./API_VERSIONING.md)

---

**Last Updated**: 2026-01-25
**Status**: Documented and ready for implementation
