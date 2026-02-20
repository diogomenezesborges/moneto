# Git Guardian Agent

**Role:** Git workflow enforcement, branch protection via AI compliance, conventional commits

**Priority:** P0 (Critical)

**When to Use:** Before ANY git operation - commits, pushes, merges, PR creation

---

## Capabilities

### Branch Protection Enforcement

- Verify current branch is NOT `main` or `develop`
- Create feature branches automatically when on protected branch
- Prevent accidental pushes to protected branches
- Enforce PR-only workflow (no direct merges)

### Conventional Commits

- Generate semantic commit messages automatically
- Follow format: `type(scope): description`
- Add Co-Authored-By tag (removing AI attribution spam)
- Ensure commit messages are clear and descriptive

### Pull Request Management

- Create PRs with auto-generated descriptions
- Link to related issues automatically
- Request appropriate reviewers
- Generate changelog entries from commit messages

---

## Skills Activated

None (pure git workflow logic)

---

## Commands

### `/git:cm`

Smart conventional commit with branch protection checks

**Workflow:**

1. **Branch verification**

   ```bash
   current_branch=$(git branch --show-current)

   if [[ "$current_branch" == "main" || "$current_branch" == "develop" ]]; then
     echo "❌ ERROR: Cannot commit to protected branch: $current_branch"
     echo "Creating feature branch instead..."
     git checkout -b feature/auto-created-$(date +%Y%m%d-%H%M%S)
   fi
   ```

2. **Analyze changes**

   ```bash
   git status
   git diff --staged
   git diff
   git log --oneline -10  # For commit message style reference
   ```

3. **Generate commit message**
   - Analyze staged + unstaged changes
   - Determine commit type (feat, fix, docs, refactor, test, chore)
   - Write concise message focusing on "why" not "what"
   - Add Co-Authored-By tag

4. **Create commit**

   ```bash
   git add [files]
   git commit -m "$(cat <<'EOF'
   feat(budgets): add monthly budget tracking feature

   Implements budget creation, editing, and alerts when
   spending exceeds budgeted amount.

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

5. **Verify commit**
   ```bash
   git status
   git log -1  # Show created commit
   ```

**Example:**

```bash
/git:cm
```

**Output:**

```
✅ Branch verification passed (on feature/budget-tracking)
✅ Commit created successfully

Commit: feat(budgets): add monthly budget tracking feature
Files changed: 5
Insertions: +234
Deletions: -12

Next steps:
- Run /test:coverage to verify tests pass
- Run /git:pr to create pull request
```

### `/git:pr`

Create pull request with auto-generated description

**Workflow:**

1. **Pre-flight checks**
   - Verify branch is not `main` or `develop`
   - Check if branch tracks remote (push if needed)
   - Verify commit history exists

2. **Analyze PR content**

   ```bash
   git log develop...HEAD  # All commits for this PR
   git diff develop...HEAD  # All changes for this PR
   ```

3. **Generate PR description**

   ```markdown
   ## Summary

   - Add monthly budget tracking feature
   - Implement budget alerts when overspending
   - Add budget visualization charts

   ## Changes

   - Database: Added `Budget` model with Prisma schema
   - API: Created `/api/budgets` endpoints (GET, POST, PATCH, DELETE)
   - Frontend: Added `BudgetForm` and `BudgetList` components
   - Tests: 98% coverage (42 new tests)

   ## Test Plan

   - [ ] Create new budget
   - [ ] Edit existing budget
   - [ ] Delete budget
   - [ ] Verify alerts trigger when overspending
   - [ ] Test in light and dark mode

   🤖 Generated with Claude Code
   ```

4. **Create PR**

   ```bash
   gh pr create --base develop \
     --title "feat(budgets): add monthly budget tracking" \
     --body "$PR_DESCRIPTION"
   ```

5. **Return PR URL**

**Example:**

```bash
/git:pr
```

**Output:**

```
✅ PR created successfully

Title: feat(budgets): add monthly budget tracking
URL: https://github.com/user/repo/pull/42
Base: develop ← Head: feature/budget-tracking
Commits: 5
Files changed: 12

Reviewers requested:
- (none - manual review required)

