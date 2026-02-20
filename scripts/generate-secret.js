#!/usr/bin/env node

/**
 * Generate Cryptographically Secure Secrets
 *
 * Usage:
 *   node scripts/generate-secret.js [length]
 *
 * Examples:
 *   node scripts/generate-secret.js     # Generates 48-byte secret (default)
 *   node scripts/generate-secret.js 32  # Generates 32-byte secret
 *   node scripts/generate-secret.js 64  # Generates 64-byte secret
 */

const crypto = require('crypto')

const DEFAULT_LENGTH = 48 // bytes
const MIN_LENGTH = 32 // minimum for JWT secrets

function generateSecret(length = DEFAULT_LENGTH) {
  if (length < MIN_LENGTH) {
    console.error(`❌ Error: Secret length must be at least ${MIN_LENGTH} bytes`)
    console.error(`   Requested: ${length} bytes`)
    process.exit(1)
  }

  // Generate cryptographically secure random bytes
  const secret = crypto.randomBytes(length).toString('base64')

  return secret
}

function main() {
  const args = process.argv.slice(2)
  const length = args[0] ? parseInt(args[0], 10) : DEFAULT_LENGTH

  if (isNaN(length)) {
    console.error('❌ Error: Length must be a number')
    console.error(`   Usage: node scripts/generate-secret.js [length]`)
    process.exit(1)
  }

  console.log('🔐 Generating cryptographically secure secret...\n')

  const secret = generateSecret(length)

  console.log('✅ Secret generated successfully!\n')
  console.log('━'.repeat(80))
  console.log(secret)
  console.log('━'.repeat(80))
  console.log(`\nLength: ${secret.length} characters (${length} bytes base64-encoded)`)
  console.log(`\n💡 Copy this secret to your .env file or Vercel environment variables:`)
  console.log(`   JWT_SECRET="${secret}"`)
  console.log(`\n⚠️  Security Reminder:`)
  console.log(`   - Never commit this secret to version control`)
  console.log(`   - Store securely in environment variables only`)
  console.log(`   - Rotate every 90-180 days for security`)
  console.log(`   - See docs/JWT_SECRET_ROTATION.md for rotation guide\n`)
}

main()
