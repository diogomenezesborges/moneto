const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Seed Taxonomy v2 - Bilingual Category System
 *
 * Updates existing categories with:
 * - English names (nameEn)
 * - Budget categories (50/30/20 rule)
 * - Icons (Lucide icon names)
 * - Sort order for consistent display
 *
 * Uses upsert for safe re-runs
 */

// Major Categories with bilingual names and budget categories
const MAJOR_CATEGORIES_V2 = [
  {
    id: 'mc_income',
    slug: 'rendimento',
    name: 'Rendimento',
    nameEn: 'Income',
    emoji: '💰',
    budgetCategory: null, // Income isn't part of 50/30/20 expense budget
    sortOrder: 1,
  },
  {
    id: 'mc_income_extra',
    slug: 'rendimento_extra',
    name: 'Rendimento Extra',
    nameEn: 'Side Income',
    emoji: '💸',
    budgetCategory: null,
    sortOrder: 2,
  },
  {
    id: 'mc_savings_invest',
    slug: 'economia_investimentos',
    name: 'Economia e Investimentos',
    nameEn: 'Savings & Investments',
    emoji: '📈',
    budgetCategory: '20_savings',
    sortOrder: 3,
  },
  {
    id: 'mc_fixed_costs',
    slug: 'custos_fixos',
    name: 'Custos Fixos',
    nameEn: 'Fixed Expenses',
    emoji: '🏠',
    budgetCategory: '50_needs',
    sortOrder: 4,
  },
  {
    id: 'mc_variable_costs',
    slug: 'custos_variaveis',
    name: 'Custos Variáveis',
    nameEn: 'Essential Expenses',
    emoji: '📊',
    budgetCategory: '50_needs',
    sortOrder: 5,
  },
  {
    id: 'mc_guilt_free',
    slug: 'gastos_sem_culpa',
    name: 'Gastos sem Culpa',
    nameEn: 'Guilt-Free Spending',
    emoji: '🎉',
    budgetCategory: '30_wants',
    sortOrder: 6,
  },
]

