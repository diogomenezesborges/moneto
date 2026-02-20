# GitHub Repository Setup Guide

> **Purpose**: Configure GitHub for multi-environment deployment strategy
> **Last Updated**: 2026-01-26

## ⚠️ Important: GitHub Plan Requirements

### Branch Protection Rules Limitation

**Branch protection rules do NOT work on private repositories with GitHub Free plan.**

- ✅ **Public repositories**: Branch protection works on all GitHub plans (including Free)
- ⚠️ **Private repositories**: Requires GitHub Team ($4/user/month) or Enterprise

**Options:**

1. **Make the repository public** (recommended for open-source projects)

   ```bash
   # Via GitHub CLI
   gh repo edit your-username/moneto --visibility public
   ```

2. **Upgrade to GitHub Team** ($4/user/month)
   - Settings → Billing → Change plan

3. **Use workarounds** (see "Free Tier Workarounds" section below)

---

## Branch Protection Rules (Requires Public Repo or Team Plan)

### `main` Branch (Production)

**Settings** → **Branches** → Add rule for `main`:

1. **Require pull request before merging**
   - [x] Require approvals: **2**
   - [x] Dismiss stale pull request approvals when new commits are pushed
   - [x] Require review from Code Owners

2. **Require status checks before merging**
   - [x] Require branches to be up to date before merging
   - Required checks:
     - `lint-and-typecheck`
     - `test`
     - `build`
     - `database-check`

3. **Require conversation resolution before merging**
   - [x] All conversations must be resolved

4. **Require linear history**
   - [ ] Require linear history (optional - prevents merge commits)

5. **Do not allow bypassing the above settings**
   - [x] Include administrators

6. **Restrict pushes**
   - [x] Restrict who can push to matching branches
   - Add: Only GitHub Actions (for deployments)

---

### `develop` Branch (Staging)

**Settings** → **Branches** → Add rule for `develop`:

1. **Require pull request before merging**
   - [x] Require approvals: **1**
   - [x] Dismiss stale pull request approvals when new commits are pushed

2. **Require status checks before merging**
   - [x] Require branches to be up to date before merging
   - Required checks:
     - `lint-and-typecheck`
     - `test`
     - `build`

3. **Require conversation resolution before merging**
   - [x] All conversations must be resolved

4. **Do not allow bypassing the above settings**
   - [x] Include administrators

---

### Alternative: Configure via GitHub CLI

**Prerequisite**: Install GitHub CLI and authenticate

```bash
# Install (if not already installed)
winget install GitHub.cli

# Authenticate
gh auth login
```

**Configure `main` branch protection**:

```bash
gh api repos/your-username/moneto/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=lint-and-typecheck \
  --field required_status_checks[contexts][]=test \
  --field required_status_checks[contexts][]=build \
  --field required_status_checks[contexts][]=database-check \
  --field required_pull_request_reviews[required_approving_review_count]=2 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=true \
  --field required_conversation_resolution[enabled]=true \
  --field enforce_admins[enabled]=true
```

**Configure `develop` branch protection**:

```bash
gh api repos/your-username/moneto/branches/develop/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=lint-and-typecheck \
  --field required_status_checks[contexts][]=test \
  --field required_status_checks[contexts][]=build \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_conversation_resolution[enabled]=true
```

**Note**: These commands will fail on private repos with Free plan. See workarounds below.

---

## GitHub Environments

### 1. Preview Environment

**Settings** → **Environments** → New environment: `preview`

**Configuration**:

- **Deployment branches**: All branches (for PR previews)
- **Environment secrets**:
  - `STAGING_DATABASE_URL`
  - `STAGING_JWT_SECRET`
  - `STAGING_CSRF_SECRET`
  - `STAGING_GEMINI_API_KEY`
  - `STAGING_REDIS_URL`
  - `STAGING_REDIS_TOKEN`

---

### 2. Staging Environment

**Settings** → **Environments** → New environment: `staging`

**Configuration**:

- **Deployment branches**: Selected branches
  - Add: `develop`
- **Environment secrets**: Same as Preview (shared)

---

### 3. Production Environment

**Settings** → **Environments** → New environment: `production`

**Configuration**:

- **Deployment branches**: Selected branches
  - Add: `main` only
- **Required reviewers**:
  - [x] Add reviewers: **Project maintainers**
  - Require approval from: **1** reviewer before deployment
- **Wait timer**: 0 minutes (approval is manual)
- **Environment secrets**:
  - `PRODUCTION_DATABASE_URL`
  - `PRODUCTION_JWT_SECRET`
  - `PRODUCTION_CSRF_SECRET`
  - `PRODUCTION_GEMINI_API_KEY`
  - `PRODUCTION_REDIS_URL`
  - `PRODUCTION_REDIS_TOKEN`

---

## Repository Secrets

**Settings** → **Secrets and variables** → **Actions** → New repository secret:

### Vercel Deployment

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

### How to Get Vercel Secrets:

