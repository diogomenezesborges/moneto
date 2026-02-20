// Track instruction effectiveness from learning summaries
const fs = require('fs')
const path = require('path')

// Find all weekly summaries
const learningsDir = path.join(process.cwd(), '.claude/learnings')
if (!fs.existsSync(learningsDir)) {
  console.log('No learnings directory found')
  process.exit(0)
}

const quarters = fs.readdirSync(learningsDir).filter(f => f.match(/\d{4}-Q\d/))

let totalSessions = 0
let totalViolations = 0

quarters.forEach(quarter => {
  const quarterDir = path.join(learningsDir, quarter)
  if (!fs.existsSync(quarterDir) || !fs.statSync(quarterDir).isDirectory()) {
    return
  }

  const summaries = fs
    .readdirSync(quarterDir)
    .filter(f => f.startsWith('week-') && f.endsWith('-summary.md'))

  summaries.forEach(file => {
    const content = fs.readFileSync(path.join(quarterDir, file), 'utf8')

    // Extract metrics
    const sessionsMatch = content.match(/Total Sessions:\s*~?(\d+)/)
    const violationsMatch = content.match(/Violations:\s*(\d+)/)

    if (sessionsMatch) totalSessions += parseInt(sessionsMatch[1])
    if (violationsMatch) totalViolations += parseInt(violationsMatch[1])
  })
})

// Calculate metrics
const complianceRate =
  totalSessions > 0 ? (((totalSessions - totalViolations) / totalSessions) * 100).toFixed(1) : 0

const metrics = {
  lastUpdated: new Date().toISOString(),
  instructionMetrics: {
    totalSessions,
    totalViolations,
    complianceRate: `${complianceRate}%`,
    target: '90%',
    status: complianceRate >= 90 ? 'HEALTHY' : 'NEEDS_IMPROVEMENT',
  },
}

// Save metrics
const statusDir = path.join(process.cwd(), '.claude/status')
if (!fs.existsSync(statusDir)) {
  fs.mkdirSync(statusDir, { recursive: true })
}

const metricsPath = path.join(statusDir, 'doc-health.json')
fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2))
console.log(`✅ Metrics tracked: ${metricsPath}`)
console.log(`   Compliance Rate: ${complianceRate}% (target: 90%)`)
