# Ship Command (`/ship`)

---

name: ship
description: Commit + PR in one command (convenience wrapper for /git:cm + /git:pr)
agents: [git-guardian]

---

## Purpose

Convenience command that combines `/git:cm` and `/git:pr` into a single workflow.

## Workflow

1. Execute `/git:cm` workflow (create commit)
2. Execute `/git:pr` workflow (create PR)

## Usage

```bash
/ship
```

## Example Output

```
📦 Step 1: Creating commit...
✅ Commit created: feat(budgets): add monthly budget tracking

📤 Step 2: Creating pull request...
✅ PR created: https://github.com/user/repo/pull/42

✨ Shipped! Ready for review.
```

---

**Last Updated:** 2026-02-12
**Version:** 1.0
