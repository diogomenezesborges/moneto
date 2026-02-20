const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function analyzeTransactions() {
  console.log('🔍 Starting Exploratory Data Analysis...\n')

  // Get all transactions
  const transactions = await prisma.transaction.findMany({
    orderBy: { rawDate: 'desc' },
  })

  console.log(`📊 Total Transactions: ${transactions.length}`)

  // Date range
  const dates = transactions.map(t => new Date(t.rawDate))
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))
  console.log(
    `📅 Date Range: ${minDate.toLocaleDateString('pt-PT')} to ${maxDate.toLocaleDateString('pt-PT')}`
  )

  // Income vs Expense
  const income = transactions.filter(t => t.rawAmount > 0)
  const expenses = transactions.filter(t => t.rawAmount < 0)
  const totalIncome = income.reduce((sum, t) => sum + t.rawAmount, 0)
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.rawAmount, 0))
  console.log(`\n💰 Financial Overview:`)
  console.log(`  Income: €${totalIncome.toFixed(2)} (${income.length} transactions)`)
  console.log(`  Expenses: €${totalExpenses.toFixed(2)} (${expenses.length} transactions)`)
  console.log(`  Net: €${(totalIncome - totalExpenses).toFixed(2)}`)
  console.log(`  Avg Income: €${(totalIncome / income.length).toFixed(2)}`)
  console.log(`  Avg Expense: €${(totalExpenses / expenses.length).toFixed(2)}`)

  // By Origin
  const byOrigin = {}
  transactions.forEach(t => {
    const origin = t.origin || 'Unknown'
    if (!byOrigin[origin]) {
      byOrigin[origin] = { count: 0, income: 0, expenses: 0 }
    }
    byOrigin[origin].count++
    if (t.rawAmount > 0) {
      byOrigin[origin].income += t.rawAmount
    } else {
      byOrigin[origin].expenses += Math.abs(t.rawAmount)
    }
  })
  console.log(`\n👥 By Origin:`)
  Object.entries(byOrigin).forEach(([origin, data]) => {
    console.log(
      `  ${origin}: ${data.count} transactions | Income: €${data.income.toFixed(2)} | Expenses: €${data.expenses.toFixed(2)}`
    )
  })

  // By Bank
  const byBank = {}
  transactions.forEach(t => {
    const bank = t.bank || 'Unknown'
    if (!byBank[bank]) {
      byBank[bank] = { count: 0, total: 0 }
    }
    byBank[bank].count++
    byBank[bank].total += Math.abs(t.rawAmount)
  })
  console.log(`\n🏦 By Bank (Top 10):`)
  Object.entries(byBank)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([bank, data]) => {
      console.log(`  ${bank}: ${data.count} transactions | Total: €${data.total.toFixed(2)}`)
    })

  // By Category
  const byMajorCategory = {}
  const byCategory = {}
  transactions.forEach(t => {
    const major = t.majorCategory || 'Uncategorized'
    const category = t.category || 'Uncategorized'

    if (!byMajorCategory[major]) {
      byMajorCategory[major] = { count: 0, total: 0 }
    }
    byMajorCategory[major].count++
    byMajorCategory[major].total += Math.abs(t.rawAmount)

    if (!byCategory[category]) {
      byCategory[category] = { count: 0, total: 0 }
    }
    byCategory[category].count++
    byCategory[category].total += Math.abs(t.rawAmount)
  })
  console.log(`\n📂 By Major Category:`)
  Object.entries(byMajorCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([cat, data]) => {
      console.log(`  ${cat}: ${data.count} transactions | €${data.total.toFixed(2)}`)
    })

  console.log(`\n📁 Top 15 Categories by Spending:`)
  Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .forEach(([cat, data]) => {
      console.log(`  ${cat}: ${data.count} transactions | €${data.total.toFixed(2)}`)
    })

  // Monthly analysis
  const byMonth = {}
  transactions.forEach(t => {
    const date = new Date(t.rawDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { income: 0, expenses: 0, count: 0 }
    }
    byMonth[monthKey].count++
    if (t.rawAmount > 0) {
      byMonth[monthKey].income += t.rawAmount
    } else {
      byMonth[monthKey].expenses += Math.abs(t.rawAmount)
    }
  })
  console.log(`\n📈 Monthly Breakdown (Last 12 months):`)
  Object.entries(byMonth)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12)
    .forEach(([month, data]) => {
      const net = data.income - data.expenses
      console.log(
        `  ${month}: ${data.count} trans | Income: €${data.income.toFixed(2)} | Expenses: €${data.expenses.toFixed(2)} | Net: €${net.toFixed(2)}`
      )
    })

  // Largest transactions
  console.log(`\n💎 Top 10 Largest Expenses:`)
  transactions
    .filter(t => t.rawAmount < 0)
    .sort((a, b) => a.rawAmount - b.rawAmount)
    .slice(0, 10)
    .forEach(t => {
      console.log(
        `  €${Math.abs(t.rawAmount).toFixed(2)} | ${t.rawDescription} | ${new Date(t.rawDate).toLocaleDateString('pt-PT')}`
      )
    })

  console.log(`\n💰 Top 10 Largest Incomes:`)
  transactions
    .filter(t => t.rawAmount > 0)
    .sort((a, b) => b.rawAmount - a.rawAmount)
    .slice(0, 10)
    .forEach(t => {
      console.log(
        `  €${t.rawAmount.toFixed(2)} | ${t.rawDescription} | ${new Date(t.rawDate).toLocaleDateString('pt-PT')}`
      )
    })

  // Status analysis
  const categorized = transactions.filter(t => t.majorCategory && t.category).length
  const uncategorized = transactions.length - categorized
  console.log(`\n✅ Categorization Status:`)
  console.log(
    `  Categorized: ${categorized} (${((categorized / transactions.length) * 100).toFixed(1)}%)`
  )
  console.log(
    `  Uncategorized: ${uncategorized} (${((uncategorized / transactions.length) * 100).toFixed(1)}%)`
  )

  console.log('\n✨ Analysis Complete!')
}

analyzeTransactions()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
