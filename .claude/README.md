# ClaudeKit-Inspired Agent System

> **Purpose**: Automated AI agent orchestration for streamlined development workflows
> **Architecture**: 3-tier command system (Commands → Agents → Skills)
> **Status**: ✅ Production-ready (9 agents, 7 skills, 15 commands)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Agents](#agents)
4. [Skills](#skills)
5. [Commands](#commands)
6. [Workflows](#workflows)
7. [Configuration](#configuration)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This project implements a **ClaudeKit-inspired agent orchestration system** tailored specifically to the family_finances tech stack (Next.js 15, Prisma, PostgreSQL, TanStack Query, Vitest).

### What Problem Does This Solve?

**Before Agent System:**

- ❌ 50+ manual database scripts requiring manual execution
- ❌ Repetitive test generation for 85% coverage requirement
- ❌ Manual build verification (prisma generate → build → lint → typecheck)
- ❌ Branch protection via manual AI compliance
- ❌ Multi-step workflows requiring multiple commands

**After Agent System:**

- ✅ Automated database operations via `/db:backup`, `/db:restore`, `/db:migrate`
- ✅ Automated test generation and coverage enforcement via `/test:generate`, `/test:coverage`
- ✅ Automated build verification via `/build:verify`
- ✅ Enforced branch protection via `/git:cm`, `/git:pr`
- ✅ Full feature workflows via single `/cook` command

### Key Features

- **9 Specialized Agents** - Each with a single, clear responsibility
- **7 Auto-Detected Skills** - Progressive disclosure based on file presence
- **15 Slash Commands** - Encapsulate complex multi-agent workflows
- **Orchestration Patterns** - Sequential, parallel, and conditional execution
- **Context Efficiency** - Skills load only when needed (saves context window)

---

## Architecture

### 3-Tier Command System

```
┌─────────────────────────────────────────────────────────────┐
│                     COMMANDS (User Interface)                │
│  /cook, /git:cm, /test:coverage, /db:backup, etc.          │
└────────────────────┬────────────────────────────────────────┘
                     │ triggers
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AGENTS (Specialized AI Collaborators)           │
│  feature-builder, db-specialist, test-engineer, etc.        │
└────────────────────┬────────────────────────────────────────┘
                     │ activates
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            SKILLS (Domain Knowledge Modules)                 │
│  nextjs-15-skill, prisma-postgres-skill, vitest-skill, etc. │
└─────────────────────────────────────────────────────────────┘
```

### How It Works

1. **User invokes a command**: `/cook "Add budget tracking feature"`
2. **Command triggers agent(s)**: `feature-planner` → `feature-builder` → `test-engineer` → `code-auditor` → `git-guardian` → `docs-keeper`
3. **Agents activate skills**: Auto-detect based on files (e.g., `next.config.ts` → `nextjs-15-skill`)
4. **Agents execute workflows**: Sequential, parallel, or conditional
5. **Output delivered**: Implemented feature, tests, review, commit, PR, updated docs

### Progressive Disclosure

Skills auto-activate based on file presence to avoid context bloat:

- **Detects** `next.config.ts` → **Loads** `nextjs-15-skill`
- **Detects** `prisma/schema.prisma` → **Loads** `prisma-postgres-skill`
- **Detects** `vitest.config.ts` → **Loads** `vitest-skill`
- **Detects** `@tanstack/react-query` in package.json → **Loads** `tanstack-query-skill`

**Result**: Only relevant skills are loaded, saving context for actual work.

---

## Agents

This project has **9 specialized agents**, each with a single responsibility.

### Agent Directory

| Agent                                        | Role                              | Priority | Commands                                           |
| -------------------------------------------- | --------------------------------- | -------- | -------------------------------------------------- |
| [feature-builder](agents/feature-builder.md) | Full-stack feature implementation | P0       | `/cook`, `/feature`                                |
| [db-specialist](agents/db-specialist.md)     | Database operations, migrations   | P0       | `/db:backup`, `/db:restore`, `/db:migrate`         |
| [test-engineer](agents/test-engineer.md)     | Test generation, 85% coverage     | P0       | `/test:generate`, `/test:coverage`                 |
| [code-auditor](agents/code-auditor.md)       | Security & performance review     | P0       | `/review`, `/audit:security`, `/audit:performance` |
| [git-guardian](agents/git-guardian.md)       | Git workflow enforcement          | P0       | `/git:cm`, `/git:pr`, `/ship`                      |
| [feature-planner](agents/feature-planner.md) | Implementation planning           | P0       | `/plan`                                            |
| [bug-hunter](agents/bug-hunter.md)           | Debugging & root cause analysis   | P1       | `/fix`                                             |
| [docs-keeper](agents/docs-keeper.md)         | Documentation synchronization     | P1       | `/docs:sync`, `/docs:changelog`                    |
| [tech-researcher](agents/tech-researcher.md) | Research patterns & libraries     | P1       | N/A (activated by other agents)                    |

**For detailed agent documentation**: See [agents/README.md](agents/README.md)

### Agent Orchestration Patterns

**Sequential Execution** (dependencies):

```
feature-planner → feature-builder → test-engineer → code-auditor → git-guardian
```

**Parallel Execution** (independent tasks):

```
tech-researcher (research approaches)
    ↓
feature-planner (create plan using research)
```

**Conditional Execution** (based on results):

```
code-auditor (review code)
    ↓
IF review passes → git-guardian (commit + PR)
IF review fails → bug-hunter (fix issues)
```

---

## Skills

This project has **7 skills** with auto-detection based on file presence.

### Skills Directory

| Skill                                                                      | Auto-Detect Trigger                     | Content                                                      | Always Active? |
| -------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ | -------------- |
| [nextjs-15-skill](skills/nextjs-15-skill/SKILL.md)                         | `next.config.ts`                        | App Router, Server Components, Server Actions                | No             |
| [prisma-postgres-skill](skills/prisma-postgres-skill/SKILL.md)             | `prisma/schema.prisma`                  | Schema design, queries, migrations, composite indexes        | No             |
| [vitest-skill](skills/vitest-skill/SKILL.md)                               | `vitest.config.ts`                      | Testing patterns, 85% coverage enforcement, test utilities   | No             |
| [tanstack-query-skill](skills/tanstack-query-skill/SKILL.md)               | `@tanstack/react-query` in package.json | React Query patterns, caching, mutations, optimistic updates | No             |
| [gemini-classification-skill](skills/gemini-classification-skill/SKILL.md) | `lib/services/gemini.ts`                | AI transaction categorization (99.96% success rate)          | No             |
| [vercel-deployment-skill](skills/vercel-deployment-skill/SKILL.md)         | `vercel.json` or `.vercel/`             | Deployment strategy, $0/month approach, edge config          | No             |
| [financial-domain-skill](skills/financial-domain-skill/SKILL.md)           | N/A                                     | Wealth progression (ADR-001), money movements (ADR-002)      | **Yes**        |

**For detailed skill documentation**: See [skills/README.md](skills/README.md)

### Skill Structure

Each skill follows this directory structure:

```
skills/<skill-name>/
├── SKILL.md                 # Required: Frontmatter + instructions
├── scripts/                 # Optional: Executable scripts
│   └── *.js or *.ts
├── references/              # Optional: Documentation for Claude
│   └── *.md
└── assets/                  # Optional: Templates, configs
    └── *
```

---

## Commands

This project has **15 slash commands** organized by category.

### Commands Directory

**Development Commands (5):**

- [`/cook [feature]`](commands/cook.md) - Full feature workflow (plan → code → test → review → ship)
- [`/build:verify`](commands/build-verify.md) - Run prisma generate → build → lint → typecheck
- [`/fix [error]`](commands/fix.md) - Activate bug-hunter agent for debugging
- [`/feature [description]`](commands/feature.md) - Alias for `/cook`
- [`/bootstrap`](commands/bootstrap.md) - Analyze codebase, update documentation

**Testing Commands (2):**

- [`/test:generate [file]`](commands/test-generate.md) - Generate comprehensive test file
- [`/test:coverage`](commands/test-coverage.md) - Enforce 85% minimum coverage threshold

**Git Commands (3):**

- [`/git:cm`](commands/git-cm.md) - Smart conventional commit (branch protection + format)
- [`/git:pr`](commands/git-pr.md) - Create pull request with auto-generated description
- [`/ship`](commands/ship.md) - Commit + PR in one command

**Database Commands (3):**

- [`/db:backup`](commands/db-backup.md) - Create incremental backup
- [`/db:restore [timestamp]`](commands/db-restore.md) - Restore from specific backup
- [`/db:migrate [name]`](commands/db-migrate.md) - Run migration script

**Documentation Commands (2):**

- [`/docs:sync`](commands/docs-sync.md) - Update CLAUDE.md, ARCHITECTURE.md, API_REFERENCE.md
- [`/docs:changelog`](commands/docs-changelog.md) - Generate changelog from commits

**For detailed command documentation**: See [commands/README.md](commands/README.md)

---

## Workflows

### Example: `/cook` Workflow (Full Feature Development)

```
User: /cook "Add budget tracking feature"

┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Planning (feature-planner agent)                   │
├─────────────────────────────────────────────────────────────┤
│ → Create phased implementation plan                         │
│ → Identify critical files to modify                         │
│ → Define validation steps                                   │
│ → Output: plans/budget-tracking-YYYYMMDD.md                 │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Implementation (feature-builder agent)             │
├─────────────────────────────────────────────────────────────┤
│ → Auto-detect skills: nextjs-15, prisma-postgres, tanstack  │
│ → Phase 2.1: Database (prisma/schema.prisma)                │
│ → Phase 2.2: Backend API (app/api/budgets/route.ts)         │
│ → Phase 2.3: Frontend UI (app/features/budget/*.tsx)        │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Testing (test-engineer agent)                      │
├─────────────────────────────────────────────────────────────┤
│ → Generate unit tests for utilities                         │
│ → Generate API route tests                                  │
│ → Generate component tests                                  │
│ → Run coverage check (enforce 85% minimum)                  │
│ → Output: ✅ Coverage: 92% (threshold: 85%)                 │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Review (code-auditor agent)                        │
├─────────────────────────────────────────────────────────────┤
│ → Security audit (CSRF, XSS, SQL injection)                 │
│ → Performance analysis (bundle size, N+1 queries)           │
│ → Standards compliance (TypeScript strict mode)             │
│ → Output: ✅ Review passed                                  │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: Git Operations (git-guardian agent)                │
├─────────────────────────────────────────────────────────────┤
│ → Verify branch protection (not on main/develop)            │
│ → Generate conventional commit message                      │
│ → Create commit with Co-Authored-By tag                     │
│ → Create pull request                                       │
│ → Output: PR #123 created                                   │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: Documentation (docs-keeper agent)                  │
├─────────────────────────────────────────────────────────────┤
│ → Update CLAUDE.md changelog                                │
│ → Update ARCHITECTURE.md (if needed)                        │
│ → Output: Documentation updated                             │
└─────────────────────────────────────────────────────────────┘

Result: Fully implemented feature with:
  ✅ Implementation plan
  ✅ Complete feature code
  ✅ Tests with ≥85% coverage
  ✅ Code review passed
  ✅ Conventional commit created
  ✅ Pull request opened
  ✅ Documentation updated
```

### Example: `/git:cm` Workflow (Smart Conventional Commit)

```
User: /git:cm

┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Branch Verification                                │
├─────────────────────────────────────────────────────────────┤
│ → Check current branch: git branch --show-current           │
│ → If main or develop: create feature branch automatically   │
│ → Output: ✅ On feature/budget-tracking                     │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Analyze Changes                                    │
├─────────────────────────────────────────────────────────────┤
│ → git status (see all untracked files)                      │
│ → git diff --staged (see staged changes)                    │
│ → git diff (see unstaged changes)                           │
│ → git log --oneline -10 (reference commit message style)    │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Generate Commit Message                            │
├─────────────────────────────────────────────────────────────┤
│ → Determine commit type (feat, fix, docs, perf, etc.)       │
│ → Write concise message (focus on "why" not "what")         │
│ → Add Co-Authored-By tag                                    │
│ → Format: type(scope): description                          │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Create Commit                                      │
├─────────────────────────────────────────────────────────────┤
│ → git add [relevant files]                                  │
│ → git commit with generated message                         │
│ → Output:                                                    │
│   feat(budgets): add monthly budget tracking feature        │
│                                                              │
│   Implements budget creation, editing, and alerts.          │
│                                                              │
│   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com> │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: Verify Commit                                      │
├─────────────────────────────────────────────────────────────┤
│ → git status (confirm clean working tree)                   │
│ → git log -1 (show created commit)                          │
│ → Output: ✅ Commit created successfully                    │
└─────────────────────────────────────────────────────────────┘

Result:
  ✅ Branch protection verified
  ✅ Conventional commit created
  ✅ Co-Authored-By tag added
  ✅ Commit verified
```

---

## Configuration

### Directory Structure

```
.claude/
├── README.md                    # This file
├── settings.json                # Agent configuration (future)
├── agents/                      # Agent definitions (9 files)
│   ├── README.md               # Agent catalog
│   ├── feature-builder.md
│   ├── db-specialist.md
│   ├── test-engineer.md
│   ├── code-auditor.md
│   ├── git-guardian.md
│   ├── feature-planner.md
│   ├── bug-hunter.md
│   ├── docs-keeper.md
│   └── tech-researcher.md
├── skills/                      # Skill modules (7 skills)
│   ├── README.md               # Skills catalog + auto-detection
│   ├── nextjs-15-skill/
│   │   └── SKILL.md
│   ├── prisma-postgres-skill/
│   │   └── SKILL.md
│   ├── vitest-skill/
│   │   └── SKILL.md
│   ├── tanstack-query-skill/
│   │   └── SKILL.md
│   ├── gemini-classification-skill/
│   │   └── SKILL.md
│   ├── vercel-deployment-skill/
│   │   └── SKILL.md
│   └── financial-domain-skill/
│       └── SKILL.md
├── commands/                    # Command definitions (15 files)
│   ├── README.md               # Command catalog
│   ├── cook.md
│   ├── git-cm.md
│   ├── test-coverage.md
│   ├── db-backup.md
│   └── [11 more commands]
└── workflows/                   # Existing workflow documentation
    └── [existing workflow files]
```

### Agent Configuration (Future)

`.claude/settings.json` (planned):

```json
{
  "agents": {
    "feature-builder": {
      "enabled": true,
      "skills": ["nextjs-15-skill", "prisma-postgres-skill", "tanstack-query-skill"],
      "commands": ["/cook", "/feature"]
    },
    "db-specialist": {
      "enabled": true,
      "skills": ["prisma-postgres-skill"],
      "commands": ["/db:backup", "/db:restore", "/db:migrate"]
    }
  },
  "skills": {
    "auto-detection": true,
    "progressive-disclosure": true
  }
}
```

---

## Usage Examples

### Quick Database Backup

```bash
/db:backup

# Activates: db-specialist agent
# Workflow: node scripts/backup-database.js
# Output: backups/backup-2026-02-12-143000.sql
```

### Generate Tests for File

```bash
/test:generate lib/queries/budgets.ts

# Activates: test-engineer agent
# Output: lib/queries/budgets.test.ts
# Includes: Unit tests, edge cases, error conditions
```

### Enforce Test Coverage

```bash
/test:coverage

# Activates: test-engineer agent
# Workflow: npm run test:coverage
# Output: ✅ Coverage: 92% (threshold: 85%)
```

### Smart Conventional Commit

```bash
/git:cm

# Activates: git-guardian agent
# Workflow:
#   1. Check branch (must NOT be main/develop)
#   2. Analyze changes
#   3. Generate conventional commit message
#   4. Create commit
#   5. Verify success
```

### Create Pull Request

```bash
/git:pr

# Activates: git-guardian agent
# Workflow:
#   1. Push feature branch
#   2. Generate PR title and description
#   3. Create PR with gh pr create
# Output: PR #123 created
```

### Full Feature Development

```bash
/cook "Add monthly budget tracking with alerts"

# Orchestrates 6 agents sequentially:
#   feature-planner → feature-builder → test-engineer →
#   code-auditor → git-guardian → docs-keeper
#
# Output:
#   ✅ Implementation plan created
#   ✅ Feature implemented (database + API + UI)
#   ✅ Tests generated (≥85% coverage)
#   ✅ Code review passed
#   ✅ Commit created + PR opened
#   ✅ Documentation updated
```

---

## Troubleshooting

### Command Not Working

**Symptoms**: Command doesn't trigger agent or returns error

**Solutions**:

1. Verify command exists: Check [commands/README.md](commands/README.md)
2. Check syntax: `/command [arg]` (some commands require arguments)
3. Verify agent file exists: Check `.claude/agents/`
4. Review command definition: Read `.claude/commands/<command>.md`

### Skill Not Auto-Detecting

**Symptoms**: Expected skill doesn't load automatically

**Solutions**:

1. Verify trigger file exists:
   - `nextjs-15-skill` → `next.config.ts`
   - `prisma-postgres-skill` → `prisma/schema.prisma`
   - `vitest-skill` → `vitest.config.ts`
2. Check skill auto-detection rules: See [skills/README.md](skills/README.md)
3. Manually reference skill in command if needed

### Agent Workflow Fails

**Symptoms**: Agent execution stops mid-workflow

**Solutions**:

1. Check agent dependencies: Some agents require others to complete first
2. Verify prerequisites: Tests pass, TypeScript compiles, etc.
3. Review agent definition: Read `.claude/agents/<agent>.md`
4. Check orchestration pattern: Sequential vs parallel vs conditional

### Coverage Enforcement Fails

**Symptoms**: `/test:coverage` reports failure even with passing tests

**Solutions**:

1. Run `npm run test:coverage` manually to see detailed report
2. Check coverage thresholds in `vitest.config.ts`:
   - Statements: 85% minimum
   - Branches: 80% minimum
   - Functions: 85% minimum
   - Lines: 85% minimum
3. Add tests for uncovered files
4. Review coverage report: `coverage/index.html`

### Branch Protection Violation

**Symptoms**: `/git:cm` attempts to commit to main/develop

**Solutions**:

1. This should NEVER happen - git-guardian prevents this
2. If it does, immediately notify user (see CLAUDE.md workflow rules)
3. Create feature branch: `git checkout -b feature/<name>`
4. Move commits to feature branch: `git cherry-pick <commit>`

---

## Contributing

This agent system is designed to be extended. To add new agents, skills, or commands:

**Adding a New Agent:**

1. Create `.claude/agents/<agent-name>.md` following template
2. Define role, capabilities, skills activated, commands
3. Update `.claude/agents/README.md` catalog
4. Update this README's agent directory

**Adding a New Skill:**

1. Create `.claude/skills/<skill-name>/SKILL.md` following template
2. Define auto-detection trigger (if applicable)
3. Add references and scripts as needed
4. Update `.claude/skills/README.md` catalog
5. Update this README's skills directory

**Adding a New Command:**

1. Create `.claude/commands/<command-name>.md` following template
2. Define which agents to activate
3. Define workflow (sequential, parallel, conditional)
4. Update `.claude/commands/README.md` catalog
5. Update this README's commands directory

---

## Acknowledgments

This agent system is inspired by [ClaudeKit](https://github.com/gptscript-ai/claudekit) (49 agents, 108+ skills, 195 commands). We adapted ClaudeKit's proven 3-tier architecture to the specific needs of the family_finances project.

**Key Adaptations:**

- Tailored to Next.js 15 + Prisma + PostgreSQL + TanStack Query stack
- Focused on high-value automation (database ops, testing, git workflows)
- Implemented skill auto-detection for progressive disclosure
- Streamlined to 9 agents (vs 49) for simplicity and maintainability

**References:**

- [ClaudeKit GitHub](https://github.com/gptscript-ai/claudekit)
- [ClaudeKit Documentation](https://github.com/gptscript-ai/claudekit/blob/main/README.md)

---

**End of Guide**

For questions or issues with the agent system, see [Troubleshooting](#troubleshooting) or create an issue on GitHub.
