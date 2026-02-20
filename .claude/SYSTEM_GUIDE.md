# Documentation System Guide

## Quick Start

This system maintains a **self-sustaining, continuously improving documentation** with strict size limits and automated quality checks.

### Core Principles

1. **CLAUDE.md = Constitution** (20-25K chars max, stable rules)
2. **Workflows = Procedures** (10K chars each, task-specific)
3. **Learnings = Session Insights** (captured → aggregated → archived)
4. **Status = Ephemeral** (auto-generated from git/build/issues)
5. **Archive = Historical** (time-based, permanent storage)

### File Structure

```
CLAUDE.md                    [Constitution - 20-25K chars]
.claude/
├── workflows/               [Procedures - 10K chars each]
│   ├── git-workflow.md
│   ├── build-workflow.md
│   ├── ui-verification.md
│   ├── emergency-hotfix.md
│   ├── documentation-updates.md
│   ├── runbook-size-exceeded.md
│   ├── runbook-instruction-failure.md
│   └── runbook-quarterly-archive.md
├── learnings/               [Session insights]
│   ├── 2026-Q1/
│   │   ├── YYYY-MM-DD-insight.md
│   │   └── week-NN-summary.md
│   ├── archive/
│   │   └── 2026-Q1-learnings.md
│   ├── TEMPLATE-daily-insight.md
│   ├── TEMPLATE-weekly-summary.md
│   └── TEMPLATE-quarterly-summary.md
├── status/                  [Auto-generated]
│   ├── current-work.json
│   ├── doc-health.json
│   ├── drift-report.json
│   └── README.md
└── hooks/                   [Automation]
    ├── size-monitor.js
    ├── link-validator.js
    ├── branch-check.js
    ├── generate-status.js
    ├── weekly-aggregation.js
    ├── quarterly-archive.js
    ├── metrics-tracker.js
    ├── drift-detection.js
    ├── generate-dashboard.js
    └── learning-prompt.js
```

## Daily Operations (Automated)

**No manual work required.**

After every Edit/Write:

- ✅ Size monitor checks CLAUDE.md < 25K
- ✅ Link validator checks for broken links

Before every commit:

- ✅ Branch checker verifies not on main/develop
- ✅ Status generator updates current-work.json
- ✅ Learning prompt reminds to capture insights

## Weekly Maintenance (5 minutes)

**Every Sunday:**

```bash
# 1. Generate weekly summary
node .claude/hooks/weekly-aggregation.js

# 2. Update metrics
node .claude/hooks/metrics-tracker.js
node .claude/hooks/drift-detection.js
node .claude/hooks/generate-dashboard.js

# 3. Review dashboard
cat .claude/status/README.md

# 4. Act on critical issues
# - If violations high: Update instructions
# - If size approaching limit: Archive content
# - If broken links: Fix immediately
```

## Monthly Maintenance (30 minutes)

**First Monday of each month:**

1. Review 4 weekly summaries:

   ```bash
   cat .claude/learnings/2026-Q1/week-*.md
   ```

2. Identify patterns:
   - Instructions violated >2 times? → Revise
   - Instructions effective >95%? → Keep as-is
   - New patterns discovered? → Document

3. Update documentation:
   - CLAUDE.md: Core rule changes only
   - Workflows: Procedural improvements

4. Run health checks:

   ```bash
   node .claude/hooks/size-monitor.js
   node .claude/hooks/link-validator.js
   node .claude/hooks/drift-detection.js
   ```

5. Fix any issues found

## Quarterly Archive (1 hour)

**End of quarter: March 31, June 30, Sept 30, Dec 31**

Follow: `.claude/workflows/runbook-quarterly-archive.md`

Summary:

1. Generate quarterly summary
2. Archive old content
3. Bump version number
4. Verify all health checks

## Common Tasks

### Capture Session Learnings

After significant work:

```bash
# 1. Copy template
cp .claude/learnings/TEMPLATE-daily-insight.md \
   .claude/learnings/2026-Q1/$(date +%Y-%m-%d)-insight.md

# 2. Fill in all sections
# 3. Commit
git add .claude/learnings && git commit -m "docs: capture session learnings"
```

### Fix Broken Link

When link validator reports broken link:

1. Find the broken link in source file
2. Update to correct path
3. Run validator to verify: `node .claude/hooks/link-validator.js`

### Archive Changelog Entries

When CLAUDE.md size > 23K:

Follow: `.claude/workflows/runbook-size-exceeded.md`

Quick version:

1. Keep last 10 versions in CLAUDE.md
2. Move older to docs/CHANGELOG.md
3. Verify size < 25K

### Revise Failing Instruction

When weekly summary shows repeated violations:

Follow: `.claude/workflows/runbook-instruction-failure.md`

Quick version:

1. Identify why it's failing
2. Clarify language, add verification, or document exceptions
3. Test in next session
4. Verify in next weekly summary

## Troubleshooting

### "Size monitor blocking my commit!"

CLAUDE.md > 25K chars. Archive content:

```bash
# See which section is largest
node .claude/hooks/size-monitor.js

# Follow size exceeded runbook
cat .claude/workflows/runbook-size-exceeded.md
```

### "Link validator shows broken links!"

Documentation references moved/deleted files:

```bash
# See which links are broken
node .claude/hooks/link-validator.js

# Fix each broken link
# Re-run validator until ✅
```

### "Branch checker blocking my commit!"

You're on main or develop:

```bash
# Create feature branch
git checkout -b feature/descriptive-name

# Now you can commit
```

### "Instruction keeps being violated!"

Instruction isn't working:

```bash
# Review failure pattern
cat .claude/learnings/2026-Q1/week-NN-summary.md

# Follow instruction failure runbook
cat .claude/workflows/runbook-instruction-failure.md
```

## Success Metrics

**System is healthy when:**

- ✅ CLAUDE.md size stable (< 25K chars)
- ✅ Instruction compliance > 90%
- ✅ Learning captured weekly
- ✅ 0 broken links
- ✅ 0 stale files (>6 months)
- ✅ Minimal manual work (<5 min/week)

**Check anytime:**

```bash
cat .claude/status/README.md
```

## Getting Help

- **System overview:** This file
- **Weekly review:** `.claude/workflows/documentation-updates.md`
- **Runbooks:** `.claude/workflows/runbook-*.md`
- **Status dashboard:** `.claude/status/README.md`
