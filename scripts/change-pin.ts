/**
 * Change PIN for a user
 * Usage: npx tsx scripts/change-pin.ts <username> <new-pin>
 * Example: npx tsx scripts/change-pin.ts MyUser 1234
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    const [username, newPin] = process.argv.slice(2)

    if (!username || !newPin) {
      console.log('❌ Usage: npx tsx scripts/change-pin.ts <username> <new-pin>')
      console.log('Example: npx tsx scripts/change-pin.ts MyUser 1234')
      console.log('\n👥 Available users:')

      const users = await prisma.user.findMany({
        select: { name: true },
      })
      users.forEach(user => console.log(`  - ${user.name}`))
      return
    }

    if (newPin.length < 4) {
      console.log('❌ PIN must be at least 4 characters')
      return
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { name: username },
    })

    if (!user) {
      console.log(`❌ User "${username}" not found`)
      console.log('\n👥 Available users:')
      const users = await prisma.user.findMany({
        select: { name: true },
      })
      users.forEach(u => console.log(`  - ${u.name}`))
      return
    }

    // Hash the new PIN
    console.log('🔐 Hashing new PIN...')
    const pinHash = await bcrypt.hash(newPin, 10)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { pinHash },
    })

    console.log(`\n✅ PIN updated successfully for ${user.name}!`)
    console.log('You can now login with your new PIN.')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
