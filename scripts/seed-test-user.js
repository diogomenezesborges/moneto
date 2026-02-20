/**
 * Seed Test User for E2E Testing
 *
 * Creates a test user for Playwright E2E tests and manual testing.
 *
 * Usage:
 *   node scripts/seed-test-user.js
 *
 * Credentials:
 *   Username: testuser
 *   Password: testpass1234
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const TEST_USER = {
  name: 'testuser',
  password: 'testpass1234',
}

async function main() {
  console.log('Seeding test user...')
  console.log('')

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { name: TEST_USER.name },
    })

    if (existingUser) {
      console.log(`Test user "${TEST_USER.name}" already exists (ID: ${existingUser.id})`)
      console.log('   Skipping creation.')
      console.log('')
      console.log('Test Credentials:')
      console.log(`   Username: ${TEST_USER.name}`)
      console.log(`   Password: ${TEST_USER.password}`)
      console.log('')
      return
    }

    // Hash password with bcrypt
    console.log('Hashing password...')
    const pinHash = await bcrypt.hash(TEST_USER.password, 10)

    // Create test user
    console.log(`Creating test user "${TEST_USER.name}"...`)
    const user = await prisma.user.create({
      data: {
        name: TEST_USER.name,
        pinHash: pinHash,
      },
    })

    console.log(`Test user created successfully!`)
    console.log(`   User ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Created: ${user.createdAt}`)
    console.log('')
    console.log('Test Credentials:')
    console.log(`   Username: ${TEST_USER.name}`)
    console.log(`   Password: ${TEST_USER.password}`)
    console.log('')
    console.log('Ready for E2E testing!')
    console.log('   - Playwright tests can now authenticate')
    console.log('   - Manual testing via http://localhost:3000')
    console.log('')
  } catch (error) {
    console.error('Error seeding test user:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
