const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Seed Tag Definitions for Category Migration v2
 *
 * Tag namespaces:
 * - vehicle: carro, mota, autocaravana
 * - trip: croatia, tuscany, mallorca, south-america, algarve-25, milan-como
 * - provider: sgf, ar, casa-investimentos
 * - platform: olx, vinted
 * - occasion: natal, aniversario, casamento
 * - recipient: child, tomas
 * - sport: yoga, ginasio, padel, golfe, futebol, corrida
 * - type: irs, beleza, livros, formacao, decoracao, bank-fee, fine
 * - utility: agua, eletricidade, gas, luz-gas
 * - service: spotify, amazon, google
 * - project: brides, medium, y
 * - reimbursable: yes
 * - bank: (user-configurable)
 * - location: trabalho
 * - asset: autocaravana
 */

const TAG_DEFINITIONS = [
  // Vehicle tags
  { namespace: 'vehicle', value: 'carro', label: 'Carro', labelEn: 'Car', color: '#3B82F6' },
  { namespace: 'vehicle', value: 'mota', label: 'Mota', labelEn: 'Motorcycle', color: '#3B82F6' },
  {
    namespace: 'vehicle',
    value: 'autocaravana',
    label: 'Autocaravana',
    labelEn: 'Campervan',
    color: '#3B82F6',
  },

  // Trip tags
  { namespace: 'trip', value: 'croatia', label: 'Croácia', labelEn: 'Croatia', color: '#10B981' },
  { namespace: 'trip', value: 'tuscany', label: 'Toscana', labelEn: 'Tuscany', color: '#10B981' },
  {
    namespace: 'trip',
    value: 'mallorca',
    label: 'Palma de Maiorca',
    labelEn: 'Mallorca',
    color: '#10B981',
  },
  {
    namespace: 'trip',
    value: 'south-america',
    label: 'Perú, Bolivia e Chile',
    labelEn: 'South America',
    color: '#10B981',
  },
  {
    namespace: 'trip',
    value: 'algarve-25',
    label: 'Algarve 25',
    labelEn: 'Algarve 25',
    color: '#10B981',
  },
  {
    namespace: 'trip',
    value: 'milan-como',
    label: 'Milão e Lago de Como',
    labelEn: 'Milan & Lake Como',
    color: '#10B981',
  },

  // Provider tags (investment/insurance)
  { namespace: 'provider', value: 'sgf', label: 'SGF', labelEn: 'SGF', color: '#8B5CF6' },
  { namespace: 'provider', value: 'ar', label: 'AR', labelEn: 'AR', color: '#8B5CF6' },
  {
    namespace: 'provider',
    value: 'casa-investimentos',
    label: 'Casa de Investimentos',
    labelEn: 'Investment House',
    color: '#8B5CF6',
  },

  // Platform tags
  { namespace: 'platform', value: 'olx', label: 'OLX', labelEn: 'OLX', color: '#F59E0B' },
  { namespace: 'platform', value: 'vinted', label: 'Vinted', labelEn: 'Vinted', color: '#F59E0B' },

  // Occasion tags
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

  // Recipient tags
  { namespace: 'recipient', value: 'child', label: 'Child', labelEn: 'Child', color: '#EC4899' },
  { namespace: 'recipient', value: 'tomas', label: 'Tomás', labelEn: 'Tomás', color: '#EC4899' },

  // Sport tags
  { namespace: 'sport', value: 'yoga', label: 'Yoga', labelEn: 'Yoga', color: '#06B6D4' },
  { namespace: 'sport', value: 'ginasio', label: 'Ginásio', labelEn: 'Gym', color: '#06B6D4' },
  { namespace: 'sport', value: 'padel', label: 'Padel', labelEn: 'Padel', color: '#06B6D4' },
  { namespace: 'sport', value: 'golfe', label: 'Golfe', labelEn: 'Golf', color: '#06B6D4' },
  { namespace: 'sport', value: 'futebol', label: 'Futebol', labelEn: 'Football', color: '#06B6D4' },
  { namespace: 'sport', value: 'corrida', label: 'Corrida', labelEn: 'Running', color: '#06B6D4' },

  // Type tags (miscellaneous transaction types)
  { namespace: 'type', value: 'irs', label: 'IRS', labelEn: 'Tax', color: '#6B7280' },
  { namespace: 'type', value: 'beleza', label: 'Beleza', labelEn: 'Beauty', color: '#6B7280' },
  { namespace: 'type', value: 'livros', label: 'Livros', labelEn: 'Books', color: '#6B7280' },
  {
    namespace: 'type',
    value: 'formacao',
    label: 'Formação',
    labelEn: 'Training',
    color: '#6B7280',
  },
  {
    namespace: 'type',
    value: 'decoracao',
    label: 'Decoração',
    labelEn: 'Decoration',
    color: '#6B7280',
  },
  {
    namespace: 'type',
    value: 'bank-fee',
    label: 'Comissão Bancária',
    labelEn: 'Bank Fee',
    color: '#6B7280',
  },
  { namespace: 'type', value: 'fine', label: 'Multa', labelEn: 'Fine', color: '#6B7280' },
  {
    namespace: 'type',
    value: 'cash-withdrawal',
    label: 'Levantamento',
    labelEn: 'Cash Withdrawal',
    color: '#6B7280',
  },

  // Utility tags
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
    label: 'Luz + Gás',
    labelEn: 'Electricity + Gas',
    color: '#0EA5E9',
  },

  // Service tags
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

  // Project tags
  {
    namespace: 'project',
    value: 'brides',
    label: 'Jogo Brides',
    labelEn: 'Brides Game',
    color: '#A855F7',
  },
  { namespace: 'project', value: 'medium', label: 'Medium', labelEn: 'Medium', color: '#A855F7' },
  { namespace: 'project', value: 'y', label: 'Projecto Y', labelEn: 'Project Y', color: '#A855F7' },

  // Reimbursable tag
  {
    namespace: 'reimbursable',
    value: 'yes',
    label: 'Reembolsável',
    labelEn: 'Reimbursable',
    color: '#14B8A6',
  },

  // Location tags
  {
    namespace: 'location',
    value: 'trabalho',
    label: 'Trabalho',
    labelEn: 'Work',
    color: '#78716C',
  },

  // Asset tags
  {
    namespace: 'asset',
    value: 'autocaravana',
    label: 'Autocaravana',
    labelEn: 'Campervan',
    color: '#84CC16',
  },
]

