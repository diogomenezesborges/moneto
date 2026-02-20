# Runbook: Quarterly Archive

## When to Run

End of each quarter: March 31, June 30, September 30, December 31

## Prerequisites

- All weekly summaries for quarter completed
- Monthly reviews completed
- No pending documentation updates

## Procedure

### Step 1: Generate Quarterly Summary

```bash
node .claude/hooks/quarterly-archive.js --quarter=Q1 --year=2026
```

**Output:** `.claude/learnings/archive/2026-Q1-learnings.md`

### Step 2: Review and Complete Manual Sections

1. Open the generated summary
2. Fill in manual sections:
   - Date range
   - Top 10 most impactful learnings
   - Recommendations for next quarter
3. Save changes

### Step 3: Archive Old Changelogs (if needed)

Check changelog size:

```bash
wc -c docs/CHANGELOG.md
```

If > 20,000 chars:

```bash
# Manual process:
# 1. Create docs/archive/changelogs/[YEAR]-changelog.md
# 2. Move entries older than current year
# 3. Keep rolling 50 most recent entries in CHANGELOG.md
# 4. Update header: "Rolling Changelog (Last 50 Releases)"
```

### Step 4: Clean Up Weekly Files

Weekly summaries are now archived in quarterly summary:

```bash
# Review weekly files first to ensure nothing missed
ls .claude/learnings/2026-Q1/week-*.md

# If comfortable, delete weekly files
rm .claude/learnings/2026-Q1/week-*.md

# Keep quarterly summary and daily insights
```

### Step 5: Bump Version Number

Determine version increment:

- **Major version (v2.x → v3.0):** Core rules changed, major improvements
- **Minor version (v2.29 → v2.30):** Small improvements, no breaking changes

Update CLAUDE.md:

```markdown
> **Version**: 3.0 (or 2.30)
> **Last Updated**: 2026-03-31
```

### Step 6: Update Changelog in CLAUDE.md

Add new entry:

```markdown
| 2026-03-31 | 3.0 | **Quarterly Archive Q1**: [Summary of changes] |
```

### Step 7: Verify Documentation Health

Run all health checks:

```bash
node .claude/hooks/size-monitor.js
node .claude/hooks/link-validator.js
node .claude/hooks/drift-detection.js
node .claude/hooks/generate-dashboard.js
```

All should pass:

- ✅ CLAUDE.md < 25K chars
- ✅ 0 broken links
- ✅ 0 stale files

### Step 8: Commit Archive

```bash
git add .claude/learnings/archive/
git add docs/archive/changelogs/  # if archived
git add CLAUDE.md  # version bump
git commit -m "docs: Q1 2026 quarterly archive"
git push origin [feature-branch]
```

## Verification

- [ ] Quarterly summary generated and completed
- [ ] Old changelogs archived (if needed)
- [ ] Weekly files deleted
- [ ] Version number bumped
- [ ] Changelog entry added
- [ ] All health checks pass
- [ ] Changes committed

## Next Quarter Setup

Create directory for next quarter:

```bash
mkdir -p .claude/learnings/2026-Q2
```

Copy templates:

```bash
cp .claude/learnings/TEMPLATE-daily-insight.md .claude/learnings/2026-Q2/
cp .claude/learnings/TEMPLATE-weekly-summary.md .claude/learnings/2026-Q2/
```
