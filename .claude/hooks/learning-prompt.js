// Prompt AI to capture learnings after significant work
const { execSync } = require('child_process')

// Check if significant work was done
try {
  const diff = execSync('git diff --cached --stat', { encoding: 'utf8' })
  const filesChanged = (diff.match(/\d+ files? changed/)?.[0] || '0 files changed').split(' ')[0]

  if (parseInt(filesChanged) >= 3) {
    console.log('\n📝 REMINDER: Capture session learnings')
    console.log('   Significant changes detected. Consider documenting:')
    console.log('   - What went wrong (violations, failures)')
    console.log('   - What went right (successes, preventions)')
    console.log('   - Instruction effectiveness')
    console.log('   Template: .claude/learnings/TEMPLATE-daily-insight.md\n')
  }
} catch (error) {
  // Ignore errors (e.g., no staged changes)
}
