# System Architecture

> **Part of**: [Moneto Documentation](../CLAUDE.md)
> **Last Updated**: 2026-01-26

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Flow Architecture](#data-flow-architecture)
3. [State Management](#state-management)
4. [Tech Stack](#tech-stack)
5. [Directory Structure](#directory-structure)
6. [Component Architecture](#component-architecture)
7. [Related Documentation](#related-documentation)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 App Router                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   Frontend     │  │   API Routes   │  │  Server-Side   │ │
│  │   (React 19)   │  │  (Serverless)  │  │   Rendering    │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘ │
└───────────┼──────────────────┼──────────────────┼──────────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Prisma ORM 6.19   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Neon PostgreSQL    │
                    └─────────────────────┘

External Services:
┌──────────────────────┐
│ Google Gemini 2.5    │ ──→ AI Classification
└──────────────────────┘
```

## Data Flow Architecture

### Transaction Import Flow

```
User Upload (XLSX/CSV/PDF/JSON)
    ↓
File Type Detection (lib/parsers.ts)
    ↓
Bank-Specific Parser (lib/parsers/*)
    ↓
Duplicate Detection (via API)
    ↓
Database Insert (Transaction model)
    ↓
Auto-Categorization (Rules engine)
    ↓
AI Classification (Optional, Gemini API)
    ↓
User Review & Approval
```

### Category Taxonomy Flow

```
Legacy System (Text-Based)          Modern System (ID-Based)
┌──────────────────┐               ┌──────────────────┐
│ majorCategory    │ ───────┬───── │ majorCategoryId  │
│ category         │        │      │ categoryId       │
│ subCategory      │ (deprecated)  │ tags[]           │
└──────────────────┘        │      └──────────────────┘
                            │
                    ┌───────▼───────┐
                    │ category-     │
                    │ mapper.ts     │
                    │ (Bidirectional│
                    │  Converter)   │
                    └───────────────┘
```

## State Management

- **React Hooks**: Primary state management (useState, useEffect, useContext)
- **URL Search Params**: Filter state persistence
- **No Redux/Zustand**: Currently uses local component state (proposed improvement in Issue #3)

## Tech Stack

| Layer               | Technologies         | Version | Purpose                   |
| ------------------- | -------------------- | ------- | ------------------------- |
| **Frontend**        | React                | 19.0.0  | UI library                |
|                     | Next.js              | 15.5.9  | React framework with SSR  |
|                     | TypeScript           | 5.7.2   | Type safety               |
|                     | Tailwind CSS         | 3.4.17  | Styling framework         |
| **Backend**         | Next.js API Routes   | 15.5.9  | Serverless API            |
|                     | Node.js              | 22.10.5 | Runtime                   |
| **Database**        | PostgreSQL           | (Neon)  | Primary database          |
|                     | Prisma ORM           | 6.19.2  | Database toolkit          |
| **Authentication**  | JWT                  | 9.0.2   | Token-based auth          |
|                     | bcryptjs             | 2.4.3   | Password hashing          |
| **Rate Limiting**   | @upstash/redis       | latest  | Serverless Redis client   |
|                     | @upstash/ratelimit   | latest  | Redis-based rate limiting |
| **AI/ML**           | Google Generative AI | 0.21.0  | Gemini 2.5 Flash          |
| **File Processing** | xlsx                 | 0.18.5  | Excel parsing             |
|                     | papaparse            | 5.4.1   | CSV parsing               |
|                     | pdfjs-dist           | 4.9.155 | PDF reading               |
|                     | pdf-parse            | 1.1.1   | PDF extraction            |
| **Visualization**   | Recharts             | 3.6.0   | Charts (line, bar, pie)   |
|                     | @nivo/sankey         | 0.99.0  | Sankey flow diagrams      |
|                     | @xyflow/react        | 12.10.0 | Flow diagrams             |
| **UI Components**   | Lucide React         | 0.460.0 | Icons (70+ mapped)        |
| **Deployment**      | Vercel               | -       | Hosting platform          |

## Directory Structure

```
family_finances/
├── app/                              # Next.js App Router
│   ├── api/                          # API Routes (Serverless Functions)
│   │   ├── auth/route.ts             # POST: login/register/logout
│   │   ├── ai/                       # AI Services
│   │   │   ├── categorize/route.ts   # POST: Legacy bulk categorization
│   │   │   ├── feedback/route.ts     # POST: AI feedback collection
│   │   │   └── parse-file/route.ts   # POST: AI file parsing (PDF/images)
│   │   ├── banks/route.ts            # GET/POST: Bank management
│   │   ├── categories/               # Category taxonomy
│   │   │   ├── route.ts              # GET: Fetch taxonomy
│   │   │   └── manage/route.ts       # POST/PATCH/DELETE: CRUD categories
│   │   ├── rules/route.ts            # GET/POST/DELETE: Categorization rules
│   │   ├── tags/route.ts             # GET/POST: Tag definitions
│   │   └── transactions/             # Core transaction operations
│   │       ├── route.ts              # GET/POST/PATCH/DELETE: CRUD
│   │       ├── ai-classify/route.ts  # POST: AI single classification
│   │       ├── auto-categorize/route.ts # POST: Rule-based categorization
│   │       ├── cash-flow/route.ts    # GET: Sankey diagram data
│   │       ├── review/route.ts       # GET: Transactions pending review
│   │       ├── stats/route.ts        # GET: Dashboard statistics
│   │       └── suggest-categories/route.ts # POST: Batch suggestions
│   ├── page.tsx                      # Main SPA (64KB monolith - ISSUE #1)
│   ├── cash-flow/page.tsx            # Cash flow visualization
│   ├── design/page.tsx               # Design system showcase
│   ├── layout.tsx                    # Root layout with dark mode
│   ├── error.tsx                     # Error boundary
│   └── globals.css                   # Tailwind + custom styles
├── components/                       # React Components
│   ├── ui/                           # Reusable UI components
│   │   ├── AIClassifier.tsx          # AI classification button
│   │   ├── BankSelector.tsx          # Bank dropdown
│   │   ├── CategoryBadge.tsx         # Category pill display
│   │   ├── CategorySelector.tsx      # Category cascading dropdown
│   │   ├── DateInput.tsx             # Date picker
│   │   ├── IconPicker.tsx            # Icon selection modal
│   │   ├── OriginAvatar.tsx          # User/origin indicator
│   │   ├── Select.tsx                # Generic select component
│   │   ├── TagDisplay.tsx            # Tag rendering
│   │   ├── TagSelector.tsx           # Tag input with autocomplete
│   │   └── TextInput.tsx             # Generic text input
│   └── feature/                      # Feature-specific components
│       └── cash-flow/
│           ├── CashFlowDiagram.tsx   # Flow chart
│           ├── CashFlowNode.tsx      # Custom node renderer
│           └── SankeyDiagram.tsx     # Sankey visualization
├── contexts/                         # React Contexts (emerging)
├── lib/                              # Utility Libraries
│   ├── ai-classifier.ts              # AI categorization with Gemini
│   ├── auth.ts                       # JWT + bcrypt authentication
│   ├── bank-normalizer.ts            # Bank name normalization
│   ├── categories.ts                 # Category taxonomy + 60 default rules
│   ├── category-mapper.ts            # Bidirectional ID ↔ name mapping
│   ├── db.ts                         # Prisma client singleton
│   ├── format.ts                     # pt-PT localization helpers
│   ├── gemini.ts                     # Google Generative AI client
│   ├── icons.ts                      # Lucide icon mappings (70+)
│   ├── parsers.ts                    # File parsing orchestrator
│   ├── parsers/                      # Bank-specific parsers
│   │   ├── edenred.ts                # Edenred JSON parser
│   │   ├── moey.ts                   # Moey PDF parser (with Gemini Vision)
│   │   └── revolut.ts                # Revolut CSV parser
│   └── rate-limiter.ts               # Redis-based rate limiter
├── prisma/                           # Database Layer
│   ├── schema.prisma                 # Database schema (13 models)
│   ├── seed-taxonomy-v4.js           # Category taxonomy seeder
│   └── seed-tag-definitions.js       # Tag definitions seeder
├── scripts/                          # Utility Scripts
│   ├── backup-database.js            # Database backup utility
│   ├── check-subcategories.js        # Category verification
│   └── migration/                    # Data migration scripts
├── public/                           # Static Assets
│   └── logos/                        # Bank logos
├── backups/                          # Database backups (gitignored)
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Template for environment vars
└── docs/                             # Documentation
    ├── ARCHITECTURE.md               # This file
    ├── DATABASE.md                   # Database schema
    ├── API_REFERENCE.md              # API endpoints
    ├── COMPONENTS.md                 # Component documentation
    ├── DEVELOPMENT_GUIDE.md          # Development tasks & best practices
    └── SECURITY.md                   # Security notes
```

## Component Architecture

See [COMPONENTS.md](COMPONENTS.md) for detailed component documentation.

## Related Documentation

- [Main Guide](../CLAUDE.md) - Project overview and quick start
- [Database Schema](DATABASE.md) - Complete database documentation
- [API Reference](API_REFERENCE.md) - All API endpoints
- [Development Guide](DEVELOPMENT_GUIDE.md) - Common tasks and best practices
- [Security](SECURITY.md) - Security notes and known issues
