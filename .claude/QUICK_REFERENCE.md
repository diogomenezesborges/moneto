# Documentation System Quick Reference

## File Size Limits

- CLAUDE.md: **25K chars** (warn at 23K)
- docs/CHANGELOG.md: **20K chars** (warn at 18K)
- Workflows: **10K chars** each

## Automation (Runs Automatically)

**After every Edit/Write:**

- Size monitor
- Link validator

**Before every commit:**

- Branch checker
- Status generator
- Learning prompt

## Maintenance Schedule

| Frequency | Time   | Tasks                                           |
| --------- | ------ | ----------------------------------------------- |
| Daily     | 0 min  | All automated                                   |
| Weekly    | 5 min  | Review summary, update metrics, check dashboard |
| Monthly   | 30 min | Review patterns, update docs, health checks     |
| Quarterly | 1 hour | Generate archive, bump version, verify health   |

## Key Commands

```bash
# Weekly review
node .claude/hooks/weekly-aggregation.js
node .claude/hooks/metrics-tracker.js
node .claude/hooks/drift-detection.js
node .claude/hooks/generate-dashboard.js
cat .claude/status/README.md

# Health checks
node .claude/hooks/size-monitor.js
node .claude/hooks/link-validator.js
node .claude/hooks/drift-detection.js

# Quarterly archive
node .claude/hooks/quarterly-archive.js --quarter=Q1 --year=2026
```

## Troubleshooting

| Problem             | Solution                                           |
| ------------------- | -------------------------------------------------- |
| Size limit exceeded | `.claude/workflows/runbook-size-exceeded.md`       |
| Broken links        | Fix link, run validator                            |
| Instruction failing | `.claude/workflows/runbook-instruction-failure.md` |
| Can't commit        | Check branch, run `git branch --show-current`      |

## Success Metrics

- CLAUDE.md < 25K ✅
- Compliance > 90% ✅
- Broken links = 0 ✅
- Stale files = 0 ✅

Check: `cat .claude/status/README.md`
