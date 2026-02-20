// Validate markdown links in documentation
const fs = require('fs')
const path = require('path')

const DOCS_TO_CHECK = [
  'CLAUDE.md',
  'docs/ARCHITECTURE.md',
  'docs/DATABASE.md',
  'docs/API_REFERENCE.md',
]

function validateLinks(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(fullPath)) return

  const content = fs.readFileSync(fullPath, 'utf8')
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const brokenLinks = []

  let match
  while ((match = linkRegex.exec(content)) !== null) {
    const [, text, link] = match

    // Skip external URLs
    if (link.startsWith('http')) continue
    // Skip anchor-only links
    if (link.startsWith('#')) continue

    // Check if file exists (remove anchor)
    const targetPath = link.split('#')[0]
    // Resolve relative to the file's directory
    const fileDir = path.dirname(fullPath)
    const targetFullPath = path.resolve(fileDir, targetPath)

    if (!fs.existsSync(targetFullPath)) {
      brokenLinks.push({ text, link, file: filePath })
    }
  }

  if (brokenLinks.length > 0) {
    console.warn(`⚠️  Broken links found in ${filePath}:`)
    brokenLinks.forEach(({ text, link }) => {
      console.warn(`   - [${text}](${link})`)
    })
  }
}

DOCS_TO_CHECK.forEach(validateLinks)
console.log('✅ Link validation complete')
