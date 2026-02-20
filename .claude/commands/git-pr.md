# Git Pull Request Command (`/git:pr`)

---

name: git-pr
description: Create pull request with auto-generated description
agents: [git-guardian]

---

## Purpose

Creates a pull request with automatically generated title and description based on commit history and changes.

## Workflow

1. **Pre-flight Checks**
   - Verify branch is NOT `main` or `develop`
   - Check if branch tracks remote (push if needed)
   - Verify commit history exists

2. **Analyze PR Content**

   ```bash
   git log develop...HEAD      # All commits for this PR
   git diff develop...HEAD     # All changes for this PR
   ```

3. **Generate PR Description**
   - Title: `type(scope): description` (from first/main commit)
   - Body:
     - Summary (2-3 bullet points)
     - Changes breakdown (database, API, frontend, tests)
     - Test plan checklist
     - Footer: "🤖 Generated with Claude Code"

4. **Create PR**

   ```bash
   gh pr create --base develop \
     --title "feat(budgets): add monthly budget tracking" \
     --body "$PR_DESCRIPTION"
   ```

5. **Return PR URL**

## Usage

```bash
/git:pr
```

## Example Output

```
✅ PR created successfully

Title: feat(budgets): add monthly budget tracking
URL: https://github.com/user/repo/pull/42
Base: develop ← Head: feature/budget-tracking
Commits: 5
Files changed: 12

CI checks:
- lint: ⏳ pending
- typecheck: ⏳ pending
- tests: ⏳ pending
- build: ⏳ pending
```

---

**Last Updated:** 2026-02-12
**Version:** 1.0
