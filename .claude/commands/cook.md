# Cook Command (`/cook`)

---

name: cook
description: Full feature development workflow from planning to production (plan → code → test → review → commit → PR → docs)
agents: [feature-planner, feature-builder, test-engineer, code-auditor, git-guardian, docs-keeper]

---

## Purpose

Orchestrates the complete feature development lifecycle, from initial planning through production deployment. Automates the entire workflow that would normally require manual coordination of multiple tasks.

## Workflow

### Phase 1: Planning (feature-planner agent)

1. Activate **feature-planner** agent
2. Load **planning-skill**
3. Create implementation plan with phases, tasks, validation steps
4. Save plan to `plans/YYYY-MM-DD-[feature].md`
5. **Output:** Phased implementation plan with critical files and acceptance criteria

### Phase 2: Implementation (feature-builder agent)

1. Activate **feature-builder** agent
2. Auto-detect and load relevant skills:
   - `nextjs-15-skill` (if `next.config.ts` exists)
   - `prisma-postgres-skill` (if `prisma/schema.prisma` exists)
   - `tanstack-query-skill` (if `@tanstack/react-query` in package.json)
   - `financial-domain-skill` (always active)
3. Implement feature phase-by-phase following plan
4. Use progressive disclosure (load plan sections as needed to save context)
5. **Output:** Fully implemented feature across database, API, and frontend

### Phase 3: Testing (test-engineer agent)

1. Activate **test-engineer** agent
2. Load `vitest-skill`
3. Generate tests for new code:
   - Unit tests for utilities
   - API route tests for endpoints
   - Component tests for UI
4. Run coverage check: `npm run test:coverage`
5. Enforce 85% minimum coverage threshold
6. **Output:** Test files with ≥85% coverage

### Phase 4: Review (code-auditor agent)

1. Activate **code-auditor** agent
2. Load relevant skills for review context
3. Perform multi-perspective review:
   - **Security:** Check for CSRF, XSS, SQL injection, auth vulnerabilities
   - **Performance:** Analyze bundle size, query optimization, N+1 problems
   - **Standards:** Verify TypeScript strict mode, conventional commits
   - **Architecture:** Ensure feature-based structure, separation of concerns
4. Generate review report with findings
5. **Output:** Code review report (pass/fail + recommended fixes)

### Phase 5: Git Operations (git-guardian agent) - **IF REVIEW PASSES**

1. Activate **git-guardian** agent
2. Verify branch protection compliance:
   - Current branch is NOT `main` or `develop`
   - If on protected branch, create feature branch automatically
3. Run build verification:
   - `npx prisma generate`
   - `npm run build`
   - `npm run lint`
   - `npx tsc --noEmit`
4. Create conventional commit:
   - Format: `feat(scope): description`
   - Include Co-Authored-By tag
   - No AI attribution spam
5. Create pull request:
   - Auto-generate PR description with summary, changes, test plan
   - Link to related issues
   - Request reviewers
6. **Output:** Commit created + PR URL

### Phase 6: Documentation (docs-keeper agent)

1. Activate **docs-keeper** agent
2. Update project documentation:
   - `CLAUDE.md` - Add to recent changes if significant
   - `ARCHITECTURE.md` - Document architectural changes (if any)
   - `API_REFERENCE.md` - Document new API endpoints (if any)
3. Generate changelog entry from commit message
4. **Output:** Updated documentation files

---

## Usage

```bash
/cook "Add budget tracking feature"
/cook "Implement recurring transaction detection"
/cook "Create expense analytics dashboard"
```

**Syntax:**

```
/cook "[feature description]"
```

**Arguments:**

- `[feature description]` - Brief description of the feature to implement (1-2 sentences)

---

## Examples

### Example 1: Simple Feature

**Command:**

```bash
/cook "Add note field to transactions"
```

**Workflow:**

1. **Planning:** Create plan with 3 phases (database, API, frontend)
2. **Implementation:**
   - Add `note` field to `Transaction` model in Prisma schema
   - Create migration
   - Update API routes to accept `note` field
   - Add `note` input field to transaction form
3. **Testing:** Generate tests for API endpoints and form component
4. **Review:** Security check (input validation), performance check (no impact)
5. **Git:** Commit with message `feat(transactions): add note field for user comments`
6. **Documentation:** Update API reference with new field

**Output:**

```
✅ Plan created: plans/2026-02-12-transaction-notes.md
✅ Feature implemented (5 files changed)
✅ Tests generated (98% coverage)
✅ Code review passed (no issues found)
✅ Commit created: feat(transactions): add note field for user comments
✅ PR created: https://github.com/.../pull/123
✅ Documentation updated
```

