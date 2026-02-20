/**
 * Sample Seed Data for Moneto
 *
 * Creates a coherent fictional financial story for demo purposes.
 * Persona: Alex Morgan, a software developer living in a European city.
 * Currency: EUR
 *
 * Covers all feature areas:
 * - Core expenses (3-6 months of transaction history)
 * - Investment holdings (portfolio showcase)
 * - Categorization rules
 * - Budget targets
 * - AI categorization examples
 *
 * Usage:
 *   import { seedSampleData } from './seed-sample-data'
 *   await seedSampleData(prisma)
 *
 * This seed is designed to be called from a setup wizard or standalone script.
 * It checks for existing data and only seeds if explicitly requested.
 */

import { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(12, 0, 0, 0)
  return d
}

function monthStart(monthsBack: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsBack, 1)
  d.setHours(9, 0, 0, 0)
  return d
}

function randomDay(monthsBack: number, dayMin = 1, dayMax = 28): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - monthsBack)
  d.setDate(dayMin + Math.floor(Math.random() * (dayMax - dayMin)))
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0)
  return d
}

// ---------------------------------------------------------------------------
// Transaction templates
// ---------------------------------------------------------------------------

interface TxTemplate {
  description: string
  amount: number
  origin: string
  bank: string
  majorCategory?: string
  category?: string
  tags?: string[]
  status?: string
  classifierConfidence?: number
  classifierReasoning?: string
}

function monthlyTransactions(monthsBack: number): TxTemplate[] {
  return [
    // Salary (1st of month)
    {
      description: 'SALARY TRANSFER - TECHCORP LTD',
      amount: 3500,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Rendimento',
      category: 'Salario',
      status: 'categorized',
      tags: [],
    },
    // Rent (5th of month)
    {
      description: 'RENT PAYMENT - URBAN LIVING MGMT',
      amount: -950,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Casa',
      status: 'categorized',
      tags: ['type:rent'],
    },
    // Groceries (multiple per month)
    {
      description: 'SUPERMARKET FRESH MARKET',
      amount: -(85 + Math.round(Math.random() * 30)),
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Alimentacao',
      status: 'categorized',
      tags: ['type:groceries'],
    },
    {
      description: 'GROCERY STORE DOWNTOWN',
      amount: -(45 + Math.round(Math.random() * 25)),
      origin: 'Joint',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Alimentacao',
      status: 'categorized',
      tags: ['type:groceries'],
    },
    {
      description: 'ORGANIC MARKET WEEKLY SHOP',
      amount: -(60 + Math.round(Math.random() * 20)),
      origin: 'Personal',
      bank: 'Savings Bank',
      majorCategory: 'Custos Fixos',
      category: 'Alimentacao',
      status: 'categorized',
      tags: ['type:groceries'],
    },
    {
      description: 'BAKERY & PASTRY CORNER',
      amount: -(12 + Math.round(Math.random() * 8)),
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Alimentacao',
      status: 'categorized',
    },
    // Subscriptions
    {
      description: 'NETFLIX SUBSCRIPTION',
      amount: -12.99,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      status: 'categorized',
      tags: ['service:netflix'],
    },
    {
      description: 'SPOTIFY PREMIUM',
      amount: -9.99,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      status: 'categorized',
      tags: ['service:spotify'],
    },
    {
      description: 'GYM MEMBERSHIP - FIT CLUB',
      amount: -35,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      status: 'categorized',
      tags: ['sport:gym'],
    },
    // Transport
    {
      description: 'METRO MONTHLY PASS',
      amount: -40,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Variaveis',
      category: 'Transportes',
      status: 'categorized',
    },
    {
      description: 'FUEL STATION SHELL',
      amount: -(45 + Math.round(Math.random() * 20)),
      origin: 'Joint',
      bank: 'Savings Bank',
      majorCategory: 'Custos Variaveis',
      category: 'Transportes',
      status: 'categorized',
      tags: ['vehicle:car'],
    },
    // Dining out
    {
      description: 'RESTAURANT LA PIAZZA',
      amount: -(35 + Math.round(Math.random() * 25)),
      origin: 'Joint',
      bank: 'Main Bank',
      majorCategory: 'Custos Variaveis',
      category: 'Alimentacao',
      status: 'categorized',
      tags: ['type:dining-out'],
    },
    {
      description: 'CAFE CENTRAL ESPRESSO',
      amount: -(8 + Math.round(Math.random() * 7)),
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Variaveis',
      category: 'Alimentacao',
      status: 'categorized',
    },
    // Utilities
    {
      description: 'ELECTRICITY BILL - POWER CO',
      amount: -(65 + Math.round(Math.random() * 20)),
      origin: 'Joint',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Casa',
      status: 'categorized',
      tags: ['utility:electricity'],
    },
    {
      description: 'INTERNET PROVIDER FIBER 500',
      amount: -34.99,
      origin: 'Joint',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      status: 'categorized',
    },
    {
      description: 'MOBILE PHONE PLAN',
      amount: -24.99,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      status: 'categorized',
    },
  ]
}