1. **VERCEL_TOKEN**:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and generate token
   vercel login
   vercel tokens create
   ```

2. **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID**:

   ```bash
   # In project directory
   vercel link

   # Check .vercel/project.json
   cat .vercel/project.json
   ```

---

## Deployment Approval Process

### For Production Deployments:

1. **PR Created**: `develop` → `main`
2. **Code Review**: 2 approvals required
3. **CI Checks**: All checks must pass
4. **PR Merged**: Merge to `main` branch
5. **GitHub Actions**: Deployment workflow triggered
6. **Manual Approval**: ⏸️ Workflow pauses for approval
7. **Reviewer Approves**: Click "Review pending deployments"
8. **Deployment**: Vercel production deployment
9. **Health Check**: Automated post-deployment verification

---

## Rollback Configuration

### Automatic Rollback Triggers

**Settings** → **Actions** → **General**:

- [x] Allow actions created by GitHub
- [x] Allow actions by Marketplace verified creators

Create `.github/workflows/rollback.yml`:

```yaml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      commit_sha:
        description: 'Commit SHA to rollback to'
        required: true
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.commit_sha }}

      - name: Revert to commit
        run: |
          git revert --no-commit $GITHUB_SHA..${{ inputs.commit_sha }}
          git commit -m "Rollback to ${{ inputs.commit_sha }}"
          git push origin main
```

---

## CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# Default owners for everything
* @your-username

# Production deployments require extra review
/.github/workflows/production-deployment.yml @your-username
/docs/MULTI_ENVIRONMENT_STRATEGY.md @your-username

# Database migrations require careful review
/prisma/migrations/ @your-username
/prisma/schema.prisma @your-username
```

---

## Issue Templates

### 1. Bug Report

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug or issue
title: '[BUG] '
labels: bug
assignees: ''
---

**Environment**: [Development / Staging / Production]

**Description**:
A clear description of the bug.

**Steps to Reproduce**:

1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**:
What should happen.

**Actual Behavior**:
What actually happens.

**Screenshots**:
If applicable, add screenshots.
```

### 2. Feature Request

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Suggest a new feature
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

**Problem**:
What problem does this solve?

**Proposed Solution**:
How should it work?

**Alternatives**:
Any alternative solutions considered?
```

---

## Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manually tested on preview deployment

## Deployment Checklist

- [ ] Database migrations created (if needed)
- [ ] Environment variables updated (if needed)
- [ ] Documentation updated
- [ ] Breaking changes documented

## Related Issues

Closes #(issue number)

## Preview URL

<!-- Automatically added by GitHub Actions -->
```

---

## Monitoring & Alerts

### GitHub Actions Notifications

**Settings** → **Notifications** → **Actions**:

- [x] Send notifications for failed workflows
- [x] Only send notifications for workflows triggered by me

### External Monitoring (Optional)

**Uptime Monitoring**:

- Service: UptimeRobot (free tier)
- Endpoint: `https://moneto.vercel.app/api/health`
- Check frequency: Every 5 minutes
- Alerts: Email on downtime

**Error Tracking**:

- Service: Sentry (optional)
- Integration: Add Sentry DSN to environment variables

---

## Security Settings

**Settings** → **Security & analysis**:

- [x] Dependency graph
- [x] Dependabot alerts
- [x] Dependabot security updates
- [x] Code scanning (CodeQL)
- [x] Secret scanning

---

## Free Tier Workarounds (Private Repos)

If you're using a **private repository with GitHub Free**, branch protection rules won't be enforced. Here are the best practices to maintain code quality:

### 0. AI Agent Workflow Enforcement (Recommended - Already Implemented) ✅

**For repositories using AI agents (Claude Code, Cursor, GitHub Copilot, etc.):**

✅ **This repository has implemented AI agent workflow enforcement through CLAUDE.md**

