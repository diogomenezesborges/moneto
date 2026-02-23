# 🚀 Moneto - Moneto

> **Modern family expense tracking with AI-powered categorization**
>
> A sophisticated Portuguese family finance management application with intelligent transaction categorization, multi-bank import, and comprehensive analytics.

---

## 📚 Documentation

**For AI Agents & Developers**: Start with **[CLAUDE.md](./CLAUDE.md)** - Your complete guide to the codebase

### Core Documentation

| Document                                        | Description                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| 📖 **[CLAUDE.md](./CLAUDE.md)**                 | **Main entry point** - Project overview, quick reference, documentation index |
| 🏗️ **[Architecture](./docs/ARCHITECTURE.md)**   | System architecture, tech stack, directory structure                          |
| 🗄️ **[Database](./docs/DATABASE.md)**           | Complete database schema (13 models, 273 categories)                          |
| 🔌 **[API Reference](./docs/API_REFERENCE.md)** | All API endpoints with examples                                               |
| 🧩 **[Components](./docs/COMPONENTS.md)**       | Component architecture and utilities                                          |

### Development Documentation

| Document                                                | Description                               |
| ------------------------------------------------------- | ----------------------------------------- |
| 🛠️ **[Development Guide](./docs/DEVELOPMENT_GUIDE.md)** | Setup, common tasks, best practices       |
| 🔒 **[Security](./docs/SECURITY.md)**                   | Security documentation and issue tracking |
| 🐛 **[Known Issues](./docs/KNOWN_ISSUES.md)**           | All tracked issues by priority            |

### Specialized Documentation

| Document                                                                  | Description                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------ |
| 🚀 **[Multi-Environment Strategy](./docs/MULTI_ENVIRONMENT_STRATEGY.md)** | Deployment strategy (Dev → Staging → Production) |
| 🐳 **[Docker Deployment](./docs/DOCKER_DEPLOYMENT.md)**                   | Container setup and configuration                |
| 🔄 **[API Versioning](./docs/API_VERSIONING.md)**                         | API version management                           |
| 📦 **[Backup & Restore](./docs/BACKUP_RESTORE_STRATEGY.md)**              | Database backup strategy                         |
| 🔧 **[Refactoring Guide](./docs/REFACTORING_GUIDE.md)**                   | Code refactoring progress (Issue #28)            |
| 🛡️ **[CSRF Protection](./docs/CSRF_PROTECTION.md)**                       | CSRF implementation guide                        |
| ⚡ **[Upstash Setup](./docs/UPSTASH_SETUP.md)**                           | Redis rate limiting setup                        |

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** 22.10.5+
- **npm** or **yarn**
- **Neon PostgreSQL** account (free tier)
- **Google Gemini API** key (optional, for AI classification)
- **Upstash Redis** account (optional for development, required for production)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/your-username/moneto.git
cd moneto

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)

# Push database schema to Neon
npx prisma db push

# Seed category taxonomy (optional, first time only)
node prisma/seed-taxonomy-v4.js

# Start development server
npm run dev
# → http://localhost:3000
```

### 3. Environment Variables

Create `.env` file:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=<your-neon-database-url>
DIRECT_URL=<your-neon-direct-url>

# Authentication - GENERATE A SECURE SECRET (see below)
JWT_SECRET=<generate-with-openssl-rand-base64-48>

# AI Classification (Google Gemini)
GEMINI_API_KEY=<your-google-ai-api-key>

# Rate Limiting (Upstash Redis) - Optional for development, REQUIRED for production
UPSTASH_REDIS_REST_URL=<your-upstash-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>
```

**Generate secure JWT_SECRET**:

```bash
# Recommended: Use OpenSSL to generate a 48-byte random secret
openssl rand -base64 48

# Alternative: Use Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

**Security Requirements**:

- JWT_SECRET must be minimum 32 characters (48+ recommended)
- Must be cryptographically random (not manually typed)
- Never commit `.env` to git
- Rotate secrets every 90-180 days in production
- See [JWT Secret Rotation Guide](docs/JWT_SECRET_ROTATION.md) for rotation procedure

---

## 🎯 Key Features

- 🤖 **AI-Powered Classification** - Google Gemini 2.5 Flash for intelligent categorization
- 📊 **Cash Flow Visualization** - Interactive Sankey diagrams
- 📁 **Multi-Bank Import** - Support for 7+ Portuguese banks (XLSX, CSV, PDF, JSON)
- 🏷️ **Tag-Based Metadata** - Flexible namespace system (trips, vehicles, projects, etc.)
- 📈 **Budget Tracking** - Monthly budgets with progress monitoring
- Multi-User Support - Individual and shared expense tracking per household member
- 🌙 **Dark Mode** - System preference with manual toggle
- 🇵🇹 **Portuguese-First** - Localized UI with English support
- ✅ **Production-Ready** - 4,679 transactions migrated, comprehensive test suite

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run unit tests with Vitest
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run E2E tests with Playwright
npm run test:e2e:ui  # Run E2E tests with UI

# Database
npx prisma studio    # Open database GUI (localhost:5555)
npx prisma db push   # Push schema changes
npx prisma migrate dev # Create migration

# Utility scripts
node scripts/backup-database.js           # Backup database
node prisma/seed-taxonomy-v4.js          # Seed categories
node prisma/seed-tag-definitions.js      # Seed tag definitions
```

