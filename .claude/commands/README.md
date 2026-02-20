# Commands System

**Version:** 1.0
**Last Updated:** 2026-02-12

---

## Overview

This directory contains slash command definitions that provide user-friendly interfaces to the agent system. Commands encapsulate complex multi-agent workflows into single executable commands.

## How Commands Work

```
User types slash command
    ↓
Command activates agent(s)
    ↓
Agent(s) activate skill(s)
    ↓
Agent(s) execute workflow
    ↓
Result returned to user
```

**Example:** `/cook "Add budget tracking"`

1. Command: `cook.md` defines the workflow
2. Activates: `feature-planner` → `feature-builder` → `test-engineer` → `code-auditor` → `git-guardian`
3. Skills: Auto-detects relevant skills (Next.js, Prisma, Vitest, etc.)
4. Executes: End-to-end feature implementation
5. Result: Fully implemented feature with tests, review, and PR

---

## Available Commands (15 Total)

### Development Commands (5)

| Command                  | Description                                                | Agents Activated                                                            |
| ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `/cook [feature]`        | Full feature workflow (plan → code → test → review → ship) | feature-planner, feature-builder, test-engineer, code-auditor, git-guardian |
| `/build:verify`          | Run prisma generate → build → lint → typecheck             | None (direct execution)                                                     |
| `/fix [error]`           | Debug and fix bugs                                         | bug-hunter                                                                  |
| `/feature [description]` | Alias for `/cook`                                          | Same as /cook                                                               |
| `/bootstrap`             | Analyze codebase, update all specs                         | docs-keeper, tech-researcher                                                |

### Testing Commands (2)

| Command                 | Description                              | Agents Activated |
| ----------------------- | ---------------------------------------- | ---------------- |
| `/test:generate [file]` | Generate test file for source code       | test-engineer    |
| `/test:coverage`        | Run coverage check (enforce 85% minimum) | test-engineer    |

### Git Commands (3)

| Command   | Description                                         | Agents Activated |
| --------- | --------------------------------------------------- | ---------------- |
| `/git:cm` | Smart conventional commit (no AI attribution spam)  | git-guardian     |
| `/git:pr` | Create pull request with auto-generated description | git-guardian     |
| `/ship`   | Commit + PR in one command                          | git-guardian     |

### Database Commands (3)

| Command                   | Description                  | Agents Activated |
| ------------------------- | ---------------------------- | ---------------- |
| `/db:backup`              | Incremental database backup  | db-specialist    |
| `/db:restore [timestamp]` | Restore from specific backup | db-specialist    |
| `/db:migrate [name]`      | Run migration script         | db-specialist    |

### Documentation Commands (2)

| Command           | Description                                         | Agents Activated |
| ----------------- | --------------------------------------------------- | ---------------- |
| `/docs:sync`      | Update CLAUDE.md, ARCHITECTURE.md, API_REFERENCE.md | docs-keeper      |
| `/docs:changelog` | Generate changelog from commits                     | docs-keeper      |

---

## Command File Structure

Each command is defined in a markdown file:

```
.claude/commands/
├── cook.md                  # /cook command
├── build-verify.md          # /build:verify command
├── test-coverage.md         # /test:coverage command
├── git-cm.md                # /git:cm command
└── [other commands]
```

**Command File Template:**

````markdown
---
name: command-name
description: Brief description of what this command does
agents: [list of agents activated]
---

# Command Name

## Purpose

What this command accomplishes

## Workflow

Step-by-step execution process

## Usage

```bash
/command-name [args]
```
````

## Examples

Concrete usage examples

## Output

What the user should expect to see

```

---

## Command Invocation

**How to use commands:**

Since Claude Code doesn't have native custom slash command support, commands are invoked by:

1. **Direct Request:** "Run the /cook command for adding budget tracking"
2. **Workflow Description:** "Follow the cook command workflow to implement this feature"
3. **Agent Activation:** "Activate the agents specified in cook.md"

**Claude (this AI) will:**
- Read the command's .md file
- Follow the workflow defined in the file
- Activate agents sequentially or in parallel as specified
- Execute the complete workflow
- Return results to user

---

## Command Orchestration Patterns

### Sequential Execution

**Use when:** Later agents depend on earlier agent outputs

**Example:** `/cook` command
```

feature-planner (creates plan)
↓ plan output
feature-builder (uses plan to implement)
↓ code output
test-engineer (generates tests for code)
↓ tests output
code-auditor (reviews code + tests)
↓ review output
git-guardian (commits if review passes)

```

### Parallel Execution

**Use when:** Agents can run independently

**Example:** `/bootstrap` command
```

docs-keeper (updates CLAUDE.md) ║ tech-researcher (researches patterns)
────────────────────────────────║────────────────────────────────────
Both complete independently, results merged

```

### Conditional Execution

**Use when:** Agent activation depends on conditions

**Example:** `/cook` command
```

code-auditor reviews code
↓
If review passes → git-guardian commits
If review fails → bug-hunter fixes issues → re-review

```

---

## Creating New Commands

**Steps to add a new command:**

1. **Create command file:** `.claude/commands/your-command.md`
2. **Define workflow:** Specify agents, skills, and execution order
3. **Add to README:** Update this file's "Available Commands" table
4. **Test workflow:** Verify agents activate correctly and produce expected output
5. **Document usage:** Add examples to command file

**Command Naming Conventions:**
- Use kebab-case: `build-verify`, `test-coverage`
- Use namespace prefixes: `git:cm`, `db:backup`, `docs:sync`
- Keep names short and descriptive: `/cook`, `/ship`, `/fix`

---

## Command Testing

**Verification Checklist:**
- [ ] Command file exists and follows template
- [ ] All referenced agents exist
- [ ] All referenced skills exist
- [ ] Workflow steps are clear and executable
- [ ] Usage examples are concrete
- [ ] Expected output is documented
- [ ] Command added to this README

**Integration Testing:**
- Run command with test data
- Verify all agents activate in correct order
- Verify output matches expected format
- Verify error handling works

---

## Future Commands (Potential)

**Not implemented yet, but could be useful:**
- `/deploy:preview` - Deploy to Vercel preview environment
- `/audit:security` - Security audit of codebase
- `/audit:performance` - Performance analysis (bundle size, queries)
- `/refactor [file]` - Refactor code following project patterns
- `/test:api [route]` - Generate API route test
- `/test:benchmark [file]` - Create benchmark script

---

**End of Commands System Documentation**
```
