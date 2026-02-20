# Vercel Deployment Skill

---

name: vercel-deployment-skill
description: This skill should be used when working with Vercel deployments, environment variables, preview URLs, and production releases.
auto_detect: vercel.json
license: MIT

---

## Purpose

Provides Vercel deployment knowledge for the project's multi-environment strategy, automatic deployments, and zero-cost hosting approach.

## When to Use

**Auto-activate when:**

- `vercel.json` or `.vercel/` directory exists
- Deploying to production or preview environments
- Configuring environment variables

## Capabilities

### 1. Deployment Strategy

**Automatic Deployments:**

- Push to `main` → Production (moneto.vercel.app)
- Push to `develop` → Preview (develop-moneto.vercel.app)
- Push to `feature/*` → Preview (feature-xyz-moneto.vercel.app)

**$0/Month Cost:**

- Free tier: 100GB bandwidth, unlimited requests
- PostgreSQL: Neon free tier (0.5GB storage)
- Redis: Upstash free tier (10k requests/day)

### 2. Environment Variables

**Required Variables:**

```
DATABASE_URL=<Neon PostgreSQL connection string>
DIRECT_URL=<Neon direct connection (bypasses pooling)>
JWT_SECRET=<min 32 characters>
GEMINI_API_KEY=<Google AI API key>
UPSTASH_REDIS_REST_URL=<Upstash Redis URL>
UPSTASH_REDIS_REST_TOKEN=<Upstash Redis token>
```

**Set in:** Vercel Dashboard → Settings → Environment Variables

**Separate by Environment:**

- Production: Different database than development
- Preview: Can share development database

### 3. Build Configuration

**Build Command:** `npm run build`

**Build Steps:**

1. `npx prisma generate` - Generate Prisma Client
2. `next build` - Build Next.js application
3. TypeScript compilation
4. Linting

**Build Checks:**

- TypeScript: No errors allowed
- Linting: Must pass ESLint
- Tests: Must pass (enforced in CI)

### 4. Deployment Workflow

**Manual Deployment:**

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

**GitHub Integration (Automatic):**

1. Push to branch
2. GitHub Action runs tests
3. Vercel builds and deploys
4. Preview URL posted as comment

### 5. Common Issues

**Database Migrations:**

- Run migrations before deploying code changes
- Use `npx prisma migrate deploy` in production
- Test migrations in preview environment first

**Environment Variable Updates:**

- Changes require redeployment to take effect
- Use Vercel CLI: `vercel env pull` to sync locally

**Cold Starts:**

- Serverless functions can have cold start latency (~1-2s)
- Mitigate with: Keep functions small, use edge functions for critical paths

---

## References

- Vercel Docs: https://vercel.com/docs
- Multi-Environment Strategy: `docs/MULTI_ENVIRONMENT_STRATEGY.md`
- Upstash Setup: `docs/UPSTASH_SETUP.md`

**Project URLs:**

- Production: https://moneto.vercel.app
- Vercel Dashboard: https://vercel.com/your-username-projects/moneto

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
