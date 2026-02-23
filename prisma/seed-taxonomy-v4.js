/**
 * Seed script for 2-level category taxonomy + tags
 * Based on category_migration_v2.xlsx - simplified structure
 *
 * Run: node prisma/seed-taxonomy-v4.js
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

// ============ 2-LEVEL TAXONOMY (Major → Category only) ============

const TAXONOMY = [
  {
    name: 'Rendimento',
    nameEn: 'Income',
    slug: 'rendimento',
    budgetCategory: null,
    emoji: '💰',
    sortOrder: 1,
    categories: [
      { name: 'Salário', nameEn: 'Salary', icon: 'briefcase' },
      { name: 'Reembolsos', nameEn: 'Refunds', icon: 'receipt' },
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
      { name: 'Vendas', nameEn: 'Sales', icon: 'shopping-bag' },
      { name: 'Aluguer', nameEn: 'Rental', icon: 'home' },
      { name: 'Projectos', nameEn: 'Side Projects', icon: 'code' },
      { name: 'Prendas Recebidas', nameEn: 'Gifts Received', icon: 'gift' },
      { name: 'Outros', nameEn: 'Other', icon: 'more-horizontal' },
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
      { name: 'Poupança', nameEn: 'Savings', icon: 'piggy-bank' },
      { name: 'Investimento', nameEn: 'Investments', icon: 'trending-up' },
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
      { name: 'Habitação', nameEn: 'Housing', icon: 'home' },
      { name: 'Transportes', nameEn: 'Transportation', icon: 'car' },
      { name: 'Seguros Pessoais', nameEn: 'Personal Insurance', icon: 'shield' },
      { name: 'Subscrições', nameEn: 'Subscriptions', icon: 'credit-card' },
      { name: 'Conta Conjunta', nameEn: 'Joint Account', icon: 'users' },
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
      { name: 'Alimentação', nameEn: 'Food & Groceries', icon: 'shopping-cart' },
      { name: 'Saúde', nameEn: 'Healthcare', icon: 'heart' },
      { name: 'Parentalidade', nameEn: 'Childcare', icon: 'baby' },
      { name: 'Cuidados Pessoais', nameEn: 'Personal Care', icon: 'smile' },
      { name: 'Axl', nameEn: 'Pet Care', icon: 'cat' },
      { name: 'Educação', nameEn: 'Education', icon: 'book-open' },
      { name: 'Solidariedade', nameEn: 'Giving', icon: 'heart-handshake' },
      { name: 'Transportes', nameEn: 'Transportation', icon: 'car' },
      { name: 'Casa', nameEn: 'Home Maintenance', icon: 'wrench' },
      { name: 'Trabalho', nameEn: 'Work Expenses', icon: 'briefcase' },
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
      { name: 'Lazer', nameEn: 'Lifestyle', icon: 'sun' },
      { name: 'Compras', nameEn: 'Shopping', icon: 'shopping-bag' },
      { name: 'Prendas', nameEn: 'Gifts', icon: 'gift' },
      { name: 'Subscrições Lazer', nameEn: 'Entertainment Subs', icon: 'tv' },
    ],
  },
]

// ============ TAG DEFINITIONS (includes converted subcategories) ============

const TAG_DEFINITIONS = [
  // === TYPE tags (converted from subcategories) ===
  // Salário types
  { namespace: 'type', value: 'liquido', label: 'Líquido', labelEn: 'Net', color: '#10B981' },
  {
    namespace: 'type',
    value: 'subsidio',
    label: 'Subsídio',
    labelEn: 'Allowance',
    color: '#10B981',
  },
  { namespace: 'type', value: 'premio', label: 'Prémio', labelEn: 'Bonus', color: '#10B981' },

  // Reembolsos types
  { namespace: 'type', value: 'irs', label: 'IRS', labelEn: 'Tax Refund', color: '#6366F1' },
  {
    namespace: 'type',
    value: 'seguro-saude',
    label: 'Seguro Saúde',
    labelEn: 'Health Insurance',
    color: '#6366F1',
  },
  {
    namespace: 'type',
    value: 'prestacao',
    label: 'Prestação',
    labelEn: 'Installment',
    color: '#6366F1',
  },
  { namespace: 'type', value: 'iva', label: 'IVA', labelEn: 'VAT', color: '#6366F1' },

  // Poupança types
  {
    namespace: 'type',
    value: 'emergencia',
    label: 'Emergência',
    labelEn: 'Emergency',
    color: '#F59E0B',
  },
  { namespace: 'type', value: 'pessoal', label: 'Pessoal', labelEn: 'Personal', color: '#F59E0B' },
  { namespace: 'type', value: 'filhos', label: 'Filhos', labelEn: 'Children', color: '#F59E0B' },

  // Investimento types
  { namespace: 'type', value: 'ppr', label: 'PPR', labelEn: 'Retirement Plan', color: '#8B5CF6' },
  {
    namespace: 'type',
    value: 'etf-acoes',
    label: 'ETF/Ações',
    labelEn: 'ETF/Stocks',
    color: '#8B5CF6',
  },
  { namespace: 'type', value: 'cripto', label: 'Cripto', labelEn: 'Crypto', color: '#8B5CF6' },
  {
    namespace: 'type',
    value: 'depositos',
    label: 'Depósitos',
    labelEn: 'Deposits',
    color: '#8B5CF6',
  },

  // Habitação types
  {
    namespace: 'type',
    value: 'prestacao-casa',
    label: 'Prestação',
    labelEn: 'Mortgage',
    color: '#0EA5E9',
  },
  {
    namespace: 'type',
    value: 'condominio',
    label: 'Condomínio',
    labelEn: 'Condo Fee',
    color: '#0EA5E9',
  },
  {
    namespace: 'type',
    value: 'seguros-casa',
    label: 'Seguros Casa',
    labelEn: 'Home Insurance',
    color: '#0EA5E9',
  },
  {
    namespace: 'type',
    value: 'amortizacao',
    label: 'Amortização',
    labelEn: 'Amortization',
    color: '#0EA5E9',
  },

  // Transportes types
  {
    namespace: 'type',
    value: 'combustivel',
    label: 'Combustível',
    labelEn: 'Fuel',
    color: '#EF4444',
  },
  { namespace: 'type', value: 'portagens', label: 'Portagens', labelEn: 'Tolls', color: '#EF4444' },
  {
    namespace: 'type',
    value: 'seguro-auto',
    label: 'Seguro',
    labelEn: 'Auto Insurance',
    color: '#EF4444',
  },
  { namespace: 'type', value: 'iuc', label: 'IUC', labelEn: 'Road Tax', color: '#EF4444' },
  {
    namespace: 'type',
    value: 'inspecao',
    label: 'Inspeção',
    labelEn: 'Inspection',
    color: '#EF4444',
  },
  {
    namespace: 'type',
    value: 'manutencao',
    label: 'Manutenção',
    labelEn: 'Maintenance',
    color: '#EF4444',
  },
  {
    namespace: 'type',
    value: 'estacionamento',
    label: 'Estacionamento',
    labelEn: 'Parking',
    color: '#EF4444',
  },
  {
    namespace: 'type',
    value: 'transporte-publico',
    label: 'Transporte Público',
    labelEn: 'Public Transit',
    color: '#EF4444',
  },

  // Seguros Pessoais types
  {
    namespace: 'type',
    value: 'seguro-vida',
    label: 'Seguro Vida',
    labelEn: 'Life Insurance',
    color: '#EC4899',
  },
  {
    namespace: 'type',
    value: 'seguro-saude-pessoal',
    label: 'Seguro Saúde',
    labelEn: 'Health Insurance',
    color: '#EC4899',
  },
  {
    namespace: 'type',
    value: 'seguro-animal',
    label: 'Seguro Animal',
    labelEn: 'Pet Insurance',
    color: '#EC4899',
  },

  // Subscrições types
  {
    namespace: 'type',
    value: 'telemovel',
    label: 'Telemóvel',
    labelEn: 'Mobile',
    color: '#14B8A6',
  },
  {
    namespace: 'type',
    value: 'internet',
    label: 'Internet',
    labelEn: 'Internet',
    color: '#14B8A6',
  },
  { namespace: 'type', value: 'cloud', label: 'Cloud', labelEn: 'Cloud', color: '#14B8A6' },

  // Alimentação types
  {
    namespace: 'type',
    value: 'supermercado',
    label: 'Supermercado',
    labelEn: 'Supermarket',
    color: '#22C55E',
  },
  {
    namespace: 'type',
    value: 'refeicoes-fora',
    label: 'Refeições Fora',
    labelEn: 'Dining Out',
    color: '#22C55E',
  },
  {
    namespace: 'type',
    value: 'take-away',
    label: 'Take Away',
    labelEn: 'Takeout',
    color: '#22C55E',
  },
  { namespace: 'type', value: 'padaria', label: 'Padaria', labelEn: 'Bakery', color: '#22C55E' },
  { namespace: 'type', value: 'cantina', label: 'Cantina', labelEn: 'Canteen', color: '#22C55E' },

  // Saúde types
  {
    namespace: 'type',
    value: 'consultas',
    label: 'Consultas',
    labelEn: 'Appointments',
    color: '#F43F5E',
  },
  { namespace: 'type', value: 'exames', label: 'Exames', labelEn: 'Exams', color: '#F43F5E' },
  {
    namespace: 'type',
    value: 'medicamentos',
    label: 'Medicamentos',
    labelEn: 'Medicine',
    color: '#F43F5E',
  },
  { namespace: 'type', value: 'dentista', label: 'Dentista', labelEn: 'Dentist', color: '#F43F5E' },
  { namespace: 'type', value: 'terapia', label: 'Terapia', labelEn: 'Therapy', color: '#F43F5E' },

  // Parentalidade types
  {
    namespace: 'type',
    value: 'vestuario-crianca',
    label: 'Vestuário',
    labelEn: 'Children Clothing',
    color: '#A855F7',
  },
  {
    namespace: 'type',
    value: 'saude-crianca',
    label: 'Saúde Criança',
    labelEn: 'Child Health',
    color: '#A855F7',
  },
  { namespace: 'type', value: 'creche', label: 'Creche', labelEn: 'Daycare', color: '#A855F7' },

  // Axl (pet) types
  { namespace: 'type', value: 'racao', label: 'Ração', labelEn: 'Pet Food', color: '#F97316' },
  {
    namespace: 'type',
    value: 'veterinario',
    label: 'Veterinário',
    labelEn: 'Vet',
    color: '#F97316',
  },

  // Casa types
  {
    namespace: 'type',
    value: 'manutencao-casa',
    label: 'Manutenção Casa',
    labelEn: 'Home Maintenance',
    color: '#64748B',
  },
  { namespace: 'type', value: 'obras', label: 'Obras', labelEn: 'Renovations', color: '#64748B' },

  // Lazer types
  { namespace: 'type', value: 'viagens', label: 'Viagens', labelEn: 'Travel', color: '#06B6D4' },
  {
    namespace: 'type',
    value: 'atividades',
    label: 'Atividades',
    labelEn: 'Activities',
    color: '#06B6D4',
  },
  {
    namespace: 'type',
    value: 'date-night',
    label: 'Date Night',
    labelEn: 'Date Night',
    color: '#06B6D4',
  },

  // Compras types
  {
    namespace: 'type',
    value: 'vestuario',
    label: 'Vestuário',
    labelEn: 'Clothing',
    color: '#D946EF',
  },
  { namespace: 'type', value: 'decoracao', label: 'Decoração', labelEn: 'Decor', color: '#D946EF' },
  {
    namespace: 'type',
    value: 'acessorios',
    label: 'Acessórios',
    labelEn: 'Accessories',
    color: '#D946EF',
  },

  // === VEHICLE tags ===
  { namespace: 'vehicle', value: 'carro', label: 'Carro', labelEn: 'Car', color: '#3B82F6' },
  { namespace: 'vehicle', value: 'mota', label: 'Mota', labelEn: 'Motorcycle', color: '#3B82F6' },
  {
    namespace: 'vehicle',
    value: 'autocaravana',
    label: 'Autocaravana',
    labelEn: 'Campervan',
    color: '#3B82F6',
  },

  // === TRIP tags ===
  { namespace: 'trip', value: 'croatia', label: 'Croácia', labelEn: 'Croatia', color: '#10B981' },
  { namespace: 'trip', value: 'tuscany', label: 'Toscana', labelEn: 'Tuscany', color: '#10B981' },
  { namespace: 'trip', value: 'mallorca', label: 'Maiorca', labelEn: 'Mallorca', color: '#10B981' },
  {
    namespace: 'trip',
    value: 'south-america',
    label: 'América do Sul',
    labelEn: 'South America',
    color: '#10B981',
  },
  { namespace: 'trip', value: 'algarve', label: 'Algarve', labelEn: 'Algarve', color: '#10B981' },
  {
    namespace: 'trip',
    value: 'milan-como',
    label: 'Milão/Como',
    labelEn: 'Milan/Como',
    color: '#10B981',
  },

  // === PROVIDER tags ===
  { namespace: 'provider', value: 'sgf', label: 'SGF', labelEn: 'SGF', color: '#8B5CF6' },
  { namespace: 'provider', value: 'ar', label: 'AR', labelEn: 'AR', color: '#8B5CF6' },
  {
    namespace: 'provider',
    value: 'casa-investimentos',
    label: 'Casa Inv.',
    labelEn: 'Casa Inv.',
    color: '#8B5CF6',
  },

  // === PLATFORM tags ===
  { namespace: 'platform', value: 'olx', label: 'OLX', labelEn: 'OLX', color: '#F59E0B' },
  { namespace: 'platform', value: 'vinted', label: 'Vinted', labelEn: 'Vinted', color: '#F59E0B' },

  // === OCCASION tags ===
  { namespace: 'occasion', value: 'natal', label: 'Natal', labelEn: 'Christmas', color: '#EF4444' },
  {
    namespace: 'occasion',
    value: 'aniversario',
    label: 'Aniversário',
    labelEn: 'Birthday',
    color: '#EF4444',
  },
  {
    namespace: 'occasion',
    value: 'casamento',
    label: 'Casamento',
    labelEn: 'Wedding',
    color: '#EF4444',
  },

  // === RECIPIENT tags ===
  { namespace: 'recipient', value: 'child', label: 'Child', labelEn: 'Child', color: '#EC4899' },
  { namespace: 'recipient', value: 'tomas', label: 'Tomás', labelEn: 'Tomás', color: '#EC4899' },

  // === SPORT tags ===
  { namespace: 'sport', value: 'yoga', label: 'Yoga', labelEn: 'Yoga', color: '#06B6D4' },
  { namespace: 'sport', value: 'ginasio', label: 'Ginásio', labelEn: 'Gym', color: '#06B6D4' },
  { namespace: 'sport', value: 'padel', label: 'Padel', labelEn: 'Padel', color: '#06B6D4' },
  { namespace: 'sport', value: 'golfe', label: 'Golfe', labelEn: 'Golf', color: '#06B6D4' },
  { namespace: 'sport', value: 'futebol', label: 'Futebol', labelEn: 'Football', color: '#06B6D4' },
  { namespace: 'sport', value: 'corrida', label: 'Corrida', labelEn: 'Running', color: '#06B6D4' },

  // === UTILITY tags ===
  { namespace: 'utility', value: 'agua', label: 'Água', labelEn: 'Water', color: '#0EA5E9' },
  {
    namespace: 'utility',
    value: 'eletricidade',
    label: 'Electricidade',
    labelEn: 'Electricity',
    color: '#0EA5E9',
  },
  { namespace: 'utility', value: 'gas', label: 'Gás', labelEn: 'Gas', color: '#0EA5E9' },
  {
    namespace: 'utility',
    value: 'luz-gas',
    label: 'Luz+Gás',
    labelEn: 'Elec+Gas',
    color: '#0EA5E9',
  },

  // === SERVICE tags ===
  {
    namespace: 'service',
    value: 'spotify',
    label: 'Spotify',
    labelEn: 'Spotify',
    color: '#1DB954',
  },
  { namespace: 'service', value: 'amazon', label: 'Amazon', labelEn: 'Amazon', color: '#FF9900' },
  { namespace: 'service', value: 'google', label: 'Google', labelEn: 'Google', color: '#4285F4' },
  {
    namespace: 'service',
    value: 'netflix',
    label: 'Netflix',
    labelEn: 'Netflix',
    color: '#E50914',
  },
  { namespace: 'service', value: 'disney', label: 'Disney+', labelEn: 'Disney+', color: '#113CCF' },
  { namespace: 'service', value: 'hbo', label: 'HBO Max', labelEn: 'HBO Max', color: '#5822B4' },

  // === PROJECT tags ===
  { namespace: 'project', value: 'brides', label: 'Brides', labelEn: 'Brides', color: '#A855F7' },
  { namespace: 'project', value: 'medium', label: 'Medium', labelEn: 'Medium', color: '#A855F7' },
  { namespace: 'project', value: 'y', label: 'Projecto Y', labelEn: 'Project Y', color: '#A855F7' },

  // === REIMBURSABLE tag ===
  {
    namespace: 'reimbursable',
    value: 'yes',
    label: 'Reembolsável',
    labelEn: 'Reimbursable',
    color: '#14B8A6',
  },

  // === ASSET tags ===
  {
    namespace: 'asset',
    value: 'autocaravana',
    label: 'Autocaravana',
    labelEn: 'Campervan',
    color: '#84CC16',
  },
]

async function clearTables() {
  console.log('Clearing existing tables...')

  // Clear in order (subCategory table no longer exists)
  await prisma.tagDefinition.deleteMany({})
  await prisma.category.deleteMany({ where: { userId: null } })
  await prisma.majorCategory.deleteMany({ where: { userId: null } })

  console.log('✓ Tables cleared')
}

async function seedTaxonomy() {
  console.log('\nSeeding 2-level taxonomy...\n')

  let majorCount = 0
  let categoryCount = 0

  for (const major of TAXONOMY) {
    const majorId = `mc_${major.slug}`

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
    console.log(`📁 ${major.emoji} ${major.name} (${major.nameEn})`)

    let catSortOrder = 1
    for (const cat of major.categories) {
      const catSlug = slugify(cat.name)
      const catId = `cat_${major.slug}_${catSlug}`

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
    }
    console.log('')
  }

  return { majorCount, categoryCount }
}

async function seedTags() {
  console.log('Seeding tag definitions...\n')

  let tagCount = 0
  const namespaces = new Set()

  for (const tag of TAG_DEFINITIONS) {
    await prisma.tagDefinition.create({
      data: {
        namespace: tag.namespace,
        value: tag.value,
        label: tag.label,
        labelEn: tag.labelEn,
        color: tag.color,
        sortOrder: tagCount,
      },
    })
    tagCount++
    namespaces.add(tag.namespace)
  }

  console.log(`✓ Created ${tagCount} tags across ${namespaces.size} namespaces`)
  console.log(`  Namespaces: ${Array.from(namespaces).join(', ')}`)

  return tagCount
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗')
  console.log('║  Taxonomy Seed v4 - 2-Level Structure + Tags       ║')
  console.log('║  Major Category → Category (no subcategories)      ║')
  console.log('╚════════════════════════════════════════════════════╝\n')

  try {
    await clearTables()
    const taxCounts = await seedTaxonomy()
    const tagCount = await seedTags()

    console.log('\n════════════════════════════════════════════════════')
    console.log('✅ Seeding complete!')
    console.log(`   Major Categories: ${taxCounts.majorCount}`)
    console.log(`   Categories: ${taxCounts.categoryCount}`)
    console.log(`   Tags: ${tagCount}`)
    console.log('   SubCategories: 0 (removed - use tags instead!)')
    console.log('════════════════════════════════════════════════════')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