// Complete taxonomy v2 with bilingual support
// Format: { major, category, nameEn, icon, subcategories: [{name, nameEn, icon}] }
const TAXONOMY_V2 = [
  // ========== RENDIMENTO (INCOME) ==========
  {
    majorId: 'mc_income',
    category: 'Salário',
    categoryEn: 'Salary',
    icon: 'wallet',
    sortOrder: 1,
    subcategories: [
      { name: 'Salário Líq.', nameEn: 'Net Salary', icon: 'banknote' },
      { name: 'Subs. Alimentação', nameEn: 'Meal Allowance', icon: 'utensils' },
      { name: 'Mensalidade', nameEn: 'Monthly Payment', icon: 'calendar' },
      { name: 'IRS', nameEn: 'Tax Refund', icon: 'receipt' },
      { name: 'Prémio', nameEn: 'Bonus', icon: 'gift' },
      { name: 'Subs. Férias', nameEn: 'Holiday Allowance', icon: 'palmtree' },
    ],
  },
  {
    majorId: 'mc_income',
    category: 'Reembolsos',
    categoryEn: 'Reimbursements',
    icon: 'undo-2',
    sortOrder: 2,
    subcategories: [
      { name: 'Reemb. Seguro Saúde', nameEn: 'Health Insurance Reimb.', icon: 'heart' },
      { name: 'Reemb. Prestação', nameEn: 'Loan Reimb.', icon: 'landmark' },
      { name: 'Reemb. IVA', nameEn: 'VAT Refund', icon: 'receipt' },
      { name: 'Reemb. Trabalho', nameEn: 'Work Reimb.', icon: 'briefcase' },
    ],
  },

  // ========== RENDIMENTO EXTRA (SIDE INCOME) ==========
  {
    majorId: 'mc_income_extra',
    category: 'Vendas Usados',
    categoryEn: 'Used Sales',
    icon: 'shopping-bag',
    sortOrder: 1,
    subcategories: [
      { name: 'Olx', nameEn: 'OLX', icon: 'tag' },
      { name: 'Vinted', nameEn: 'Vinted', icon: 'shirt' },
    ],
  },
  {
    majorId: 'mc_income_extra',
    category: 'Autocaravana',
    categoryEn: 'Campervan',
    icon: 'caravan',
    sortOrder: 2,
    subcategories: [{ name: 'Aluguer', nameEn: 'Rental', icon: 'key' }],
  },
  {
    majorId: 'mc_income_extra',
    category: 'Prendas Recebidas',
    categoryEn: 'Received Gifts',
    icon: 'gift',
    sortOrder: 3,
    subcategories: [{ name: 'Monetário', nameEn: 'Monetary', icon: 'banknote' }],
  },
  {
    majorId: 'mc_income_extra',
    category: 'Outros Rendimentos',
    categoryEn: 'Other Income',
    icon: 'plus-circle',
    sortOrder: 4,
    subcategories: [{ name: 'Outros Rendimentos', nameEn: 'Other Income', icon: 'plus' }],
  },
  {
    majorId: 'mc_income_extra',
    category: 'Projectos',
    categoryEn: 'Projects',
    icon: 'folder-kanban',
    sortOrder: 5,
    subcategories: [
      { name: 'Jogo Brides', nameEn: 'Brides Game', icon: 'gamepad-2' },
      { name: 'Medium', nameEn: 'Medium', icon: 'pen-tool' },
      { name: 'Projecto Y', nameEn: 'Project Y', icon: 'folder' },
    ],
  },
  {
    majorId: 'mc_income_extra',
    category: 'Crédito Habitação',
    categoryEn: 'Mortgage Credit',
    icon: 'landmark',
    sortOrder: 6,
    subcategories: [{ name: 'Empréstimo Obras', nameEn: 'Renovation Loan', icon: 'hammer' }],
  },

  // ========== ECONOMIA E INVESTIMENTOS (SAVINGS & INVESTMENTS) ==========
  {
    majorId: 'mc_savings_invest',
    category: 'Poupança',
    categoryEn: 'Savings',
    icon: 'piggy-bank',
    sortOrder: 1,
    subcategories: [
      { name: 'Fundo de Emergência', nameEn: 'Emergency Fund', icon: 'shield' },
      { name: 'Emergency Buffer', nameEn: 'Emergency Buffer', icon: 'alert-triangle' },
      { name: 'Poupança Pessoal', nameEn: 'Personal Savings', icon: 'wallet' },
      { name: 'Poupança Household', nameEn: 'Household Savings', icon: 'heart' },
    ],
  },
  {
    majorId: 'mc_savings_invest',
    category: 'Investimento',
    categoryEn: 'Investments',
    icon: 'trending-up',
    sortOrder: 2,
    subcategories: [
      { name: 'PPR SGF', nameEn: 'PPR SGF', icon: 'chart-line' },
      { name: 'PPR AR', nameEn: 'PPR AR', icon: 'chart-line' },
      { name: 'PPR Casa Inv.', nameEn: 'PPR Casa Inv.', icon: 'chart-line' },
      { name: 'PPR Other', nameEn: 'PPR Other', icon: 'chart-line' },
      { name: 'PPR', nameEn: 'PPR', icon: 'chart-line' },
      { name: 'Criptomoeda', nameEn: 'Cryptocurrency', icon: 'bitcoin' },
      { name: 'Arte', nameEn: 'Art', icon: 'palette' },
      { name: 'TAFI', nameEn: 'TAFI', icon: 'briefcase' },
      { name: 'Ações / ETF', nameEn: 'Stocks / ETF', icon: 'bar-chart-2' },
      { name: 'Depósito a Prazo', nameEn: 'Term Deposit', icon: 'landmark' },
    ],
  },

  // ========== CUSTOS FIXOS (FIXED EXPENSES) ==========
  {
    majorId: 'mc_fixed_costs',
    category: 'Casa',
    categoryEn: 'Housing',
    icon: 'home',
    sortOrder: 1,
    subcategories: [
      { name: 'Prestação', nameEn: 'Mortgage', icon: 'landmark' },
      { name: 'Ass. Mutualista', nameEn: 'Mutual Association', icon: 'users' },
      { name: 'Sol.+Consigo', nameEn: 'Solidarity+Together', icon: 'heart-handshake' },
      { name: 'Seg. Multiriscos', nameEn: 'Home Insurance', icon: 'shield' },
      { name: 'Seg. Vida', nameEn: 'Life Insurance', icon: 'heart' },
      { name: 'Condomínio', nameEn: 'Condo Fees', icon: 'building' },
      { name: 'Água', nameEn: 'Water', icon: 'droplet' },
      { name: 'Electricidade', nameEn: 'Electricity', icon: 'zap' },
      { name: 'Gás', nameEn: 'Gas', icon: 'flame' },
      { name: 'Luz + Gás', nameEn: 'Electricity + Gas', icon: 'lightbulb' },
      { name: 'Internet', nameEn: 'Internet', icon: 'wifi' },
      { name: 'Internet Móvel', nameEn: 'Mobile Internet', icon: 'smartphone' },
    ],
  },
  {
    majorId: 'mc_fixed_costs',
    category: 'Transportes',
    categoryEn: 'Transportation',
    icon: 'car',
    sortOrder: 2,
    subcategories: [
      { name: 'Carro Via Verde', nameEn: 'Car Tolls', icon: 'road' },
      { name: 'Carro Combustível', nameEn: 'Car Fuel', icon: 'fuel' },
      { name: 'Mota Combustível', nameEn: 'Motorcycle Fuel', icon: 'fuel' },
      { name: 'Carro IUC', nameEn: 'Car Road Tax', icon: 'receipt' },
      { name: 'Autocaravana IUC', nameEn: 'Campervan Road Tax', icon: 'receipt' },
      { name: 'Carro Inspeção', nameEn: 'Car Inspection', icon: 'clipboard-check' },
      { name: 'Autocaravana Inspeção', nameEn: 'Campervan Inspection', icon: 'clipboard-check' },
      { name: 'Carro Seguro', nameEn: 'Car Insurance', icon: 'shield' },
      { name: 'Mota Seguro', nameEn: 'Motorcycle Insurance', icon: 'shield' },
      { name: 'Autocaravana Seguro', nameEn: 'Campervan Insurance', icon: 'shield' },
    ],
  },
  {
    majorId: 'mc_fixed_costs',
    category: 'Subscrições Essenciais',
    categoryEn: 'Essential Subscriptions',
    icon: 'repeat',
    sortOrder: 3,
    subcategories: [
      { name: 'Telemóvel', nameEn: 'Mobile Phone', icon: 'smartphone' },
      { name: 'Google One', nameEn: 'Google One', icon: 'cloud' },
    ],
  },
  {
    majorId: 'mc_fixed_costs',
    category: 'Cuidados Pessoais',
    categoryEn: 'Personal Care',
    icon: 'smile',
    sortOrder: 4,
    subcategories: [{ name: 'Cabeleireiro', nameEn: 'Hairdresser', icon: 'scissors' }],
  },
  {
    majorId: 'mc_fixed_costs',
    category: 'Axl',
    categoryEn: 'Axl (Pet)',
    icon: 'dog',
    sortOrder: 5,
    subcategories: [
      { name: 'Ração', nameEn: 'Pet Food', icon: 'bone' },
      { name: 'Seguro Axl', nameEn: 'Pet Insurance', icon: 'shield' },
      { name: 'Medicamentos Axl', nameEn: 'Pet Medicine', icon: 'pill' },
    ],
  },
  {
    majorId: 'mc_fixed_costs',
    category: 'Conta Conjunta',
    categoryEn: 'Joint Account',
    icon: 'users',
    sortOrder: 6,
    subcategories: [{ name: 'Mensalidade', nameEn: 'Monthly Transfer', icon: 'heart' }],
  },

  // ========== CUSTOS VARIÁVEIS (ESSENTIAL EXPENSES) ==========
  {
    majorId: 'mc_variable_costs',
    category: 'Alimentação',
    categoryEn: 'Food',
    icon: 'utensils',
    sortOrder: 1,
    subcategories: [
      { name: 'Supermercado', nameEn: 'Supermarket', icon: 'shopping-cart' },
      { name: 'Padaria / Pastelaria', nameEn: 'Bakery / Pastry', icon: 'croissant' },
      { name: 'Take Away', nameEn: 'Take Away', icon: 'package' },
      { name: 'Cantina / Trabalho', nameEn: 'Canteen / Work', icon: 'building-2' },
      { name: 'Refeições Fora', nameEn: 'Dining Out', icon: 'chef-hat' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Saúde',
    categoryEn: 'Health',
    icon: 'heart-pulse',
    sortOrder: 2,
    subcategories: [
      { name: 'Consultas Adulto', nameEn: 'Adult Consultations', icon: 'stethoscope' },
      { name: 'Internamento Adulto', nameEn: 'Adult Hospitalization', icon: 'bed' },
      { name: 'Exames Adulto', nameEn: 'Adult Exams', icon: 'microscope' },
      { name: 'Dentista Adulto', nameEn: 'Dentist', icon: 'smile' },
      { name: 'Medicamentos Adulto', nameEn: 'Adult Medicine', icon: 'pill' },
      { name: 'Lentes/Óculos', nameEn: 'Lenses/Glasses', icon: 'glasses' },
      { name: 'Desporto', nameEn: 'Sports', icon: 'dumbbell' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Parentalidade',
    categoryEn: 'Parenting',
    icon: 'baby',
    sortOrder: 3,
    subcategories: [
      { name: 'Enxoval Maternidade', nameEn: 'Baby Essentials', icon: 'shirt' },
      { name: 'Vestuário Criança', nameEn: 'Kids Clothing', icon: 'shirt' },
      { name: 'Cuidados Criança', nameEn: 'Childcare', icon: 'heart' },
      { name: 'Consulta Pediatria', nameEn: 'Pediatric Consultation', icon: 'stethoscope' },
      { name: 'Exames Pediatria', nameEn: 'Pediatric Exams', icon: 'microscope' },
      { name: 'Fisioterapia', nameEn: 'Physiotherapy', icon: 'activity' },
      { name: 'Drenagem', nameEn: 'Drainage', icon: 'droplet' },
      { name: 'Medicamentos Pediatria', nameEn: 'Pediatric Medicine', icon: 'pill' },
      { name: 'BebéVida', nameEn: 'BabyLife', icon: 'baby' },
      { name: 'Outros Criança', nameEn: 'Other Kids', icon: 'package' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Transportes',
    categoryEn: 'Transportation',
    icon: 'car',
    sortOrder: 4,
    subcategories: [
      { name: 'Carro Manutenção', nameEn: 'Car Maintenance', icon: 'wrench' },
      { name: 'Autocaravana Manutenção', nameEn: 'Campervan Maintenance', icon: 'wrench' },
      { name: 'Autocaravana Combustível', nameEn: 'Campervan Fuel', icon: 'fuel' },
      { name: 'Autocaravana Via Verde', nameEn: 'Campervan Tolls', icon: 'road' },
      { name: 'Estacionamento', nameEn: 'Parking', icon: 'parking-circle' },
      { name: 'Carros Outros', nameEn: 'Other Vehicle', icon: 'car' },
      { name: 'Transporte Público', nameEn: 'Public Transport', icon: 'bus' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Cuidados Pessoais',
    categoryEn: 'Personal Care',
    icon: 'sparkles',
    sortOrder: 5,
    subcategories: [{ name: 'Cuidados de Beleza', nameEn: 'Beauty Care', icon: 'sparkles' }],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Casa',
    categoryEn: 'Housing',
    icon: 'home',
    sortOrder: 6,
    subcategories: [
      { name: 'Amortização', nameEn: 'Extra Mortgage Payment', icon: 'landmark' },
      { name: 'Casa Manutenção', nameEn: 'Home Maintenance', icon: 'wrench' },
      { name: 'Casa Obras', nameEn: 'Home Renovation', icon: 'hammer' },
      { name: 'Casa Outros', nameEn: 'Home Other', icon: 'home' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Desenvolvimento Pessoal',
    categoryEn: 'Personal Development',
    icon: 'brain',
    sortOrder: 7,
    subcategories: [
      { name: 'Terapia', nameEn: 'Therapy', icon: 'heart' },
      { name: 'Coaching', nameEn: 'Coaching', icon: 'target' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Educação',
    categoryEn: 'Education',
    icon: 'graduation-cap',
    sortOrder: 8,
    subcategories: [
      { name: 'Formação', nameEn: 'Training', icon: 'book-open' },
      { name: 'Cultura', nameEn: 'Culture', icon: 'landmark' },
      { name: 'Livros', nameEn: 'Books', icon: 'book' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Solidariedade',
    categoryEn: 'Charity',
    icon: 'heart-handshake',
    sortOrder: 9,
    subcategories: [
      { name: 'Seguro Voluntariado', nameEn: 'Volunteer Insurance', icon: 'shield' },
      { name: 'Donativo', nameEn: 'Donation', icon: 'gift' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Axl',
    categoryEn: 'Axl (Pet)',
    icon: 'dog',
    sortOrder: 10,
    subcategories: [
      { name: 'Creche Axl', nameEn: 'Pet Daycare', icon: 'building' },
      { name: 'Veterinário', nameEn: 'Vet', icon: 'stethoscope' },
      { name: 'Axl Outros', nameEn: 'Pet Other', icon: 'paw-print' },
    ],
  },
  {
    majorId: 'mc_variable_costs',
    category: 'Trabalho',
    categoryEn: 'Work',
    icon: 'briefcase',
    sortOrder: 11,
    subcategories: [
      { name: 'Despesas a Reembolsar', nameEn: 'Reimbursable Expenses', icon: 'receipt' },
      { name: 'Cowork', nameEn: 'Coworking', icon: 'building-2' },
    ],
  },

  // ========== GASTOS SEM CULPA (GUILT-FREE SPENDING) ==========
  {
    majorId: 'mc_guilt_free',
    category: 'Lazer',
    categoryEn: 'Leisure',
    icon: 'party-popper',
    sortOrder: 1,
    subcategories: [
      { name: 'Viagens', nameEn: 'Travel', icon: 'plane' },
      { name: 'Férias', nameEn: 'Holidays', icon: 'umbrella' },
      { name: 'Atividades Lúdicas', nameEn: 'Fun Activities', icon: 'gamepad-2' },
      { name: 'Date Night', nameEn: 'Date Night', icon: 'heart' },
      { name: 'Projectos Pessoais', nameEn: 'Personal Projects', icon: 'folder' },
    ],
  },
  {
    majorId: 'mc_guilt_free',
    category: 'Subscrições Lazer',
    categoryEn: 'Entertainment Subscriptions',
    icon: 'tv',
    sortOrder: 2,
    subcategories: [
      { name: 'Spotify', nameEn: 'Spotify', icon: 'music' },
      { name: 'Amazon', nameEn: 'Amazon Prime', icon: 'package' },
      { name: 'Netflix', nameEn: 'Netflix', icon: 'tv' },
      { name: 'Outras Subscrições', nameEn: 'Other Subscriptions', icon: 'repeat' },
    ],
  },
  {
    majorId: 'mc_guilt_free',
    category: 'Prendas',
    categoryEn: 'Gifts',
    icon: 'gift',
    sortOrder: 3,
    subcategories: [
      { name: 'Prendas Aniversário', nameEn: 'Birthday Gifts', icon: 'cake' },
      { name: 'Prendas Casamento', nameEn: 'Wedding Gifts', icon: 'heart' },
      { name: 'Prendas Natal', nameEn: 'Christmas Gifts', icon: 'gift' },
      { name: 'Prenda Tomás', nameEn: 'Gift for Tomás', icon: 'gift' },
      { name: 'Prendas Family', nameEn: 'Gifts for Family', icon: 'gift' },
      { name: 'Prendas Outros', nameEn: 'Other Gifts', icon: 'gift' },
    ],
  },
  {
    majorId: 'mc_guilt_free',
    category: 'Compras Gerais',
    categoryEn: 'General Shopping',
    icon: 'shopping-bag',
    sortOrder: 4,
    subcategories: [
      { name: 'Vestuário', nameEn: 'Clothing', icon: 'shirt' },
      { name: 'Acessórios', nameEn: 'Accessories', icon: 'watch' },
      { name: 'Coisas para Casa', nameEn: 'Home Items', icon: 'sofa' },
      { name: 'Compras Gerais Outros', nameEn: 'Other Shopping', icon: 'shopping-bag' },
    ],
  },
  {
    majorId: 'mc_guilt_free',
    category: 'Casa',
    categoryEn: 'Home',
    icon: 'home',
    sortOrder: 5,
    subcategories: [{ name: 'Casa Decoração', nameEn: 'Home Decor', icon: 'lamp' }],
  },
]

function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function seed() {
  console.log('🌱 Seeding Taxonomy v2 with bilingual support...\n')

  // Upsert Major Categories
  console.log('📁 Upserting Major Categories...')
  for (const mc of MAJOR_CATEGORIES_V2) {
    await prisma.majorCategory.upsert({
      where: { id: mc.id },
      update: {
        name: mc.name,
        nameEn: mc.nameEn,
        emoji: mc.emoji,
        budgetCategory: mc.budgetCategory,
        sortOrder: mc.sortOrder,
      },
      create: {
        id: mc.id,
        slug: mc.slug,
        name: mc.name,
        nameEn: mc.nameEn,
        emoji: mc.emoji,
        budgetCategory: mc.budgetCategory,
        sortOrder: mc.sortOrder,
        userId: null,
      },
    })
    console.log(`   ✓ ${mc.name} / ${mc.nameEn}`)
  }

  // Upsert Categories and SubCategories
  console.log('\n📂 Upserting Categories and SubCategories...')

  let catCount = 0
  let subCount = 0

  for (const cat of TAXONOMY_V2) {
    const majorSlug = MAJOR_CATEGORIES_V2.find(m => m.id === cat.majorId)?.slug || ''
    const categorySlug = createSlug(cat.category)
    const categoryId = `cat_${majorSlug}_${categorySlug}`

    // Upsert category
    await prisma.category.upsert({
      where: { id: categoryId },
      update: {
        name: cat.category,
        nameEn: cat.categoryEn,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: {
        id: categoryId,
        majorCategoryId: cat.majorId,
        slug: categorySlug,
        name: cat.category,
        nameEn: cat.categoryEn,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        userId: null,
      },
    })
    catCount++

    console.log(`   ${cat.category} (${cat.categoryEn})`)

    // Upsert subcategories
    for (let i = 0; i < cat.subcategories.length; i++) {
      const sub = cat.subcategories[i]
      const subSlug = createSlug(sub.name)
      const subId = `sub_${categorySlug}_${subSlug}`

      await prisma.subCategory.upsert({
        where: { id: subId },
        update: {
          name: sub.name,
          nameEn: sub.nameEn,
          icon: sub.icon,
          sortOrder: i + 1,
          categoryId: categoryId,
        },
        create: {
          id: subId,
          categoryId: categoryId,
          slug: subSlug,
          name: sub.name,
          nameEn: sub.nameEn,
          icon: sub.icon,
          sortOrder: i + 1,
          userId: null,
        },
      })
      subCount++
    }
  }

  console.log(`\n✅ Taxonomy v2 seeding complete!`)
  console.log(`   Major Categories: ${MAJOR_CATEGORIES_V2.length}`)
  console.log(`   Categories: ${catCount}`)
  console.log(`   SubCategories: ${subCount}`)
}

seed()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
