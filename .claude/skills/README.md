# Skills Auto-Detection System

**Version:** 1.0
**Last Updated:** 2026-02-12

---

## Overview

This directory contains domain-specific knowledge modules (skills) that agents activate automatically based on codebase detection. Skills use **progressive disclosure** - they load only when relevant files are present, preventing context window bloat.

---

## How Auto-Detection Works

### Detection Triggers

Each skill defines an **auto-activation trigger** - a specific file or pattern that indicates the skill is relevant.

**Examples:**

- Detect `next.config.ts` → Load `nextjs-15-skill`
- Detect `prisma/schema.prisma` → Load `prisma-postgres-skill`
- Detect `vitest.config.ts` → Load `vitest-skill`

### Progressive Disclosure

Skills are loaded lazily:

1. **Bootstrap Phase:** Check for trigger files when session starts
2. **Lazy Loading:** Load additional skills when specific files are accessed
3. **Context Management:** Unload skills no longer needed

This prevents loading all 7 skills at once (which would consume ~50k tokens), instead loading 1-3 relevant skills (~10-15k tokens).

---

## Skill Directory Structure

Each skill follows this structure:

```
.claude/skills/
├── [skill-name]/
│   ├── SKILL.md              # Required: Frontmatter + instructions
│   ├── references/           # Optional: Documentation for context
│   │   └── *.md
│   ├── scripts/              # Optional: Executable automation
│   │   └── *.js or *.ts
│   └── assets/               # Optional: Templates, configs
│       └── *
└── README.md                 # This file
```

---

## Available Skills

| Skill Name                      | Auto-Detect Trigger                     | Priority | Status    |
| ------------------------------- | --------------------------------------- | -------- | --------- |
| **nextjs-15-skill**             | `next.config.ts` exists                 | P0       | ✅ Active |
| **prisma-postgres-skill**       | `prisma/schema.prisma` exists           | P0       | ✅ Active |
| **vitest-skill**                | `vitest.config.ts` exists               | P0       | ✅ Active |
| **tanstack-query-skill**        | `@tanstack/react-query` in package.json | P0       | ✅ Active |
| **gemini-classification-skill** | `lib/services/gemini.ts` exists         | P1       | ✅ Active |
| **vercel-deployment-skill**     | `vercel.json` or `.vercel/` exists      | P1       | ✅ Active |
| **financial-domain-skill**      | Always active                           | P1       | ✅ Active |

---

## Skill Creation Standards

### SKILL.md Frontmatter

```yaml
---
name: skill-name
description: When to use this skill (1-2 sentences, third-person)
auto_detect: path/to/trigger/file.ext
license: MIT
---
```

### Required Sections

1. **Purpose** - What problem does this skill solve?
2. **When to Use** - Specific triggers that should invoke this skill
3. **Capabilities** - What can this skill do?
4. **Usage Examples** - Concrete examples with expected output
5. **Implementation Notes** - Project-specific context, gotchas, dependencies

### Validation Checklist

Before finalizing any skill:

- [ ] YAML frontmatter present with `name`, `description`, and `auto_detect`
- [ ] Description is third-person ("This skill should be used when...")
- [ ] All referenced scripts exist and are executable
- [ ] All referenced `references/` files exist
- [ ] SKILL.md is under 5,000 words (if larger, split into references/)
- [ ] Scripts have `--help` flag (if applicable)
- [ ] Usage examples are concrete and testable
- [ ] No hardcoded paths (use relative paths or env vars)

---

## Agent-Skill Mapping

**Which agents activate which skills:**

| Agent               | Skills Activated                                                                     |
| ------------------- | ------------------------------------------------------------------------------------ |
| **feature-builder** | nextjs-15-skill, prisma-postgres-skill, tanstack-query-skill, financial-domain-skill |
| **db-specialist**   | prisma-postgres-skill                                                                |
| **test-engineer**   | vitest-skill, tanstack-query-skill                                                   |
| **code-auditor**    | nextjs-15-skill, prisma-postgres-skill (performance review)                          |
| **git-guardian**    | None (pure git workflow logic)                                                       |
| **feature-planner** | Dynamically activates based on feature type                                          |
| **bug-hunter**      | Dynamically activates based on error location                                        |
| **docs-keeper**     | None (pure documentation logic)                                                      |
| **tech-researcher** | None (researches external resources)                                                 |

---

## Context Window Management

**Token Budget per Skill:**

- Small skill (~2,000 words): ~3k tokens
- Medium skill (~4,000 words): ~6k tokens
- Large skill (~8,000 words): ~12k tokens

**Total Context Window:** 200k tokens (Claude Sonnet 4.5)
**Reserved for Skills:** ~20k tokens (max 3-4 skills active simultaneously)
**Strategy:** Load only what's needed, unload after use

---

## Examples

### Example 1: Feature Implementation

**User Request:** "Add budget tracking feature"

**Auto-Detection:**

1. Detect `next.config.ts` → Load `nextjs-15-skill`
2. Detect `prisma/schema.prisma` → Load `prisma-postgres-skill`
3. Detect `@tanstack/react-query` → Load `tanstack-query-skill`
4. Always load `financial-domain-skill`

**Agent Activation:** `feature-builder` agent with 4 skills loaded

### Example 2: Test Generation

**User Request:** "Generate tests for transaction API"

**Auto-Detection:**

1. Detect `vitest.config.ts` → Load `vitest-skill`
2. Detect `@tanstack/react-query` → Load `tanstack-query-skill`

**Agent Activation:** `test-engineer` agent with 2 skills loaded

### Example 3: Database Migration

**User Request:** "Create migration to add budget table"

**Auto-Detection:**

1. Detect `prisma/schema.prisma` → Load `prisma-postgres-skill`

**Agent Activation:** `db-specialist` agent with 1 skill loaded

---

## Skill Updates

**When to update skills:**

- Tech stack version changes (e.g., Next.js 15 → 16)
- New project patterns emerge
- Performance optimizations discovered
- Security best practices change

**Update Process:**

1. Edit SKILL.md or add new references/
2. Test with relevant agent
3. Commit with `docs(skills): update [skill-name]`
4. Document changes in skill's SKILL.md

---

**End of Auto-Detection System Documentation**