// One-time / occasional transactions
const oneTimeTransactions: Array<TxTemplate & { daysAgo: number }> = [
  // Electronics purchase
  {
    description: 'ELECTRONICS STORE - HEADPHONES',
    amount: -149.99,
    origin: 'Personal',
    bank: 'Main Bank',
    majorCategory: 'Custos Variaveis',
    category: 'Compras',
    status: 'categorized',
    tags: ['type:electronics'],
    daysAgo: 45,
  },
  // Clothing
  {
    description: 'CLOTHING OUTLET SUMMER SALE',
    amount: -89.5,
    origin: 'Personal',
    bank: 'Savings Bank',
    majorCategory: 'Custos Variaveis',
    category: 'Compras',
    status: 'categorized',
    tags: ['type:clothing'],
    daysAgo: 30,
  },
  // Travel
  {
    description: 'AIRLINE TICKETS - WEEKEND TRIP',
    amount: -245,
    origin: 'Joint',
    bank: 'Main Bank',
    majorCategory: 'Custos Variaveis',
    category: 'Lazer',
    status: 'categorized',
    tags: ['trip:weekend-away'],
    daysAgo: 60,
  },
  {
    description: 'HOTEL BOOKING COASTAL RESORT',
    amount: -180,
    origin: 'Joint',
    bank: 'Main Bank',
    majorCategory: 'Custos Variaveis',
    category: 'Lazer',
    status: 'categorized',
    tags: ['trip:weekend-away'],
    daysAgo: 58,
  },
  // Refund
  {
    description: 'REFUND - ONLINE ORDER RETURN',
    amount: 45.99,
    origin: 'Personal',
    bank: 'Main Bank',
    majorCategory: 'Rendimento Extra',
    category: 'Reembolsos',
    status: 'categorized',
    daysAgo: 20,
  },
  // Medical
  {
    description: 'PHARMACY PRESCRIPTION',
    amount: -22.5,
    origin: 'Personal',
    bank: 'Main Bank',
    majorCategory: 'Custos Fixos',
    category: 'Saude',
    status: 'categorized',
    tags: ['type:pharmacy'],
    daysAgo: 15,
  },
  // Pending transactions (uncategorized)
  {
    description: 'TRANSFER FROM SAVINGS',
    amount: 200,
    origin: 'Personal',
    bank: 'Savings Bank',
    status: 'pending',
    daysAgo: 5,
  },
  {
    description: 'POS PAYMENT - MARKETPLACE',
    amount: -67.3,
    origin: 'Personal',
    bank: 'Main Bank',
    status: 'pending',
    daysAgo: 3,
  },
]

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function seedSampleData(prisma: PrismaClient): Promise<void> {
  console.log('Seeding sample data for demo...')

  // 1. Create demo user
  const user = await prisma.user.upsert({
    where: { id: 'demo-user-alex' },
    update: {},
    create: {
      id: 'demo-user-alex',
      name: 'Alex Morgan',
      pinHash: '$2b$10$placeholder.hash.for.demo.only.not.a.real.password', // Not a real hash
    },
  })
  console.log(`  Created user: ${user.name}`)

  // 2. Create transactions (4 months of recurring + one-time)
  const allTransactions: Array<{
    rawDate: Date
    rawDescription: string
    rawAmount: number
    origin: string
    bank: string
    majorCategory?: string
    category?: string
    tags: string[]
    status: string
    classifierConfidence?: number
    classifierReasoning?: string
    userId: string
  }> = []

  for (let month = 0; month < 4; month++) {
    const templates = monthlyTransactions(month)
    for (const tpl of templates) {
      const dayOffset = tpl.description.includes('SALARY')
        ? 1
        : tpl.description.includes('RENT')
          ? 5
          : 3 + Math.floor(Math.random() * 22)
      const d = new Date()
      d.setMonth(d.getMonth() - month, dayOffset)
      d.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0)

      allTransactions.push({
        rawDate: d,
        rawDescription: tpl.description,
        rawAmount: tpl.amount,
        origin: tpl.origin,
        bank: tpl.bank,
        majorCategory: tpl.majorCategory,
        category: tpl.category,
        tags: tpl.tags || [],
        status: tpl.status || 'pending',
        userId: user.id,
      })
    }
  }

  // Add one-time transactions
  for (const otx of oneTimeTransactions) {
    allTransactions.push({
      rawDate: daysAgo(otx.daysAgo),
      rawDescription: otx.description,
      rawAmount: otx.amount,
      origin: otx.origin,
      bank: otx.bank,
      majorCategory: otx.majorCategory,
      category: otx.category,
      tags: otx.tags || [],
      status: otx.status || 'pending',
      userId: user.id,
    })
  }

  // Add AI-classified examples (with confidence scores)
  const aiExamples = [
    {
      description: 'AMAZON MARKETPLACE ORDER',
      amount: -34.99,
      confidence: 0.92,
      reasoning: 'Amazon purchases are typically online shopping',
      majorCategory: 'Custos Variaveis',
      category: 'Compras',
      daysAgo: 8,
    },
    {
      description: 'GOOGLE STORAGE PLAN',
      amount: -2.99,
      confidence: 0.95,
      reasoning: 'Google Storage is a digital subscription service',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      daysAgo: 12,
    },
    {
      description: 'ATM WITHDRAWAL DOWNTOWN',
      amount: -100,
      confidence: 0.88,
      reasoning: 'ATM withdrawal is a cash transaction',
      majorCategory: 'Custos Variaveis',
      category: 'Levantamentos',
      daysAgo: 7,
    },
    {
      description: 'INSURANCE PREMIUM Q1',
      amount: -185,
      confidence: 0.78,
      reasoning: 'Quarterly insurance payment, could be health or property',
      majorCategory: 'Custos Fixos',
      category: 'Seguros',
      daysAgo: 35,
    },
    {
      description: 'BOOKSTORE ONLINE ORDER',
      amount: -28.5,
      confidence: 0.65,
      reasoning: 'Could be personal entertainment or professional development',
      majorCategory: 'Custos Variaveis',
      category: 'Lazer',
      daysAgo: 18,
    },
  ]

  for (const ex of aiExamples) {
    allTransactions.push({
      rawDate: daysAgo(ex.daysAgo),
      rawDescription: ex.description,
      rawAmount: ex.amount,
      origin: 'Personal',
      bank: 'Main Bank',
      majorCategory: ex.majorCategory,
      category: ex.category,
      tags: [],
      status: 'categorized',
      classifierConfidence: ex.confidence,
      classifierReasoning: ex.reasoning,
      userId: user.id,
    })
  }

  // Bulk create transactions
  await prisma.transaction.createMany({
    data: allTransactions,
    skipDuplicates: true,
  })
  console.log(`  Created ${allTransactions.length} transactions`)

  // 3. Create investment holdings
  const holdings = [
    {
      id: 'demo-holding-iwda',
      name: 'IWDA - iShares MSCI World',
      ticker: 'IWDA.AS',
      type: 'ETF' as const,
      currency: 'EUR',
      userId: user.id,
    },
    {
      id: 'demo-holding-bond',
      name: 'Euro Government Bond Fund',
      ticker: null,
      type: 'BOND' as const,
      currency: 'EUR',
      userId: user.id,
    },
    {
      id: 'demo-holding-tech',
      name: 'Tech Growth ETF',
      ticker: 'QQQ3.DE',
      type: 'ETF' as const,
      currency: 'EUR',
      userId: user.id,
    },
    {
      id: 'demo-holding-ppr',
      name: 'Retirement Savings Plan',
      ticker: null,
      type: 'PPR' as const,
      currency: 'EUR',
      userId: user.id,
    },
  ]

  for (const h of holdings) {
    await prisma.holding.upsert({
      where: { id: h.id },
      update: {},
      create: h,
    })
  }

  // Investment transactions
  const investTxs = [
    {
      holdingId: 'demo-holding-iwda',
      type: 'BUY' as const,
      units: 5.0,
      pricePerUnit: 82.5,
      fees: 1.5,
      date: daysAgo(180),
    },
    {
      holdingId: 'demo-holding-iwda',
      type: 'BUY' as const,
      units: 3.0,
      pricePerUnit: 85.2,
      fees: 1.5,
      date: daysAgo(90),
    },
    {
      holdingId: 'demo-holding-bond',
      type: 'BUY' as const,
      units: 10.0,
      pricePerUnit: 100.0,
      fees: 0.0,
      date: daysAgo(150),
    },
    {
      holdingId: 'demo-holding-tech',
      type: 'BUY' as const,
      units: 2.0,
      pricePerUnit: 145.0,
      fees: 2.0,
      date: daysAgo(120),
    },
    {
      holdingId: 'demo-holding-ppr',
      type: 'BUY' as const,
      units: 50.0,
      pricePerUnit: 10.8,
      fees: 0.0,
      date: daysAgo(200),
    },
  ]

  await prisma.investmentTransaction.createMany({
    data: investTxs,
    skipDuplicates: true,
  })
  console.log(
    `  Created ${holdings.length} holdings with ${investTxs.length} investment transactions`
  )

  // 4. Create categorization rules
  const rules = [
    { keyword: 'SALARY', majorCategory: 'Rendimento', category: 'Salario', tags: [] },
    {
      keyword: 'NETFLIX',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      tags: ['service:netflix'],
    },
    {
      keyword: 'SPOTIFY',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      tags: ['service:spotify'],
    },
    {
      keyword: 'SUPERMARKET|GROCERY|ORGANIC MARKET',
      majorCategory: 'Custos Fixos',
      category: 'Alimentacao',
      tags: ['type:groceries'],
    },
    {
      keyword: 'RENT PAYMENT',
      majorCategory: 'Custos Fixos',
      category: 'Casa',
      tags: ['type:rent'],
    },
    {
      keyword: 'RESTAURANT|CAFE|PIZZERIA',
      majorCategory: 'Custos Variaveis',
      category: 'Alimentacao',
      tags: ['type:dining-out'],
    },
    {
      keyword: 'FUEL STATION|PETROL|SHELL|BP',
      majorCategory: 'Custos Variaveis',
      category: 'Transportes',
      tags: ['vehicle:car'],
    },
    {
      keyword: 'PHARMACY|MEDICAL|DOCTOR',
      majorCategory: 'Custos Fixos',
      category: 'Saude',
      tags: [],
    },
    {
      keyword: 'AMAZON',
      majorCategory: 'Custos Variaveis',
      category: 'Compras',
      tags: ['service:amazon'],
    },
    {
      keyword: 'GYM|FIT CLUB',
      majorCategory: 'Custos Fixos',
      category: 'Subscricoes',
      tags: ['sport:gym'],
    },
  ]

  for (const rule of rules) {
    await prisma.rule.create({
      data: {
        keyword: rule.keyword,
        majorCategory: rule.majorCategory,
        category: rule.category,
        tags: rule.tags,
        userId: user.id,
      },
    })
  }
  console.log(`  Created ${rules.length} categorization rules`)

  // 5. Create budget targets
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const budgets = [
    { majorCategory: 'Custos Fixos', category: 'Alimentacao', budgetAmount: 400 },
    { majorCategory: 'Custos Variaveis', category: 'Alimentacao', budgetAmount: 200 },
    { majorCategory: 'Custos Variaveis', category: 'Transportes', budgetAmount: 150 },
    { majorCategory: 'Custos Variaveis', category: 'Lazer', budgetAmount: 100 },
    { majorCategory: 'Custos Variaveis', category: 'Compras', budgetAmount: 150 },
  ]

  // Create budgets for current and previous month
  for (const monthOffset of [0, 1]) {
    let m = currentMonth - monthOffset
    let y = currentYear
    if (m <= 0) {
      m += 12
      y -= 1
    }

    for (const budget of budgets) {
      await prisma.budget.upsert({
        where: {
          userId_majorCategory_category_month_year: {
            userId: user.id,
            majorCategory: budget.majorCategory,
            category: budget.category || '',
            month: m,
            year: y,
          },
        },
        update: {},
        create: {
          majorCategory: budget.majorCategory,
          category: budget.category,
          month: m,
          year: y,
          budgetAmount: budget.budgetAmount,
          userId: user.id,
        },
      })
    }
  }
  console.log(`  Created ${budgets.length * 2} budget targets (current + previous month)`)

  console.log('Sample data seeding complete!')
  console.log(
    `  Summary: 1 user, ${allTransactions.length} transactions, ${holdings.length} holdings, ${rules.length} rules, ${budgets.length * 2} budgets`
  )
}

// ---------------------------------------------------------------------------
// Standalone runner
// ---------------------------------------------------------------------------

async function main() {
  const prisma = new PrismaClient()
  try {
    await seedSampleData(prisma)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if executed directly (not imported)
if (require.main === module) {
  main().catch(e => {
    console.error('Error seeding sample data:', e)
    process.exit(1)
  })
}
