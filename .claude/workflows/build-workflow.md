# Project Stack & Build Workflow

**Language**: TypeScript (strict mode)
**Framework**: Next.js 15 with App Router
**ORM**: Prisma
**Database**: PostgreSQL (Neon)
**Deployment**: Vercel
**Package Manager**: npm

## Mandatory Build Verification

**Before committing ANY code changes:**

```bash
# 1. Always regenerate Prisma client after schema changes
npx prisma generate

# 2. Always verify TypeScript compilation
npm run build

# 3. Run linter
npm run lint
```

**The TypeScript validation hook will catch errors after edits, but always run full build before committing.**
