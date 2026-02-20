// Compress quarterly learnings into archive
const fs = require('fs')
const path = require('path')

// Parse command line args
const args = process.argv.slice(2)
const quarterArg = args.find(a => a.startsWith('--quarter='))
const yearArg = args.find(a => a.startsWith('--year='))

if (!quarterArg || !yearArg) {
  console.error('Usage: node quarterly-archive.js --quarter=Q1 --year=2026')
  process.exit(1)
}

const quarter = quarterArg.split('=')[1]
const year = yearArg.split('=')[1]

// Find all weekly summaries for quarter
const learningsDir = path.join(process.cwd(), `.claude/learnings/${year}-${quarter}`)
if (!fs.existsSync(learningsDir)) {
  console.error(`No learnings directory found: ${learningsDir}`)
  process.exit(1)
}

const weeklySummaries = fs
  .readdirSync(learningsDir)
  .filter(f => f.startsWith('week-') && f.endsWith('-summary.md'))
  .map(f => {
    const content = fs.readFileSync(path.join(learningsDir, f), 'utf8')
    return { file: f, content }
  })

if (weeklySummaries.length === 0) {
  console.log('No weekly summaries found for this quarter')
  process.exit(0)
}

// Aggregate metrics
let totalSessions = 0
let totalViolations = 0
weeklySummaries.forEach(({ content }) => {
  const sessionsMatch = content.match(/Total Sessions:\s*(\d+)/)
  const violationsMatch = content.match(/Violations:\s*(\d+)/)
  if (sessionsMatch) totalSessions += parseInt(sessionsMatch[1])
  if (violationsMatch) totalViolations += parseInt(violationsMatch[1])
})

// Generate quarterly summary
const archiveSummary = `# ${year} ${quarter} Learning Summary

**Quarter:** ${quarter} ${year}
**Weeks Covered:** ${weeklySummaries.length} weeks
**Date Range:** [Fill in manually]

## Executive Summary

- **Total Sessions:** ${totalSessions}
- **Total Violations:** ${totalViolations} (${((totalViolations / totalSessions) * 100).toFixed(1)}% of sessions)
- **Documentation Updates:** [Fill in manually]
- **Instruction Compliance:** ${(100 - (totalViolations / totalSessions) * 100).toFixed(1)}%

## Weekly Summaries

${weeklySummaries
  .map(({ file, content }) => {
    const weekNum = file.match(/week-(\d+)/)[1]
    return `### Week ${weekNum}\n\n${content.split('\n').slice(0, 20).join('\n')}\n\n[Full summary in original file]`
  })
  .join('\n\n---\n\n')}

## Top Learnings of the Quarter

[Manual curation needed - review weekly summaries and identify top 10 most impactful learnings]

## Recommendations for Next Quarter

[Manual entry needed based on patterns observed]
`

// Save to archive
const archiveDir = path.join(process.cwd(), '.claude/learnings/archive')
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true })
}

const archivePath = path.join(archiveDir, `${year}-${quarter}-learnings.md`)
fs.writeFileSync(archivePath, archiveSummary)
console.log(`✅ Quarterly archive generated: ${archivePath}`)

console.log(`\nNext steps:`)
console.log(`1. Review and complete manual sections in: ${archivePath}`)
console.log(`2. Consider deleting weekly files from ${learningsDir} (now archived)`)
console.log(`3. Bump CLAUDE.md version number if major changes made`)
console.log(`4. Update "Last Updated" timestamp in CLAUDE.md`)
