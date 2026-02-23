/**
 * Seed script for category taxonomy v3
 * Based on category_migration_v2.xlsx "New Structure" sheet
 *
 * Run: node prisma/seed-taxonomy-v3.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Helper to create slug from Portuguese name
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

// ============ TAXONOMY STRUCTURE FROM EXCEL ============

const TAXONOMY = [
  {
    name: 'Rendimento',
    nameEn: 'Income',
    slug: 'rendimento',
    budgetCategory: null, // Income doesn't map to 50/30/20
    emoji: '💰',
    sortOrder: 1,
    categories: [
      {
        name: 'Salário',
        nameEn: 'Salary',
        icon: 'briefcase',
        subCategories: ['Líquido', 'Subsídios', 'Prémios'],
      },
      {
        name: 'Reembolsos',
        nameEn: 'Refunds',
        icon: 'receipt',
        subCategories: [],
      },
    ],
  },
  {
    name: 'Rendimento Extra',
    nameEn: 'Side Income',
    slug: 'rendimento_extra',
    budgetCategory: null,
    emoji: '🎁',
    sortOrder: 2,
    categories: [
      { name: 'Vendas', nameEn: 'Sales', icon: 'shopping-bag', subCategories: [] },
      { name: 'Aluguer', nameEn: 'Rental', icon: 'home', subCategories: [] },
      { name: 'Projectos', nameEn: 'Side Projects', icon: 'code', subCategories: [] },
      { name: 'Prendas Recebidas', nameEn: 'Gifts Received', icon: 'gift', subCategories: [] },
      { name: 'Outros', nameEn: 'Other', icon: 'more-horizontal', subCategories: [] },
    ],
  },
  {
    name: 'Economia e Investimentos',
    nameEn: 'Savings & Investments',
    slug: 'economia_investimentos',
    budgetCategory: '20_savings',
    emoji: '📈',
    sortOrder: 3,
    categories: [
      {
        name: 'Poupança',
        nameEn: 'Savings',
        icon: 'piggy-bank',
        subCategories: ['Emergência', 'Pessoal', 'Filhos'],
      },
      {
        name: 'Investimento',
        nameEn: 'Investments',
        icon: 'trending-up',
        subCategories: ['PPR', 'ETF/Ações', 'Cripto', 'Depósitos', 'Outros'],
      },
    ],
  },
  {
    name: 'Custos Fixos',
    nameEn: 'Fixed Expenses',
    slug: 'custos_fixos',
    budgetCategory: '50_needs',
    emoji: '🏠',
    sortOrder: 4,
    categories: [
      {
        name: 'Habitação',
        nameEn: 'Housing',
        icon: 'home',
        subCategories: ['Prestação', 'Condomínio', 'Utilidades', 'Seguros', 'Amortização'],
      },
      {
        name: 'Transportes',
        nameEn: 'Transportation',
        icon: 'car',
        subCategories: ['Combustível', 'Portagens', 'Seguro', 'IUC', 'Inspeção'],
      },
      {
        name: 'Seguros Pessoais',
        nameEn: 'Personal Insurance',
        icon: 'shield',
        subCategories: ['Vida', 'Saúde', 'Animal'],
      },
      {
        name: 'Subscrições',
        nameEn: 'Subscriptions',
        icon: 'credit-card',
        subCategories: ['Telemóvel', 'Internet', 'Cloud'],
      },
      {
        name: 'Conta Conjunta',
        nameEn: 'Joint Account',
        icon: 'users',
        subCategories: [],
      },
    ],
  },
  {
    name: 'Custos Variáveis',
    nameEn: 'Essential Expenses',
    slug: 'custos_variaveis',
    budgetCategory: '50_needs',
    emoji: '🛒',
    sortOrder: 5,
    categories: [
      {
        name: 'Alimentação',
        nameEn: 'Food & Groceries',
        icon: 'shopping-cart',
        subCategories: ['Supermercado', 'Refeições Fora', 'Take Away'],
      },
      {
        name: 'Saúde',
        nameEn: 'Healthcare',
        icon: 'heart',
        subCategories: ['Consultas', 'Exames', 'Medicamentos', 'Dentista', 'Desporto', 'Terapia'],
      },
      {
        name: 'Parentalidade',
        nameEn: 'Childcare',
        icon: 'baby',
        subCategories: ['Vestuário', 'Saúde', 'Creche', 'Outros'],
      },
      {
        name: 'Cuidados Pessoais',
        nameEn: 'Personal Care',
        icon: 'smile',
        subCategories: [],
      },
      {
        name: 'Axl',
        nameEn: 'Pet Care',
        icon: 'cat',
        subCategories: ['Ração', 'Veterinário', 'Outros'],
      },
      {
        name: 'Educação',
        nameEn: 'Education',
        icon: 'book-open',
        subCategories: [],
      },
      {
        name: 'Solidariedade',
        nameEn: 'Giving',
        icon: 'heart-handshake',
        subCategories: [],
      },
      {
        name: 'Transportes',
        nameEn: 'Transportation',
        icon: 'car',
        subCategories: ['Manutenção', 'Estacionamento', 'Público', 'Outros'],
      },
      {
        name: 'Casa',
        nameEn: 'Home Maintenance',
        icon: 'wrench',
        subCategories: ['Manutenção', 'Obras', 'Outros'],
      },
      {
        name: 'Trabalho',
        nameEn: 'Work Expenses',
        icon: 'briefcase',
        subCategories: [],
      },
    ],
  },
  {
    name: 'Gastos sem Culpa',
    nameEn: 'Guilt-Free Spending',
    slug: 'gastos_sem_culpa',
    budgetCategory: '30_wants',
    emoji: '🎉',
    sortOrder: 6,
    categories: [
      {
        name: 'Lazer',
        nameEn: 'Lifestyle',
        icon: 'sun',
        subCategories: ['Viagens', 'Atividades', 'Date Night', 'Projectos'],
      },
      {
        name: 'Compras',
        nameEn: 'Shopping',
        icon: 'shopping-bag',
        subCategories: ['Vestuário', 'Casa', 'Acessórios', 'Outros'],
      },
      {
        name: 'Prendas',
        nameEn: 'Gifts',
        icon: 'gift',
        subCategories: [],
      },
      {
        name: 'Subscrições Lazer',
        nameEn: 'Entertainment Subs',
        icon: 'tv',
        subCategories: [],
      },
    ],
  },
]

async function clearTables() {
  console.log('Clearing existing category tables...')

  // Delete in order (respecting foreign keys)
  await prisma.subCategory.deleteMany({ where: { userId: null } })
  await prisma.category.deleteMany({ where: { userId: null } })
  await prisma.majorCategory.deleteMany({ where: { userId: null } })

  console.log('✓ Tables cleared')
}

async function seedTaxonomy() {
  console.log('\nSeeding taxonomy from Excel structure...\n')

  let majorCount = 0
  let categoryCount = 0
  let subCategoryCount = 0

  for (const major of TAXONOMY) {
    const majorId = `mc_${major.slug}`

    // Create Major Category
    await prisma.majorCategory.create({
      data: {
        id: majorId,
        name: major.name,
        nameEn: major.nameEn,
        slug: major.slug,
        emoji: major.emoji,
        budgetCategory: major.budgetCategory,
        sortOrder: major.sortOrder,
        userId: null,
      },
    })
    majorCount++
    console.log(`📁 ${major.emoji} ${major.name}`)

    let catSortOrder = 1
    for (const cat of major.categories) {
      const catSlug = slugify(cat.name)
      const catId = `cat_${major.slug}_${catSlug}`

      // Create Category
      await prisma.category.create({
        data: {
          id: catId,
          majorCategoryId: majorId,
          name: cat.name,
          nameEn: cat.nameEn,
          slug: catSlug,
          icon: cat.icon || null,
          sortOrder: catSortOrder++,
          userId: null,
        },
      })
      categoryCount++
      console.log(`   📂 ${cat.name} (${cat.nameEn})`)

      let subSortOrder = 1
      for (const subName of cat.subCategories) {
        const subSlug = slugify(subName)
        const subId = `sub_${major.slug}_${catSlug}_${subSlug}`

        // Create SubCategory
        await prisma.subCategory.create({
          data: {
            id: subId,
            categoryId: catId,
            name: subName,
            nameEn: null, // Can be added later
            slug: subSlug,
            icon: null,
            sortOrder: subSortOrder++,
            userId: null,
          },
        })
        subCategoryCount++
        console.log(`      📄 ${subName}`)
      }
    }
    console.log('')
  }

  return { majorCount, categoryCount, subCategoryCount }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗')
  console.log('║  Category Taxonomy Seed v3                 ║')
  console.log('║  Based on category_migration_v2.xlsx       ║')
  console.log('╚════════════════════════════════════════════╝\n')

  try {
    await clearTables()
    const counts = await seedTaxonomy()

    console.log('════════════════════════════════════════════')
    console.log('✅ Seeding complete!')
    console.log(`   Major Categories: ${counts.majorCount}`)
    console.log(`   Categories: ${counts.categoryCount}`)
    console.log(`   SubCategories: ${counts.subCategoryCount}`)
    console.log('════════════════════════════════════════════')
  } catch (error) {
    console.error('❌ Error seeding taxonomy:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