### Tech Stack

| Layer             | Technologies                                           |
| ----------------- | ------------------------------------------------------ |
| **Frontend**      | React 19, Next.js 15, TypeScript 5.7, Tailwind CSS 3.4 |
| **Backend**       | Next.js API Routes (Serverless), Node.js 22            |
| **Database**      | PostgreSQL (Neon), Prisma ORM 6.19                     |
| **Auth**          | JWT, bcryptjs                                          |
| **AI/ML**         | Google Generative AI (Gemini 2.5 Flash)                |
| **Visualization** | Recharts, @nivo/sankey, @xyflow/react                  |
| **Testing**       | Vitest, Playwright, Testing Library                    |
| **CI/CD**         | GitHub Actions                                         |
| **Deployment**    | Vercel                                                 |

---

## 📁 Project Structure

```
family_finances/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Authentication, Transactions, Rules, etc.)
│   ├── page.tsx           # Main SPA (being refactored - Issue #28)
│   ├── cash-flow/         # Cash flow visualization
│   └── layout.tsx         # Root layout with dark mode
├── components/            # React Components
│   ├── ui/               # Reusable UI components
│   └── feature/          # Feature-specific components
├── contexts/              # React Contexts
├── lib/                   # Utility Libraries
│   ├── auth.ts           # JWT + bcrypt authentication
│   ├── ai-classifier.ts  # AI categorization with Gemini
│   ├── parsers.ts        # Multi-bank file parsing
│   └── ...               # Category mapping, formatting, icons, etc.
├── prisma/                # Database Layer
│   ├── schema.prisma     # Database schema (13 models)
│   └── seed-*.js         # Seeding scripts
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API_REFERENCE.md
│   └── ...               # See Documentation section above
├── .github/workflows/     # CI/CD pipelines
├── CLAUDE.md              # Main documentation entry point
└── README.md              # This file
```

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for complete directory structure.

---

## 🔐 Security

**Status**: Production-ready with comprehensive security measures

✅ **Implemented**:

- JWT authentication with validation (min 32 chars)
- bcrypt password hashing (12 rounds)
- Redis-based rate limiting (Upstash)
- Zod input validation on core routes
- Security headers (CSP, HSTS)
- Dev token restricted to development only

⚠️ **Pending**:

- CSRF protection (Issue #26)
- Input validation on remaining routes

See [SECURITY.md](./docs/SECURITY.md) for complete security documentation.

---

## 📊 Current Status

- ✅ **Production-ready** core functionality
- ✅ **ML-ready** ID-based category taxonomy (273 entries)
- ✅ **AI classification** with confidence scoring
- ✅ **4,679 transactions** migrated successfully (99.96% success rate)
- ✅ **Comprehensive test suite** (Vitest + Playwright)
- ✅ **CI/CD pipeline** with GitHub Actions
- 🚧 **Monolithic page.tsx** being refactored (Issue #28)

**Issues Tracking**: [GitHub Issues](https://github.com/your-username/moneto/issues) | [Known Issues](./docs/KNOWN_ISSUES.md)

---

## 🌐 URLs

- **Production**: https://moneto.vercel.app
- **Vercel Dashboard**: https://vercel.com/your-username-projects/moneto
- **Neon Console**: https://console.neon.tech
- **GitHub Repo**: https://github.com/your-username/moneto
- **Issues**: https://github.com/your-username/moneto/issues

---

## 🤝 Contributing

This is a private family project, but we follow professional development practices:

1. **Read [CLAUDE.md](./CLAUDE.md)** first (especially AI Agent Workflow Rules)
2. **Check [Known Issues](./docs/KNOWN_ISSUES.md)** before starting work
3. **Follow the workflow**: feature branches → PR → review → merge
4. **Never push directly** to `main` or `develop` branches
5. **Write tests** for new features
6. **Update documentation** when making changes

See [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) for detailed contribution guidelines.

---

## 📝 License

Private project - All rights reserved.

---

## 📞 Support

- **Documentation**: Start with [CLAUDE.md](./CLAUDE.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/moneto/issues)
- **Security**: Create private security advisory on GitHub

---

**Built with Moneto**

_For detailed technical documentation, see [CLAUDE.md](./CLAUDE.md) and the [Documentation Index](#-documentation)._
