# Runbook: CLAUDE.md Size Exceeded

## When This Happens

Size monitor hook alerts: `❌ ERROR: CLAUDE.md exceeds limit!`

## Diagnosis

1. Run size monitor to see breakdown:

   ```bash
   node .claude/hooks/size-monitor.js
   ```

2. Identify largest sections:
   ```bash
   # Count lines per section
   awk '/^## / {print NR, $0}' CLAUDE.md
   ```

## Resolution

### Option 1: Archive Changelog Entries

If changelog is the culprit:

1. Keep only last 10 versions in CLAUDE.md
2. Move older entries to docs/CHANGELOG.md
3. Update section header: "Recent Changelog (Last 10 Versions)"
4. Verify size < 25K

### Option 2: Move Workflow Details

If workflow sections are too detailed:

1. Extract detailed steps to `.claude/workflows/[topic]-workflow.md`
2. Replace in CLAUDE.md with summary + link
3. Verify all links work
4. Verify size < 25K

### Option 3: Compress ADR Summaries

If ADR section is too large:

1. Keep only ADR titles + one-line summaries in CLAUDE.md
2. Full details remain in `docs/archive/architecture/adr/`
3. Verify links to full ADRs work
4. Verify size < 25K

## Verification

1. Run size monitor: `node .claude/hooks/size-monitor.js`
   - Should show ✅ with < 25K chars

2. Run link validator: `node .claude/hooks/link-validator.js`
   - Should show ✅ with 0 broken links

3. Test navigation:
   - Open CLAUDE.md
   - Click on moved content links
   - Verify all links work

## Prevention

- Keep changelog to 10 most recent versions
- Keep workflow details in separate files
- Review size monthly during maintenance
