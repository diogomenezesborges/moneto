const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Seed database with EXACT user-specified taxonomy
 * Each subcategory is assigned to a specific major > category combination
 */

// User's exact taxonomy structure
const EXACT_TAXONOMY = [
  { major_category: 'Rendimento', category: 'Salario', subcategory: 'Salario Liq.' },
  { major_category: 'Rendimento', category: 'Salario', subcategory: 'Subs.Alimentação' },
  { major_category: 'Rendimento', category: 'Salario', subcategory: 'Mensalidade' },
  { major_category: 'Rendimento', category: 'Salario', subcategory: 'IRS' },
  { major_category: 'Rendimento', category: 'Salario', subcategory: 'Prémio' },
  { major_category: 'Rendimento', category: 'Salario', subcategory: 'Subs.Férias' },

  { major_category: 'Rendimento Extra', category: 'Vendas Usados', subcategory: 'Olx' },
  { major_category: 'Rendimento Extra', category: 'Vendas Usados', subcategory: 'Vinted' },
  { major_category: 'Rendimento Extra', category: 'Autocaravana', subcategory: 'Aluguer' },
  { major_category: 'Rendimento Extra', category: 'Prendas', subcategory: 'Monetário' },
  {
    major_category: 'Rendimento Extra',
    category: 'Outros Rendimentos',
    subcategory: 'Outros Rendimentos',
  },
  { major_category: 'Rendimento Extra', category: 'Projectos', subcategory: 'Jogo Brides' },
  { major_category: 'Rendimento Extra', category: 'Projectos', subcategory: 'Medium' },
  { major_category: 'Rendimento Extra', category: 'Projectos', subcategory: 'Projecto Y' },
  {
    major_category: 'Rendimento Extra',
    category: 'Crédito Habitação',
    subcategory: 'Empréstimo Obras',
  },
  {
    major_category: 'Rendimento Extra',
    category: 'Reembolsos',
    subcategory: 'Reemb. Seguro Saúde',
  },
  { major_category: 'Rendimento Extra', category: 'Reembolsos', subcategory: 'Reemb. Prestração' },
  { major_category: 'Rendimento Extra', category: 'Reembolsos', subcategory: 'Reemb. IVA' },

  {
    major_category: 'Economia e Investimentos',
    category: 'Poupança',
    subcategory: 'Fundo de Emergência',
  },
  {
    major_category: 'Economia e Investimentos',
    category: 'Poupança',
    subcategory: 'Emergency Buffer',
  },
  {
    major_category: 'Economia e Investimentos',
    category: 'Poupança',
    subcategory: 'Poupança Pessoal',
  },
  {
    major_category: 'Economia e Investimentos',
    category: 'Poupança',
    subcategory: 'Poupança Household',
  },
  { major_category: 'Economia e Investimentos', category: 'Investimento', subcategory: 'PPR SGF' },
  { major_category: 'Economia e Investimentos', category: 'Investimento', subcategory: 'PPR AR' },
  {
    major_category: 'Economia e Investimentos',
    category: 'Investimento',
    subcategory: 'PPR Casa Inv.',
  },
  {
    major_category: 'Economia e Investimentos',
    category: 'Investimento',
    subcategory: 'Criptomoeda',
  },
  { major_category: 'Economia e Investimentos', category: 'Investimento', subcategory: 'Arte' },
  {
    major_category: 'Economia e Investimentos',
    category: 'Investimento',
    subcategory: 'PPR Other',
  },
  { major_category: 'Economia e Investimentos', category: 'Investimento', subcategory: 'PPR' },
  { major_category: 'Economia e Investimentos', category: 'Investimento', subcategory: 'TAFI' },
  {
    major_category: 'Economia e Investimentos',
    category: 'Investimento',
    subcategory: 'Ações / ETF',
  },
  {
    major_category: 'Economia e Investimentos',
    category: 'Investimento',
    subcategory: 'Depósito a Prazo',
  },
  {
    major_category: 'Economia e Investimentos',
    category: 'Investimento',
    subcategory: 'Fundo de Emergência',
  },

  {
    major_category: 'Custos Variaveis',
    category: 'Parentalidade',
    subcategory: 'Enxoval Maternidade',
  },
  {
    major_category: 'Custos Variaveis',
    category: 'Parentalidade',
    subcategory: 'Vestuário Criança',
  },
  {
    major_category: 'Custos Variaveis',
    category: 'Parentalidade',
    subcategory: 'Cuidados Criança',
  },
  {
    major_category: 'Custos Variaveis',
    category: 'Parentalidade',
    subcategory: 'Consulta Pediatria',
  },
  {
    major_category: 'Custos Variaveis',
    category: 'Parentalidade',
    subcategory: 'Exames Pediatria',
  },
  { major_category: 'Custos Variaveis', category: 'Parentalidade', subcategory: 'Fisioterapia' },
  { major_category: 'Custos Variaveis', category: 'Parentalidade', subcategory: 'Drenagem' },
  {
    major_category: 'Custos Variaveis',
    category: 'Parentalidade',
    subcategory: 'Medicamentos Pediatria',
  },
  { major_category: 'Custos Variaveis', category: 'Parentalidade', subcategory: 'BebéVida' },
  { major_category: 'Custos Variaveis', category: 'Parentalidade', subcategory: 'Outros Criança' },

  { major_category: 'Custos Fixos', category: 'Cuidados Pessoais', subcategory: 'Cabeleireiro' },
  {
    major_category: 'Custos Variaveis',
    category: 'Cuidados Pessoais',
    subcategory: 'Lentes de Contacto/oculos',
  },
  {
    major_category: 'Custos Variaveis',
    category: 'Cuidados Pessoais',
    subcategory: 'Cuidados de beleza',
  },

  { major_category: 'Custos Variaveis', category: 'Saúde', subcategory: 'Consultas Adulto' },
  { major_category: 'Custos Variaveis', category: 'Saúde', subcategory: 'Internamento Adulto' },
  { major_category: 'Custos Variaveis', category: 'Saúde', subcategory: 'Exames Adulto' },
  { major_category: 'Custos Variaveis', category: 'Saúde', subcategory: 'Dentista Adulto' },
  { major_category: 'Custos Variaveis', category: 'Saúde', subcategory: 'Medicamentos Adulto' },

  { major_category: 'Custos Variaveis', category: 'Desporto', subcategory: 'Yoga' },
  { major_category: 'Custos Variaveis', category: 'Desporto', subcategory: 'Ginásio' },
  { major_category: 'Custos Variaveis', category: 'Desporto', subcategory: 'Golfe' },
  { major_category: 'Custos Variaveis', category: 'Desporto', subcategory: 'Padel' },
  { major_category: 'Custos Variaveis', category: 'Desporto', subcategory: 'Futebol' },
  { major_category: 'Custos Variaveis', category: 'Desporto', subcategory: 'Corrida' },
  { major_category: 'Custos Variaveis', category: 'Desporto', subcategory: 'App Fitness' },

  {
    major_category: 'Custos Variaveis',
    category: 'Desenvolvimento Pessoal',
    subcategory: 'Terapia',
  },
  {
    major_category: 'Custos Variaveis',
    category: 'Desenvolvimento Pessoal',
    subcategory: 'Coaching',
  },

  { major_category: 'Custos Fixos', category: 'Subscrições', subcategory: 'Telemóvel' },
  { major_category: 'Custos Fixos', category: 'Subscrições', subcategory: 'Spotify' },
  { major_category: 'Custos Fixos', category: 'Subscrições', subcategory: 'Google One' },
  { major_category: 'Custos Fixos', category: 'Subscrições', subcategory: 'Amazon' },
  {
    major_category: 'Custos Variaveis',
    category: 'Subscrições',
    subcategory: 'Outras Subscrições',
  },

  { major_category: 'Custos Fixos', category: 'Alimentação', subcategory: 'Supermercado' },
  {
    major_category: 'Custos Variaveis',
    category: 'Alimentação',
    subcategory: 'Padaria / Pastelaria',
  },
  { major_category: 'Custos Variaveis', category: 'Alimentação', subcategory: 'Take Away' },
  {
    major_category: 'Custos Variaveis',
    category: 'Alimentação',
    subcategory: 'Cantina / Trabalho',
  },
  {
    major_category: 'Custos Variaveis',
    category: 'Alimentação',
    subcategory: 'Refeições fora de casa',
  },

  {
    major_category: 'Custos Variaveis',
    category: 'Transportes',
    subcategory: 'Autocaravana Via Verde',
  },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Carro Via Verde' },
  { major_category: 'Custos Variaveis', category: 'Transportes', subcategory: 'Estacionamento' },
  {
    major_category: 'Custos Variaveis',
    category: 'Transportes',
    subcategory: 'Autocaravana Manutenção',
  },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Mota Combustivel' },
  {
    major_category: 'Custos Variaveis',
    category: 'Transportes',
    subcategory: 'Autocaravana Combustivel',
  },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Carro Combustivel' },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Autocaravana IUC' },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Carro IUC' },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Autocaravana Inspeção' },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Carro Inspeção' },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Mota Seguro' },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Carro Seguro' },
  { major_category: 'Custos Variaveis', category: 'Transportes', subcategory: 'Carro Manutenção' },
  { major_category: 'Custos Fixos', category: 'Transportes', subcategory: 'Autocaravana Seguro' },
  { major_category: 'Custos Variaveis', category: 'Transportes', subcategory: 'Carros Outros' },
  {
    major_category: 'Custos Variaveis',
    category: 'Transportes',
    subcategory: 'Transporte Público',
  },

  { major_category: 'Gastos sem culpa', category: 'Prendas', subcategory: 'Prendas Aniversário' },
  { major_category: 'Gastos sem culpa', category: 'Prendas', subcategory: 'Prendas Casamento' },
  { major_category: 'Gastos sem culpa', category: 'Prendas', subcategory: 'Prendas Natal' },
  { major_category: 'Gastos sem culpa', category: 'Prendas', subcategory: 'Prenda Tomas' },
  { major_category: 'Gastos sem culpa', category: 'Prendas', subcategory: 'Prendas Family' },
  { major_category: 'Gastos sem culpa', category: 'Prendas', subcategory: 'Prendas Outros' },

  {
    major_category: 'Gastos sem culpa',
    category: 'Compras Gerais',
    subcategory: 'Compras Gerais Outros',
  },
  { major_category: 'Gastos sem culpa', category: 'Compras Gerais', subcategory: 'Acessórios' },
  {
    major_category: 'Gastos sem culpa',
    category: 'Compras Gerais',
    subcategory: 'Coisas para casa',
  },
  { major_category: 'Gastos sem culpa', category: 'Compras Gerais', subcategory: 'Vestuário' },

  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Viagem Croácia' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Milão e Lago de Como' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Toscana' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Algarve 25' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Perú, Bolivia e Chile' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Palma Maiorca' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Férias' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Atividades Lúdicas' },
  { major_category: 'Gastos sem culpa', category: 'Lazer', subcategory: 'Date Night' },

  { major_category: 'Custos Variaveis', category: 'Educação', subcategory: 'Formação' },
  { major_category: 'Custos Variaveis', category: 'Educação', subcategory: 'Cultura' },
  { major_category: 'Custos Variaveis', category: 'Educação', subcategory: 'Livros' },

  {
    major_category: 'Custos Variaveis',
    category: 'Solidariedade',
    subcategory: 'Seguro voluntariado',
  },
  { major_category: 'Custos Variaveis', category: 'Solidariedade', subcategory: 'Donativo' },

  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Prestração' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Ass.Mutualista' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Sol.+Consigo' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Seg.Multiriscos' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Seg.Vida' },
  { major_category: 'Custos Variaveis', category: 'Casa', subcategory: 'Amortização' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Condominio' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Água' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Electricidade' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Gás' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Luz + Gás' },
  { major_category: 'Custos Variaveis', category: 'Casa', subcategory: 'Casa Manutenção' },
  { major_category: 'Gastos sem culpa', category: 'Casa', subcategory: 'Casa Decoração' },
  { major_category: 'Custos Variaveis', category: 'Casa', subcategory: 'Casa Obras' },
  { major_category: 'Custos Variaveis', category: 'Casa', subcategory: 'Casa Outros' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Internet Móvel' },
  { major_category: 'Custos Fixos', category: 'Casa', subcategory: 'Internet' },

  { major_category: 'Custos Fixos', category: 'Axl', subcategory: 'Medicamentos Axl' },
  { major_category: 'Custos Variaveis', category: 'Axl', subcategory: 'Creche Axl' },
  { major_category: 'Custos Variaveis', category: 'Axl', subcategory: 'Veterinário' },
  { major_category: 'Custos Fixos', category: 'Axl', subcategory: 'Seguro Axl' },
  { major_category: 'Custos Variaveis', category: 'Axl', subcategory: 'Axl Outros' },
  { major_category: 'Custos Fixos', category: 'Axl', subcategory: 'Ração' },

  { major_category: 'Custos Fixos', category: 'Conta Conjunta', subcategory: 'Mensalidade' },
  { major_category: 'Custos Variaveis', category: 'Multa', subcategory: 'Multa' },
  { major_category: 'Custos Variaveis', category: 'Comissões', subcategory: 'Millenium' },
  { major_category: 'Custos Variaveis', category: 'Comissões', subcategory: 'MbWay' },
  { major_category: 'Custos Variaveis', category: 'Desconhecido', subcategory: 'Desconhecido' },
  {
    major_category: 'Custos Variaveis',
    category: 'Trabalho',
    subcategory: 'Despesas a reembolsar',
  },
  { major_category: 'Custos Variaveis', category: 'Trabalho', subcategory: 'Cowork' },
  { major_category: 'Custos Variaveis', category: 'Lazer', subcategory: 'Projectos Pessoais' },
  { major_category: 'Custos Variaveis', category: 'Levantamento', subcategory: 'Levantamento' },
]

// Major category metadata
const MAJOR_CATEGORIES_META = {
  Rendimento: { id: 'mc_income', slug: 'rendimento', emoji: '💰' },
  'Rendimento Extra': { id: 'mc_income_extra', slug: 'rendimento_extra', emoji: '💸' },
  'Economia e Investimentos': {
    id: 'mc_savings_invest',
    slug: 'economia_investimentos',
    emoji: '📈',
  },
  'Custos Fixos': { id: 'mc_fixed_costs', slug: 'custos_fixos', emoji: '🏠' },
  'Custos Variaveis': { id: 'mc_variable_costs', slug: 'custos_variaveis', emoji: '📊' },
  'Gastos sem culpa': { id: 'mc_guilt_free', slug: 'gastos_sem_culpa', emoji: '🎉' },
}

function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function seed() {
  console.log('🌱 Seeding EXACT user-specified taxonomy...\n')

  // First, delete ALL existing categories and subcategories
  console.log('🗑️  Clearing existing data...')
  await prisma.subCategory.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.majorCategory.deleteMany({})
  console.log('✓ Cleared\n')

  // Create major categories
  const majorCategoriesCreated = new Set()
  for (const meta of Object.values(MAJOR_CATEGORIES_META)) {
    await prisma.majorCategory.create({
      data: {
        id: meta.id,
        slug: meta.slug,
        name: Object.keys(MAJOR_CATEGORIES_META).find(k => MAJOR_CATEGORIES_META[k].id === meta.id),
        emoji: meta.emoji,
        userId: null,
      },
    })
    majorCategoriesCreated.add(meta.id)
  }
  console.log(`✓ Created ${majorCategoriesCreated.size} major categories\n`)

  // Group by major > category > subcategories
  const grouped = {}
  EXACT_TAXONOMY.forEach(item => {
    const majorMeta = MAJOR_CATEGORIES_META[item.major_category]
    const key = `${majorMeta.id}::${item.category}`
    if (!grouped[key]) {
      grouped[key] = {
        majorId: majorMeta.id,
        majorSlug: majorMeta.slug,
        majorName: item.major_category,
        category: item.category,
        subcategories: [],
      }
    }
    grouped[key].subcategories.push(item.subcategory)
  })

  // Create categories and subcategories
  let catCount = 0
  let subCount = 0

  for (const group of Object.values(grouped)) {
    const categorySlug = createSlug(group.category)
    const categoryId = `cat_${group.majorSlug}_${categorySlug}`

    console.log(`${group.majorName} > ${group.category}`)

    // Create category
    await prisma.category.create({
      data: {
        id: categoryId,
        majorCategoryId: group.majorId,
        slug: categorySlug,
        name: group.category,
        userId: null,
      },
    })
    catCount++

    // Create subcategories
    for (const subName of group.subcategories) {
      const subSlug = createSlug(subName)
      const subId = `sub_${subSlug}`

      await prisma.subCategory.upsert({
        where: { id: subId },
        update: {
          categoryId: categoryId,
          name: subName,
          slug: subSlug,
        },
        create: {
          id: subId,
          categoryId: categoryId,
          slug: subSlug,
          name: subName,
          userId: null,
        },
      })
      subCount++
      console.log(`  - ${subName}`)
    }
    console.log('')
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Major Categories: ${majorCategoriesCreated.size}`)
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