CI checks:
- lint: ⏳ pending
- typecheck: ⏳ pending
- tests: ⏳ pending
- build: ⏳ pending
```

### `/ship`

Commit + PR in one command (convenience wrapper)

**Workflow:**

1. Execute `/git:cm` workflow
2. Execute `/git:pr` workflow

**Example:**

```bash
/ship
```

### `/git:verify`

Check branch protection compliance

**Checks:**

- [ ] Current branch is NOT `main` or `develop`
- [ ] Branch naming follows convention (feature/, fix/, docs/, etc.)
- [ ] No uncommitted changes exist
- [ ] All commits follow conventional format
- [ ] Tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)

**Example:**

```bash
/git:verify
```

---

## Branch Protection Rules

### Protected Branches

**NEVER allow AI to:**

- Commit to `main` directly
- Commit to `develop` directly
- Push to `main` directly
- Push to `develop` directly
- Merge without PR approval

**Exception**: Emergency hotfixes with explicit user confirmation protocol

- User MUST say exact phrase: **"commit directly to main"**
- AI confirms: "⚠️ Pushing directly to main as requested"
- AI documents the exception

### Feature Branch Naming

```
feature/[description]  - New features
fix/[description]      - Bug fixes
docs/[description]     - Documentation updates
refactor/[description] - Code refactoring
test/[description]     - Test updates
chore/[description]    - Maintenance tasks
```

### Conventional Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring (no functional changes)
- `test` - Test updates
- `chore` - Maintenance tasks (dependencies, config)
- `perf` - Performance improvements
- `style` - Code formatting (no functional changes)

**Scope:** Feature or module name (e.g., `budgets`, `transactions`, `auth`)

**Description:** Clear, concise summary (max 70 characters)

---

## Commit Message Examples

### Good Examples

```
feat(budgets): add monthly budget tracking

Implements budget creation, editing, and alerts when
spending exceeds budgeted amount. Includes Sankey diagram
visualization of budget vs. actual spending.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix(transactions): resolve duplicate detection bug

Fixes issue where transactions with same amount on same day
were incorrectly flagged as duplicates. Now checks description
and merchant name for better accuracy.

Resolves #142

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
perf(cash-flow): add composite index for date range queries

Adds @@index([userId, date]) to Transaction model, reducing
cash flow query time from 850ms to 12ms on 4,679 transactions.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Bad Examples (Don't Do This)

```
❌ Update code                     # Too vague
❌ WIP                             # Not descriptive
❌ Fixed stuff                     # No context
❌ asdfasdf                        # Meaningless
❌ Changes to budgets              # What changes?
❌ Updated BudgetForm.tsx           # Describes "what" not "why"
```

---

## PR Description Template

```markdown
## Summary

[Brief overview of what this PR does - 2-3 bullet points]

## Changes

[Detailed breakdown by layer]

- **Database**: [Schema changes if any]
- **API**: [New/modified endpoints]
- **Frontend**: [UI components added/updated]
- **Tests**: [Coverage info]

## Test Plan

[Checklist of manual testing steps]

- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

## Screenshots

[If UI changes - include before/after screenshots]

🤖 Generated with Claude Code
```

---

## Pre-Flight Checklist

Before creating commit:

- [ ] On feature branch (NOT main or develop)
- [ ] Changes reviewed and intentional
- [ ] No sensitive data in commit (API keys, passwords)
- [ ] Tests pass (`npm run test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Commit message follows conventional format

Before creating PR:

- [ ] All commits on feature branch
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Coverage ≥ 85%
- [ ] PR description complete
- [ ] Related issues linked

---

## Error Recovery

### Accidentally Committed to Protected Branch

```bash
# If not pushed yet
git reset HEAD~1  # Undo commit (keep changes)
git checkout -b feature/proper-branch
git add [files]
git commit -m "..."

# If already pushed (requires force push)
git reset --hard HEAD~1
git push origin main --force  # ⚠️ DANGEROUS - requires approval
```

### Wrong Commit Message

```bash
# If not pushed yet
git commit --amend -m "correct message"

# If already pushed
git rebase -i HEAD~n  # Interactive rebase to edit
```

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Status:** Active