async function seed() {
  console.log('🏷️  Seeding Tag Definitions...\n')

  let created = 0
  let updated = 0

  for (const tag of TAG_DEFINITIONS) {
    const result = await prisma.tagDefinition.upsert({
      where: {
        namespace_value: {
          namespace: tag.namespace,
          value: tag.value,
        },
      },
      update: {
        label: tag.label,
        labelEn: tag.labelEn,
        color: tag.color,
      },
      create: {
        namespace: tag.namespace,
        value: tag.value,
        label: tag.label,
        labelEn: tag.labelEn,
        color: tag.color,
        sortOrder: 0,
      },
    })

    // Check if it was created or updated (by checking createdAt vs updatedAt)
    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++
    } else {
      updated++
    }
  }

  // Group by namespace for display
  const byNamespace = {}
  TAG_DEFINITIONS.forEach(t => {
    if (!byNamespace[t.namespace]) byNamespace[t.namespace] = []
    byNamespace[t.namespace].push(t.value)
  })

  console.log('📊 Tag namespaces:')
  for (const [ns, values] of Object.entries(byNamespace)) {
    console.log(`   ${ns}: ${values.join(', ')}`)
  }

  console.log(`\n✅ Tag definitions seeding complete!`)
  console.log(`   Total: ${TAG_DEFINITIONS.length}`)
  console.log(`   Namespaces: ${Object.keys(byNamespace).length}`)
}

seed()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
