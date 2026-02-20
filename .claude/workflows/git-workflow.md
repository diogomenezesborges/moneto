# Git Workflow

**Branch Strategy:**

- ✅ **Always commit to feature branches** (`feature/*`, `fix/*`, `docs/*`)
- ❌ **NEVER commit directly to `main`** (production)
- ❌ **NEVER commit directly to `develop`** (staging)

**Workflow:**

```bash
# 1. Always check current branch before ANY git operation
git branch --show-current

# 2. If on main or develop, create feature branch immediately
git checkout -b feature/descriptive-name

# 3. After completing each logical unit of work, commit immediately
git add [files]
git commit -m "type: description"

# 4. Push to feature branch
git push origin feature/descriptive-name

# 5. Create PR for review (AI cannot merge without human approval)
```

**Do not batch multiple features into one uncommitted state.** Commit early, commit often.
