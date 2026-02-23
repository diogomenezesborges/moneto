/**
 * Seed the database with the complete category taxonomy
 * Generates stable IDs for all 3 tiers
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Import from lib/categories.ts (converted to JS)
// Use a hierarchical structure to support duplicate category names across different majors
const TAXONOMY = {
  mc_income: {
    name: 'Rendimento',
    slug: 'rendimento',
    emoji: '💰',
    categories: {
      Salario: ['Salario Liq.', 'Subs.Alimentação', 'Mensalidade', 'IRS', 'Prémio', 'Subs.Férias'],
    },
  },
  mc_income_extra: {
    name: 'Rendimento Extra',
    slug: 'rendimento_extra',
    emoji: '💸',
    categories: {
      'Vendas Usados': ['Olx', 'Vinted'],
      Autocaravana: ['Aluguer'],
      Prendas: ['Monetário'],
      'Outros Rendimentos': ['Outros Rendimentos'],
      Projectos: ['Jogo Brides', 'Medium', 'Projecto Y'],
      'Crédito Habitação': ['Empréstimo Obras'],
      Reembolsos: ['Reemb. Seguro Saúde', 'Reemb. Prestração', 'Reemb. IVA'],
    },
  },
  mc_savings_invest: {
    name: 'Economia e Investimentos',
    slug: 'economia_investimentos',
    emoji: '📈',
    categories: {
      Poupança: [
        'Fundo de Emergência',
        'Emergency Buffer',
        'Poupança Pessoal',
        'Poupança Household',
      ],
      Investimento: [
        'PPR SGF',
        'PPR AR',
        'PPR Casa Inv.',
        'Criptomoeda',
        'Arte',
        'PPR Other',
        'PPR',
        'TAFI',
        'Ações / ETF',
        'Depósito a Prazo',
        'Fundo de Emergência',
      ],
    },
  },
  mc_fixed_costs: {
    name: 'Custos Fixos',
    slug: 'custos_fixos',
    emoji: '🏠',
    categories: {
      'Cuidados Pessoais': ['Cabeleireiro', 'Lentes de Contacto/oculos', 'Cuidados de beleza'],
      Subscrições: ['Telemóvel', 'Spotify', 'Google One', 'Amazon', 'Outras Subscrições'],
      Alimentação: [
        'Supermercado',
        'Padaria / Pastelaria',
        'Take Away',
        'Cantina / Trabalho',
        'Refeições fora de casa',
      ],
      Transportes: [
        'Carro Via Verde',
        'Mota Combustivel',
        'Carro Combustivel',
        'Autocaravana IUC',
        'Carro IUC',
        'Autocaravana Inspeção',
        'Carro Inspeção',
        'Mota Seguro',
        'Carro Seguro',
        'Autocaravana Seguro',
        'Autocaravana Via Verde',
        'Estacionamento',
        'Autocaravana Manutenção',
        'Autocaravana Combustivel',
        'Carro Manutenção',
        'Carros Outros',
        'Transporte Público',
      ],
      Casa: [
        'Prestração',
        'Ass.Mutualista',
        'Sol.+Consigo',
        'Seg.Multiriscos',
        'Seg.Vida',
        'Condominio',
        'Água',
        'Electricidade',
        'Gás',
        'Luz + Gás',
        'Internet Móvel',
        'Internet',
        'Amortização',
        'Casa Manutenção',
        'Casa Obras',
        'Casa Outros',
        'Casa Decoração',
      ],
      Axl: ['Medicamentos Axl', 'Seguro Axl', 'Ração', 'Creche Axl', 'Veterinário', 'Axl Outros'],
      'Conta Conjunta': ['Mensalidade'],
    },
  },
  mc_variable_costs: {
    name: 'Custos Variaveis',
    slug: 'custos_variaveis',
    emoji: '📊',
    categories: {
      Parentalidade: [
        'Enxoval Maternidade',
        'Vestuário Criança',
        'Cuidados Criança',
        'Consulta Pediatria',
        'Exames Pediatria',
        'Fisioterapia',
        'Drenagem',
        'Medicamentos Pediatria',
        'BebéVida',
        'Outros Criança',
      ],
      'Cuidados Pessoais': [],
      Saúde: [
        'Consultas Adulto',
        'Internamento Adulto',
        'Exames Adulto',
        'Dentista Adulto',
        'Medicamentos Adulto',
      ],
      Desporto: ['Yoga', 'Ginásio', 'Golfe', 'Padel', 'Futebol', 'Corrida', 'App Fitness'],
      'Desenvolvimento Pessoal': ['Terapia', 'Coaching'],
      Subscrições: [],
      Alimentação: [],
      Transportes: [],
      Educação: ['Formação', 'Cultura', 'Livros'],
      Solidariedade: ['Seguro voluntariado', 'Donativo'],
      Casa: [],
      Axl: [],
      Multa: ['Multa'],
      Comissões: ['Millenium', 'MbWay'],
      Desconhecido: ['Desconhecido'],
      Trabalho: ['Despesas a reembolsar', 'Cowork'],
      Lazer: [
        'Projectos Pessoais',
        'Viagem Croácia',
        'Milão e Lago de Como',
        'Toscana',
        'Algarve 25',
        'Perú, Bolivia e Chile',
        'Palma Maiorca',
        'Férias',
        'Atividades Lúdicas',
        'Date Night',
      ],
      Levantamento: ['Levantamento'],
    },
  },
  mc_guilt_free: {
    name: 'Gastos sem culpa',
    slug: 'gastos_sem_culpa',
    emoji: '🎉',
    categories: {
      Prendas: [
        'Prendas Aniversário',
        'Prendas Casamento',
        'Prendas Natal',
        'Prenda Tomas',
        'Prendas Family',
        'Prendas Outros',
      ],
      'Compras Gerais': ['Compras Gerais Outros', 'Acessórios', 'Coisas para casa', 'Vestuário'],
      Lazer: [],
      Casa: [],
    },
  },
}

// Helper to create slugs
function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_+|_+$/g, '') // Trim underscores
}

function generateId(prefix, slug) {
  return `${prefix}_${slug}`
}

async function seed() {
  console.log('🌱 Seeding category taxonomy...')

  let majorCount = 0
  let categoryCount = 0
  let subCategoryCount = 0

  // Seed all major categories, categories, and subcategories
  for (const [majorId, majorData] of Object.entries(TAXONOMY)) {
    // Create or update major category
    const majorCategory = await prisma.majorCategory.upsert({
      where: { id: majorId },
      update: {
        name: majorData.name,
        slug: majorData.slug,
        emoji: majorData.emoji,
      },
      create: {
        id: majorId,
        slug: majorData.slug,
        name: majorData.name,
        emoji: majorData.emoji,
        userId: null, // System default
      },
    })
    majorCount++

    console.log(`  ✓ ${majorData.emoji} ${majorData.name}`)

    // Seed categories (2nd tier)
    for (const [categoryName, subCategoryNames] of Object.entries(majorData.categories)) {
      const categorySlug = createSlug(categoryName)
      // Include major category slug to ensure uniqueness when same category appears in multiple majors
      const categoryId = generateId('cat', `${majorData.slug}_${categorySlug}`)

      const category = await prisma.category.upsert({
        where: { id: categoryId },
        update: {
          name: categoryName,
          slug: categorySlug,
          majorCategoryId: majorId, // IMPORTANT: Also update majorCategoryId on upsert
        },
        create: {
          id: categoryId,
          majorCategoryId: majorId,
          slug: categorySlug,
          name: categoryName,
          userId: null, // System default
        },
      })
      categoryCount++

      console.log(`    → ${categoryName}`)

      // Seed subcategories (3rd tier)
      for (const subCategoryName of subCategoryNames) {
        const subCategorySlug = createSlug(subCategoryName)
        const subCategoryId = generateId('sub', subCategorySlug)

        await prisma.subCategory.upsert({
          where: { id: subCategoryId },
          update: {
            name: subCategoryName,
            slug: subCategorySlug,
            categoryId: categoryId, // IMPORTANT: Update categoryId to link to correct parent
          },
          create: {
            id: subCategoryId,
            categoryId: categoryId,
            slug: subCategorySlug,
            name: subCategoryName,
            userId: null, // System default
          },
        })
        subCategoryCount++
      }
    }
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Major Categories: ${majorCount}`)
  console.log(`   Categories: ${categoryCount}`)
  console.log(`   SubCategories: ${subCategoryCount}`)
  console.log(`   Total: ${majorCount + categoryCount + subCategoryCount}`)
}

seed()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
