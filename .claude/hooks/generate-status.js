// Auto-generate current-work.json from git/build/issues
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim()
  } catch (error) {
    return null
  }
}

// Gather current status
const status = {
  lastUpdated: new Date().toISOString(),
  currentBranch: runCommand('git branch --show-current'),
  recentCommits: [],
  openIssues: {
    P0: 0,
    P1: 0,
    P2: 0,
  },
  buildStatus: {
    lastBuild: null,
    result: null,
    tests: null,
  },
  deploymentStatus: {
    production: 'https://moneto.vercel.app',
    lastDeployed: null,
  },
}

// Get recent commits
const commits = runCommand('git log -5 --pretty=format:"%h|%s"')
if (commits) {
  status.recentCommits = commits.split('\n').map(line => {
    const [hash, message] = line.split('|')
    return { hash, message }
  })
}

// Get open issues (if gh CLI available)
const issues = runCommand('gh issue list --json number,title,labels')
if (issues) {
  try {
    const parsedIssues = JSON.parse(issues)
    parsedIssues.forEach(issue => {
      const priority = issue.labels.find(l => l.name.startsWith('P'))
      if (priority) {
        const level = priority.name // P0, P1, P2
        status.openIssues[level] = (status.openIssues[level] || 0) + 1
      }
    })
  } catch (e) {
    // Ignore parse errors
  }
}

// Save status
const statusDir = path.join(process.cwd(), '.claude/status')
if (!fs.existsSync(statusDir)) {
  fs.mkdirSync(statusDir, { recursive: true })
}

const statusPath = path.join(statusDir, 'current-work.json')
fs.writeFileSync(statusPath, JSON.stringify(status, null, 2))
console.log(`✅ Status generated: ${statusPath}`)