- **Mandatory workflow rules** documented in [CLAUDE.md](../CLAUDE.md#-mandatory-ai-agent-workflow-rules)
- **AI agents are strictly forbidden** from pushing to `main` or `develop` branches
- **AI agents must always** create feature branches and PRs
- **Human review required** for all merges

**Why this works:**

- AI agents read and follow CLAUDE.md instructions meticulously
- Provides "soft" branch protection through AI compliance
- Most effective for projects where AI does majority of development work

**Limitations:**

- Only enforces workflow for AI agents, not human developers
- Human developers should also follow the same workflow (honor system)
- Combine with git hooks (see below) for local human enforcement

### 1. Team Discipline & Code Review Culture

**Manual Review Process**:

- Always create PRs (never push directly to `main` or `develop`)
- Self-enforce review requirements (2 reviews for `main`, 1 for `develop`)
- Use PR templates (already created) to ensure consistency
- Comment "LGTM" (Looks Good To Me) after thorough review

**PR Checklist** (manually enforce):

```
Before merging to main:
- [ ] 2 team members have reviewed and approved
- [ ] All CI checks are passing (lint, test, build)
- [ ] All PR template sections are completed
- [ ] All conversation threads are resolved
- [ ] Changes are tested on preview deployment
```

### 2. GitHub Actions as Gatekeepers

**Add required checks to workflows** (already implemented):

- ✅ CI pipeline runs on every PR
- ✅ Blocks merge if checks fail (status visible on PR)
- ✅ Auto-comments on PR with results

**Users can still merge failing PRs, but it's obvious they're bypassing checks.**

### 3. CODEOWNERS File (Partially Works)

- ✅ Already created: `.github/CODEOWNERS`
- ✅ GitHub will auto-request reviews from code owners
- ⚠️ But it won't **enforce** the reviews on free private repos

### 4. Use Git Hooks (Local Enforcement)

**Create `.git/hooks/pre-push`** (blocks local pushes to protected branches):

```bash
#!/bin/bash
# Prevent direct pushes to main and develop

protected_branches=("main" "develop")
current_branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')

for branch in "${protected_branches[@]}"; do
  if [ "$current_branch" = "$branch" ]; then
    echo "❌ Direct push to $branch is not allowed!"
    echo "Please create a feature branch and open a PR."
    echo ""
    echo "To create a feature branch:"
    echo "  git checkout -b feature/your-feature-name"
    exit 1
  fi
done
```

**Install for all team members**:

```bash
chmod +x .git/hooks/pre-push
```

### 5. Recommended: Make Repository Public

**Benefits of public repos**:

- ✅ Branch protection works on Free plan
- ✅ GitHub Actions get 2000 minutes/month (vs 500 for private)
- ✅ Better for portfolio/open-source contributions
- ✅ Community can report issues and contribute

**Considerations**:

- ⚠️ Sensitive data (API keys, secrets) must never be committed
- ⚠️ Already using environment variables (good practice)
- ✅ Financial data is in private Neon database (not in repo)
- ✅ This appears to be a personal finance tool (not business secrets)

**Make public via CLI**:

```bash
gh repo edit your-username/moneto --visibility public
```

### 6. Alternative: GitHub Sponsors ($4/month)

If you want to keep it private but get Team features:

- GitHub Team: $4/user/month
- Includes branch protection, required reviewers, CODEOWNERS enforcement
- Also gets advanced security features

### Recommendation

For this project, I recommend **making the repository public** because:

1. Branch protection will work (enforced by GitHub)
2. No sensitive business logic (personal finance tool)
3. All secrets are already in environment variables
4. Better for your portfolio and potential contributors
5. Completely free (no $4/month cost)

---

## Complete Setup Checklist

### ✅ Completed (Automated)

- [x] Create `develop` branch from `main` (done 2026-01-26)
- [x] Create `.github/CODEOWNERS` (done 2026-01-26)
- [x] Create issue templates (done 2026-01-26)
- [x] Create PR template (done 2026-01-26)
- [x] Create rollback workflow (done 2026-01-26)
- [x] Configure CI/CD workflows (done 2026-01-25)

### 🔄 Requires Manual Configuration (GitHub Web UI or CLI)

**Repository Visibility Decision** (Choose one):

- [ ] Option A: Make repository public (enables branch protection on Free plan)
  ```bash
  gh repo edit your-username/moneto --visibility public
  ```
- [ ] Option B: Keep private + upgrade to GitHub Team ($4/month)
- [ ] Option C: Keep private + use manual workarounds (see "Free Tier Workarounds")

**If Public or Team Plan** (branch protection will work):

- [ ] Configure branch protection for `main` (2 approvals, required checks)
- [ ] Configure branch protection for `develop` (1 approval, required checks)

**GitHub Environments** (works on all plans):

- [ ] Create `preview` environment with staging secrets
- [ ] Create `staging` environment (develop branch only)
- [ ] Create `production` environment (main branch, require reviewers)

**Repository Secrets** (works on all plans):

- [ ] Add `VERCEL_TOKEN` (from `vercel tokens create`)
- [ ] Add `VERCEL_ORG_ID` (from `.vercel/project.json`)
- [ ] Add `VERCEL_PROJECT_ID` (from `.vercel/project.json`)

**Environment Secrets** (per environment):

- [ ] Preview/Staging: Add DATABASE_URL, JWT_SECRET, CSRF_SECRET, GEMINI_API_KEY, Redis credentials
- [ ] Production: Add production versions of above secrets

**Security Features** (works on all plans):

- [ ] Enable Dependabot alerts (Settings → Security & analysis)
- [ ] Enable Dependabot security updates
- [ ] Enable code scanning (CodeQL)
- [ ] Enable secret scanning

**Testing**:

- [ ] Test preview deployment (create a test PR)
- [ ] Test staging deployment (merge test PR to develop)
- [ ] Test production deployment (create PR from develop → main)
- [ ] Test rollback workflow (manual trigger)

---

**Last Updated**: 2026-01-26
**Status**: Code files ready, manual configuration required
**GitHub Plan Required**: Free (public repo) or Team (private repo with branch protection)
