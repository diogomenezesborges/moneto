// Monitor file sizes and alert if approaching limits
const fs = require('fs')
const path = require('path')

const SIZE_LIMITS = {
  'CLAUDE.md': 25000, // 25K chars
  'docs/CHANGELOG.md': 20000, // 20K chars
}

const WARN_THRESHOLD = 0.9 // Warn at 90% of limit

function checkSize(filePath, limit) {
  const fullPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(fullPath)) return

  const content = fs.readFileSync(fullPath, 'utf8')
  const size = content.length
  const percentage = ((size / limit) * 100).toFixed(1)

  if (size > limit) {
    console.error(`❌ ERROR: ${filePath} exceeds limit!`)
    console.error(`   Size: ${size} chars (${percentage}% of ${limit} limit)`)
    console.error(`   Action: Archive content immediately`)
    process.exit(1)
  } else if (size > limit * WARN_THRESHOLD) {
    console.warn(`⚠️  WARNING: ${filePath} approaching limit`)
    console.warn(`   Size: ${size} chars (${percentage}% of ${limit} limit)`)
    console.warn(`   Consider archiving soon`)
  } else {
    console.log(`✅ ${filePath}: ${size} chars (${percentage}% of ${limit} limit)`)
  }
}

Object.entries(SIZE_LIMITS).forEach(([file, limit]) => {
  checkSize(file, limit)
})
