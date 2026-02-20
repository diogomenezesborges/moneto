// Verify not on main/develop before commit
const { execSync } = require('child_process')

try {
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()

  if (branch === 'main' || branch === 'develop') {
    console.error(`❌ ERROR: Cannot commit on protected branch: ${branch}`)
    console.error(`   Please create a feature branch first:`)
    console.error(`   git checkout -b feature/descriptive-name`)
    process.exit(1)
  }

  console.log(`✅ Branch check passed: ${branch}`)
} catch (error) {
  console.error('❌ ERROR: Could not determine current branch')
  process.exit(1)
}