### Example 2: Complex Feature

**Command:**

```bash
/cook "Add budget tracking feature with alerts"
```

**Workflow:**

1. **Planning:** Create plan with 5 phases (database, API, hooks, UI, notifications)
2. **Implementation:**
   - Add `Budget` model to Prisma schema
   - Create migration
   - Create `/api/budgets` endpoints (GET, POST, PATCH, DELETE)
   - Create TanStack Query hooks (`useBudgets`, `useCreateBudget`, etc.)
   - Create `BudgetForm` and `BudgetList` components
   - Add budget alerts logic
3. **Testing:** Generate 42 tests (API routes, hooks, components)
4. **Review:** Performance analysis (added index for `userId+categoryId`)
5. **Git:** Commit with detailed description
6. **Documentation:** Update ARCHITECTURE.md with budget system design

**Output:**

```
✅ Plan created: plans/2026-02-12-budget-tracking.md (5 phases)
✅ Feature implemented (12 files changed, +1,234 lines)
✅ Tests generated (42 tests, 96% coverage)
✅ Code review passed (1 recommendation: add composite index)
✅ Composite index added: @@index([userId, categoryId])
✅ Commit created: feat(budgets): add monthly budget tracking with alerts
✅ PR created: https://github.com/.../pull/124
✅ Documentation updated (ARCHITECTURE.md, API_REFERENCE.md)
```

---

## Output

**Success Case:**

```
🍳 /cook command executed successfully

📋 Phase 1: Planning
   ✅ Implementation plan created
   📄 plans/2026-02-12-[feature].md

💻 Phase 2: Implementation
   ✅ Feature implemented
   📦 N files changed (+X lines, -Y lines)

🧪 Phase 3: Testing
   ✅ Tests generated
   📊 Coverage: XX% (threshold: 85%)

🔍 Phase 4: Code Review
   ✅ Review passed
   📝 [Review report summary]

📦 Phase 5: Git Operations
   ✅ Commit created
   ✅ PR created: [PR URL]

📚 Phase 6: Documentation
   ✅ Documentation updated

✨ Feature complete and ready for human review!
```

**Failure Case (Review Fails):**

```
🍳 /cook command - Review failed

📋 Phase 1-3: Completed ✅
🔍 Phase 4: Code Review ❌

Issues Found:
❌ Security: Missing input validation on amount field
❌ Performance: N+1 query detected in budget list
⚠️  Standards: Missing TypeScript types for Budget interface

Recommended Actions:
1. Add Zod validation schema for budget input
2. Add `include: { category: true }` to reduce queries
3. Define Budget interface in types/

Would you like me to:
- /fix "Apply review recommendations" (auto-fix issues)
- Continue manually (you fix issues)
- Skip review and commit anyway (NOT RECOMMENDED)
```

---

## Error Handling

**Common Issues:**

**1. Planning Phase Fails (Unclear Requirements)**

```
❌ Error: Feature description too vague

Solution:
- Use /ask command first to clarify requirements
- Provide more detailed feature description
```

**2. Build Verification Fails**

```
❌ Error: TypeScript compilation failed

Solution:
- Fix TypeScript errors first
- Run /build:verify separately to diagnose
```

**3. Coverage Below Threshold**

```
❌ Error: Coverage 82% (required: 85%)

Solution:
- Add more tests to uncovered code paths
- Run /test:coverage to see coverage report
```

**4. Branch Protection Violation**

```
❌ Error: Cannot commit to protected branch: main

Solution:
- git-guardian agent auto-creates feature branch
- Workflow continues automatically
```

---

## Customization

**Skip Specific Phases:**

Not supported directly, but you can run individual commands:

- Planning only: Use `feature-planner` agent directly
- Implementation only: Use `feature-builder` agent directly
- Testing only: `/test:generate [file]`
- Review only: Use `code-auditor` agent directly
- Git only: `/git:cm` or `/git:pr`

---

## Notes

**Context Window Management:**

- `/cook` uses progressive disclosure to manage large features
- Plan is loaded in sections as needed
- Skills are auto-detected and loaded only when relevant
- Estimated context usage: 30k-50k tokens for medium features

**Time Estimates:**

- Simple features (1-3 files): ~5-10 minutes
- Medium features (4-8 files): ~15-30 minutes
- Complex features (9+ files): ~30-60 minutes

**Human Review:**

- `/cook` automates the workflow, but **human review is still required**
- Review the generated PR before merging
- Verify tests cover edge cases
- Ensure implementation matches requirements

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
