// Generate human-readable status dashboard
const fs = require('fs')
const path = require('path')

// Read all status files
const statusDir = path.join(process.cwd(), '.claude/status')

// Check if status files exist, if not create default values
let currentWork = { currentBranch: 'N/A', recentCommits: [], openIssues: { P0: 0, P1: 0, P2: 0 } }
let docHealth = {
  instructionMetrics: {
    complianceRate: 'N/A',
    totalSessions: 0,
    totalViolations: 0,
    status: 'N/A',
  },
}
let driftReport = { brokenLinks: [], staleFiles: [], lastUpdated: new Date().toISOString() }

const currentWorkPath = path.join(statusDir, 'current-work.json')
const docHealthPath = path.join(statusDir, 'doc-health.json')
const driftReportPath = path.join(statusDir, 'drift-report.json')

if (fs.existsSync(currentWorkPath)) {
  currentWork = JSON.parse(fs.readFileSync(currentWorkPath, 'utf8'))
}
if (fs.existsSync(docHealthPath)) {
  docHealth = JSON.parse(fs.readFileSync(docHealthPath, 'utf8'))
}
if (fs.existsSync(driftReportPath)) {
  driftReport = JSON.parse(fs.readFileSync(driftReportPath, 'utf8'))
}

// Check file sizes
const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md')
let claudeMdSize = 0
let claudeMdPercent = 0
let claudeMdStatus = '❓'

if (fs.existsSync(claudeMdPath)) {
  claudeMdSize = fs.readFileSync(claudeMdPath, 'utf8').length
  claudeMdPercent = ((claudeMdSize / 25000) * 100).toFixed(1)
  claudeMdStatus = claudeMdSize < 22500 ? '✅' : claudeMdSize < 25000 ? '⚠️' : '❌'
}

// Generate dashboard
const dashboard = `# Documentation System Status

**Last Updated:** ${new Date().toISOString()}

## File Size Health

- **CLAUDE.md:** ${claudeMdSize} chars (${claudeMdPercent}% of 25K limit) ${claudeMdStatus}

## Link Health

- **Broken Links:** ${driftReport.brokenLinks.length} (target: 0) ${driftReport.brokenLinks.length === 0 ? '✅' : '❌'}
- **Last Validated:** ${driftReport.lastUpdated}

## Documentation Freshness

- **Stale Files:** ${driftReport.staleFiles.length} (>6 months old) ${driftReport.staleFiles.length === 0 ? '✅' : '⚠️'}
- **Last Checked:** ${driftReport.lastUpdated}

## Instruction Effectiveness

- **Compliance Rate:** ${docHealth.instructionMetrics.complianceRate} (target: >90%) ${docHealth.instructionMetrics.status === 'HEALTHY' ? '✅' : '⚠️'}
- **Total Sessions:** ${docHealth.instructionMetrics.totalSessions}
- **Total Violations:** ${docHealth.instructionMetrics.totalViolations}

## Current Work

- **Branch:** ${currentWork.currentBranch}
- **Recent Commits:**
${currentWork.recentCommits.map(c => `  - ${c.hash}: ${c.message}`).join('\n') || '  - No recent commits'}
- **Open Issues:** P0: ${currentWork.openIssues.P0}, P1: ${currentWork.openIssues.P1}, P2: ${currentWork.openIssues.P2}

## Action Items

${claudeMdSize > 22500 ? '- [ ] Archive CLAUDE.md changelog entries (size approaching limit)\n' : ''}${driftReport.brokenLinks.length > 0 ? driftReport.brokenLinks.map(l => `- [ ] Fix broken link: ${l.link}`).join('\n') + '\n' : ''}${driftReport.staleFiles.length > 0 ? driftReport.staleFiles.map(f => `- [ ] Update stale file: ${f.file} (last updated ${f.daysSince} days ago)`).join('\n') + '\n' : ''}${claudeMdSize < 22500 && driftReport.brokenLinks.length === 0 && driftReport.staleFiles.length === 0 ? '- ✅ All systems healthy!' : ''}

## How to Use This System

### Daily (Automated)
All hooks run automatically after tool use - no manual action needed.

### Weekly (5 minutes - Every Sunday)

\`\`\`bash
# 1. Generate weekly summary
node .claude/hooks/weekly-aggregation.js

# 2. Update metrics and dashboard
node .claude/hooks/metrics-tracker.js
node .claude/hooks/drift-detection.js
node .claude/hooks/generate-dashboard.js

# 3. Review this dashboard
cat .claude/status/README.md
\`\`\`

### Before Commits (Manual)

\`\`\`bash
# Update current work status
node .claude/hooks/generate-status.js

# Check branch (prevent commits on main/develop)
node .claude/hooks/branch-check.js

# Prompt for learnings capture (if 3+ files changed)
node .claude/hooks/learning-prompt.js
\`\`\`

### Quarterly (1 hour)

\`\`\`bash
# Generate quarterly archive
node .claude/hooks/quarterly-archive.js --quarter=Q1 --year=2026

# Follow quarterly archive runbook (to be created in Phase 4)
\`\`\`
`

if (!fs.existsSync(statusDir)) {
  fs.mkdirSync(statusDir, { recursive: true })
}

fs.writeFileSync(path.join(statusDir, 'README.md'), dashboard)
console.log('✅ Dashboard generated: .claude/status/README.md')
