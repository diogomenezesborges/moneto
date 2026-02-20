const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function backupDatabase(backupDir) {
  console.log('Starting database backup...\n')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  try {
    // 1. Backup Transactions
    console.log('Backing up transactions...')
    const transactions = await prisma.transaction.findMany({
      orderBy: { rawDate: 'desc' },
    })
    fs.writeFileSync(
      path.join(backupDir, 'transactions.json'),
      JSON.stringify(transactions, null, 2)
    )
    console.log(`  -> ${transactions.length} transactions backed up`)

    // 2. Backup Major Categories
    console.log('Backing up major categories...')
    const majorCategories = await prisma.majorCategory.findMany({
      include: { categories: true },
    })
    fs.writeFileSync(
      path.join(backupDir, 'major_categories.json'),
      JSON.stringify(majorCategories, null, 2)
    )
    console.log(`  -> ${majorCategories.length} major categories backed up`)

    // 3. Backup Categories
    console.log('Backing up categories...')
    const categories = await prisma.category.findMany()
    fs.writeFileSync(path.join(backupDir, 'categories.json'), JSON.stringify(categories, null, 2))
    console.log(`  -> ${categories.length} categories backed up`)

    // 4. Backup Rules
    console.log('Backing up rules...')
    const rules = await prisma.rule.findMany()
    fs.writeFileSync(path.join(backupDir, 'rules.json'), JSON.stringify(rules, null, 2))
    console.log(`  -> ${rules.length} rules backed up`)

    // 5. Backup Budgets
    console.log('Backing up budgets...')
    const budgets = await prisma.budget.findMany()
    fs.writeFileSync(path.join(backupDir, 'budgets.json'), JSON.stringify(budgets, null, 2))
    console.log(`  -> ${budgets.length} budgets backed up`)

    // 6. Backup Users (without sensitive data for reference)
    console.log('Backing up users...')
    const users = await prisma.user.findMany({
      select: { id: true, name: true, createdAt: true },
    })
    fs.writeFileSync(path.join(backupDir, 'users.json'), JSON.stringify(users, null, 2))
    console.log(`  -> ${users.length} users backed up`)

    // 7. Backup Banks
    console.log('Backing up banks...')
    const banks = await prisma.bank.findMany()
    fs.writeFileSync(path.join(backupDir, 'banks.json'), JSON.stringify(banks, null, 2))
    console.log(`  -> ${banks.length} banks backed up`)

    // 8. Create summary
    const summary = {
      backupDate: new Date().toISOString(),
      counts: {
        transactions: transactions.length,
        majorCategories: majorCategories.length,
        categories: categories.length,
        rules: rules.length,
        budgets: budgets.length,
        users: users.length,
        banks: banks.length,
      },
      uniqueOldCategories: {
        majorCategories: [...new Set(transactions.map(t => t.majorCategory).filter(Boolean))],
        categories: [...new Set(transactions.map(t => t.category).filter(Boolean))],
        subCategories: [...new Set(transactions.map(t => t.subCategory).filter(Boolean))],
      },
    }
    fs.writeFileSync(path.join(backupDir, 'backup_summary.json'), JSON.stringify(summary, null, 2))

    console.log('\n=== BACKUP COMPLETE ===')
    console.log(`Location: ${backupDir}`)
    console.log('\nSummary:')
    console.log(JSON.stringify(summary.counts, null, 2))
    console.log('\nUnique old text-based categories in transaction metadata:')
    console.log(`  Major: ${summary.uniqueOldCategories.majorCategories.length}`)
    console.log(`  Category: ${summary.uniqueOldCategories.categories.length}`)
    console.log(
      `  SubCategory: ${summary.uniqueOldCategories.subCategories.length} (deprecated field)`
    )

    return summary
  } catch (error) {
    console.error('Backup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get backup directory from command line or use default
const backupDir = process.argv[2] || './backups/manual_backup'

// Ensure directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

backupDatabase(backupDir)
