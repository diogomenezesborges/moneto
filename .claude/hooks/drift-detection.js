// Detect stale documentation and inconsistencies
const fs = require('fs')
const path = require('path')

const STALE_THRESHOLD_DAYS = 180 // 6 months

function checkStaleFiles() {
  const docsDir = path.join(process.cwd(), 'docs')
  if (!fs.existsSync(docsDir)) {
    return []
  }

  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'))

  const staleFiles = []
  const now = new Date()

  files.forEach(file => {
    const filePath = path.join(docsDir, file)
    const stats = fs.statSync(filePath)
    const daysSinceModified = Math.floor((now - stats.mtime) / (1000 * 60 * 60 * 24))

    if (daysSinceModified > STALE_THRESHOLD_DAYS) {
      staleFiles.push({
        file: `docs/${file}`,
        lastModified: stats.mtime.toISOString().split('T')[0],
        daysSince: daysSinceModified,
      })
    }
  })

  return staleFiles
}

function checkDocumentationIndex() {
  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md')
  if (!fs.existsSync(claudeMdPath)) {
    return []
  }

  const claudeMd = fs.readFileSync(claudeMdPath, 'utf8')
  const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g

  const brokenLinks = []
  let match

  while ((match = linkRegex.exec(claudeMd)) !== null) {
    const [, text, link] = match
    const filePath = path.join(process.cwd(), link)

    if (!fs.existsSync(filePath)) {
      brokenLinks.push({ text, link, file: 'CLAUDE.md' })
    }
  }

  return brokenLinks
}

// Run checks
const staleFiles = checkStaleFiles()
const brokenLinks = checkDocumentationIndex()

const report = {
  lastUpdated: new Date().toISOString(),
  staleFiles,
  brokenLinks,
  health: staleFiles.length === 0 && brokenLinks.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION',
}

// Save report
const statusDir = path.join(process.cwd(), '.claude/status')
if (!fs.existsSync(statusDir)) {
  fs.mkdirSync(statusDir, { recursive: true })
}

const reportPath = path.join(statusDir, 'drift-report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

if (staleFiles.length > 0) {
  console.warn(`⚠️  Found ${staleFiles.length} stale file(s) (>6 months old)`)
}
if (brokenLinks.length > 0) {
  console.warn(`⚠️  Found ${brokenLinks.length} broken link(s) in CLAUDE.md`)
}
if (report.health === 'HEALTHY') {
  console.log('✅ Documentation health: HEALTHY')
}
console.log(`📊 Drift report saved: ${reportPath}`)
