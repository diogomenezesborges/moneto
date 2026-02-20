# Documentation Updates Workflow

## Automated Hooks

The documentation system includes automated hooks that run after file edits to maintain quality and enforce size limits.

### PostToolUse Hooks (Run after Edit/Write operations)

**1. Size Monitor** (`size-monitor.js`)

- **Runs**: After every Edit or Write operation
- **Purpose**: Monitors file sizes and enforces limits
- **Limits**:
  - CLAUDE.md: 25,000 characters
  - docs/CHANGELOG.md: 20,000 characters
- **Behavior**:
  - ✅ Pass: File < 90% of limit (green message)
  - ⚠️ Warning: File 90-100% of limit (yellow warning)
  - ❌ Error: File > 100% of limit (red error, blocks commit)
- **Action if exceeded**: Archive old content immediately

**2. Link Validator** (`link-validator.js`)

- **Runs**: After every Edit or Write operation
- **Purpose**: Validates markdown links in documentation files
- **Checks**: CLAUDE.md, docs/ARCHITECTURE.md, docs/DATABASE.md, docs/API_REFERENCE.md
- **Behavior**:
  - Skips external URLs (http/https)
  - Skips anchor-only links (#section)
  - Reports broken internal file links
- **Action if broken**: Fix the broken links

### Manual Hooks (Run manually when needed)

**Branch Check** (`branch-check.js`)

- **Run manually**: `node .claude/hooks/branch-check.js`
- **Purpose**: Verify you're not on main/develop before committing
- **Behavior**:
  - ✅ Pass: On feature branch
  - ❌ Error: On main or develop (blocks operation)
- **Note**: Claude Code doesn't have PreCommit hooks, so this must be run manually

## File Size Management

### When CLAUDE.md approaches 25K chars:

1. Identify largest sections (use size monitor output)
2. Decide what to extract:
   - Detailed procedures → `.claude/workflows/`
   - Old changelog entries → `docs/CHANGELOG.md`
   - Historical status → delete (in git history)
3. Update links in CLAUDE.md to point to new locations
4. Verify with link validator
5. Verify size < 25K

### When docs/CHANGELOG.md exceeds 20K chars:

1. Keep rolling 50 most recent entries
2. Move older entries to `docs/archive/changelogs/[YEAR]-changelog.md`
3. Update header: "Rolling Changelog (Last 50 Releases)"

## Testing Hooks

Run hooks manually to test:

```bash
# Test size monitor
node .claude/hooks/size-monitor.js

# Test link validator
node .claude/hooks/link-validator.js

# Test branch check
node .claude/hooks/branch-check.js
```

## Hook Configuration

Hooks are configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/size-monitor.js",
            "statusMessage": "Checking file sizes..."
          },
          {
            "type": "command",
            "command": "node .claude/hooks/link-validator.js",
            "statusMessage": "Validating markdown links..."
          }
        ]
      }
    ]
  }
}
```

## Learning Capture System

### When to Capture Learnings

Capture insights after:

- Significant violations (AI pushed to main, hit rate limit, etc.)
- New patterns discovered (better way to do something)
- Instruction failures (AI didn't follow a rule)
- Major successes (instruction prevented a problem)

### How to Capture Daily Insights

1. Copy `.claude/learnings/TEMPLATE-daily-insight.md`
2. Rename to: `.claude/learnings/2026-Q1/YYYY-MM-DD-insight.md`
3. Fill in all sections:
   - What went wrong (violations, failures)
   - What went right (successes, preventions)
   - Instruction effectiveness (what worked/didn't work)
   - Suggested changes (with priority)
4. Commit: `git add .claude/learnings && git commit -m "docs: capture session learnings"`

### Weekly Aggregation (Every Sunday)

1. Run aggregation script:

   ```bash
   node .claude/hooks/weekly-aggregation.js
   ```

2. Update metrics and generate dashboard:

   ```bash
   node .claude/hooks/metrics-tracker.js
   node .claude/hooks/drift-detection.js
   node .claude/hooks/generate-dashboard.js
   ```

3. Review dashboard and weekly summary:

   ```bash
   cat .claude/status/README.md
   cat .claude/learnings/2026-Q1/week-NN-summary.md
   ```

4. Respond to findings:
   - **Critical issues:** Update CLAUDE.md immediately
   - **Non-critical patterns:** Add to monthly review backlog
   - **Action items:** Address items listed in dashboard

5. Commit weekly summary and status updates:
   ```bash
   git add .claude/learnings .claude/status && git commit -m "docs: week NN summary and status update"
   ```

### Before Commits (Manual)

Run these scripts manually before committing (no pre-commit hooks in Claude Code):

1. Update current work status:

   ```bash
   node .claude/hooks/generate-status.js
   ```

2. Check branch (prevent commits on main/develop):

   ```bash
   node .claude/hooks/branch-check.js
   ```

3. Check for learnings reminder (if 3+ files changed):
   ```bash
   node .claude/hooks/learning-prompt.js
   ```

### Monthly Review (First Monday)

1. Review 4 weekly summaries for the month
2. Identify patterns requiring documentation updates
3. Update appropriate files:
   - CLAUDE.md for core rule changes
   - Workflow files for procedural improvements
4. Check documentation health:
   ```bash
   node .claude/hooks/size-monitor.js
   node .claude/hooks/link-validator.js
   node .claude/hooks/drift-detection.js
   cat .claude/status/README.md
   ```

### Quarterly Archive (End of Quarter)

1. Run quarterly archive script:

   ```bash
   node .claude/hooks/quarterly-archive.js --quarter Q1 --year 2026
   ```

2. Review quarterly summary
3. Archive old content:
   - Move old changelogs if needed
   - Compress weekly summaries
4. Bump version number in CLAUDE.md
5. Update "Last Updated" timestamp

## Status System (Phase 3 - Completed)

The documentation system includes automated status tracking:

### Auto-Generated Status Files

- **current-work.json**: Current branch, recent commits, open issues
- **doc-health.json**: Instruction compliance metrics
- **drift-report.json**: Stale files and broken links
- **README.md**: Human-readable dashboard

### Accessing Status

View the dashboard anytime:

```bash
cat .claude/status/README.md
```

Or check individual status files:

```bash
cat .claude/status/current-work.json
cat .claude/status/doc-health.json
cat .claude/status/drift-report.json
```
