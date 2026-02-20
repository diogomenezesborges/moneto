// Aggregate daily insights into weekly summary
const fs = require('fs')
const path = require('path')

// Determine current week and quarter
const now = new Date()
const startOfYear = new Date(now.getFullYear(), 0, 1)
const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
const quarter = Math.ceil((now.getMonth() + 1) / 3)
const year = now.getFullYear()

// Find all daily insights for current week
const learningsDir = path.join(process.cwd(), `.claude/learnings/${year}-Q${quarter}`)
if (!fs.existsSync(learningsDir)) {
  console.log('No learnings directory found for current quarter')
  process.exit(0)
}

const insights = fs
  .readdirSync(learningsDir)
  .filter(f => f.endsWith('-insight.md'))
  .map(f => {
    const content = fs.readFileSync(path.join(learningsDir, f), 'utf8')
    return { file: f, content }
  })

if (insights.length === 0) {
  console.log('No daily insights found for this week')
  process.exit(0)
}

// Extract patterns
const violations = []
const successes = []
const suggestions = []

insights.forEach(({ file, content }) => {
  // Extract "What Went Wrong" sections
  const wrongRegex = /## What Went Wrong\n([\s\S]*?)(?=\n## )/
  const wrongMatch = content.match(wrongRegex)
  if (wrongMatch) violations.push(wrongMatch[1].trim())

  // Extract "What Went Right" sections
  const rightRegex = /## What Went Right\n([\s\S]*?)(?=\n## )/
  const rightMatch = content.match(rightRegex)
  if (rightMatch) successes.push(rightMatch[1].trim())

  // Extract suggestions
  const suggestRegex = /## Suggested Documentation Changes\n([\s\S]*?)$/
  const suggestMatch = content.match(suggestRegex)
  if (suggestMatch) suggestions.push(suggestMatch[1].trim())
})

// Generate weekly summary
const weekStart = new Date(now)
weekStart.setDate(now.getDate() - now.getDay()) // Sunday
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 6) // Saturday

const summary = `# Week ${weekNumber} Summary - ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}

**Week:** ${weekNumber}
**Date Range:** ${weekStart.toDateString()} - ${weekEnd.toDateString()}
**Quarter:** Q${quarter}

## Metrics

- **Total Sessions:** ${insights.length}
- **Total Hours:** [Manual entry needed]
- **Violations:** ${violations.length}
- **Learnings Captured:** ${insights.length}
- **Instructions Updated:** [Manual entry needed]

## Top Issues (Repeated Problems)

${violations.length > 0 ? violations.map((v, i) => `${i + 1}. ${v}`).join('\n\n') : 'None this week'}

## Top Wins (Effective Instructions)

${successes.length > 0 ? successes.map((s, i) => `${i + 1}. ${s}`).join('\n\n') : 'None captured this week'}

## Suggested Documentation Changes

${suggestions.length > 0 ? suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n\n') : 'None suggested'}

## Action Items for Next Week

- [ ] Review suggested changes above
- [ ] Monitor effectiveness of recent updates
- [ ] Continue capturing daily insights
`

const outputPath = path.join(learningsDir, `week-${weekNumber}-summary.md`)
fs.writeFileSync(outputPath, summary)
console.log(`✅ Weekly summary generated: ${outputPath}`)
console.log(`\nNext steps:`)
console.log(`1. Review the summary: cat ${outputPath}`)
console.log(`2. Fill in manual metrics (hours, updates)`)
console.log(`3. Respond to critical issues immediately`)
console.log(`4. Add non-critical items to monthly review backlog`)
