// Complete 3-tier category taxonomy
export const MAJOR_CATEGORIES = [
  {
    id: 'mc_income',
    name: 'Rendimento',
    slug: 'rendimento',
    emoji: '💰',
    subcategories: ['Salario'],
  },
  {
    id: 'mc_income_extra',
    name: 'Rendimento Extra',
    slug: 'rendimento_extra',
    emoji: '💸',
    subcategories: [
      'Vendas Usados',
      'Autocaravana',
      'Prendas Recebidas',
      'Outros Rendimentos',
      'Projectos',
      'Crédito Habitação',
      'Reembolsos',
    ],
  },
  {
    id: 'mc_savings_invest',
    name: 'Economia e Investimentos',
    slug: 'economia_investimentos',
    emoji: '📈',
    subcategories: ['Poupança', 'Investimento'],
  },
  {
    id: 'mc_fixed_costs',
    name: 'Custos Fixos',
    slug: 'custos_fixos',
    emoji: '🏠',
    subcategories: [
      'Cuidados Pessoais',
      'Subscrições',
      'Alimentação',
      'Transportes',
      'Casa',
      'Axl',
      'Conta Conjunta',
    ],
  },
  {
    id: 'mc_variable_costs',
    name: 'Custos Variaveis',
    slug: 'custos_variaveis',
    emoji: '📊',
    subcategories: [
      'Parentalidade',
      'Cuidados Pessoais',
      'Saúde',
      'Desporto',
      'Desenvolvimento Pessoal',
      'Subscrições',
      'Alimentação',
      'Transportes',
      'Educação',
      'Solidariedade',
      'Casa',
      'Axl',
      'Multa',
      'Comissões',
      'Desconhecido',
      'Trabalho',
      'Lazer',
      'Levantamento',
    ],
  },
  {
    id: 'mc_guilt_free',
    name: 'Gastos sem culpa',
    slug: 'gastos_sem_culpa',
    emoji: '🎉',
    subcategories: ['Prendas', 'Compras Gerais', 'Lazer', 'Casa'],
  },
] as const

// Detailed subcategory mapping
export const SUBCATEGORIES: Record<string, string[]> = {
  // ========== RENDIMENTO ==========
  Salario: ['Salario Liq.', 'Subs.Alimentação', 'Mensalidade', 'IRS', 'Prémio', 'Subs.Férias'],

  // ========== RENDIMENTO EXTRA ==========
  'Vendas Usados': ['Olx', 'Vinted'],
  Autocaravana: ['Aluguer'],
  'Prendas Recebidas': ['Monetário'],
  'Outros Rendimentos': ['Outros Rendimentos'],
  Projectos: ['Jogo Brides', 'Medium', 'Projecto Y'],
  'Crédito Habitação': ['Empréstimo Obras'],
  Reembolsos: ['Reemb. Seguro Saúde', 'Reemb. Prestração', 'Reemb. IVA'],

  // ========== ECONOMIA E INVESTIMENTOS ==========
  Poupança: ['Fundo de Emergência', 'Emergency Buffer', 'Poupança Pessoal', 'Poupança Familiar'],
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

  // ========== CUSTOS FIXOS ==========
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

  // ========== CUSTOS VARIAVEIS ==========
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
  Saúde: [
    'Consultas Adulto',
    'Internamento Adulto',
    'Exames Adulto',
    'Dentista Adulto',
    'Medicamentos Adulto',
  ],
  Desporto: ['Yoga', 'Ginásio', 'Golfe', 'Padel', 'Futebol', 'Corrida', 'App Fitness'],
  'Desenvolvimento Pessoal': ['Terapia', 'Coaching'],
  Educação: ['Formação', 'Cultura', 'Livros'],
  Solidariedade: ['Seguro voluntariado', 'Donativo'],
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

  // ========== GASTOS SEM CULPA ==========
  Prendas: [
    'Prendas Aniversário',
    'Prendas Casamento',
    'Prendas Natal',
    'Prenda Child',
    'Prendas Family',
    'Prendas Outros',
  ],
  'Compras Gerais': ['Compras Gerais Outros', 'Acessórios', 'Coisas para casa', 'Vestuário'],
}

export function getCategoryColor(majorCategory: string): string {
  const colorMap: Record<string, string> = {
    Rendimento:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500',
    'Rendimento Extra':
      'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500',
    'Economia e Investimentos':
      'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500',
    'Custos Fixos':
      'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500',
    'Custos Variaveis':
      'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500',
    'Gastos sem culpa':
      'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500',
  }

  return (
    colorMap[majorCategory] ||
    'bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
  )
}

// Merchant classification rules (for hybrid strategy)
export const MERCHANT_RULES: Record<string, { major: string; category: string; sub?: string }> = {
  // Supermarkets
  continente: { major: 'Custos Fixos', category: 'Alimentação', sub: 'Supermercado' },
  'pingo doce': { major: 'Custos Fixos', category: 'Alimentação', sub: 'Supermercado' },
  mercadona: { major: 'Custos Fixos', category: 'Alimentação', sub: 'Supermercado' },
  auchan: { major: 'Custos Fixos', category: 'Alimentação', sub: 'Supermercado' },
  lidl: { major: 'Custos Fixos', category: 'Alimentação', sub: 'Supermercado' },
  intermarche: { major: 'Custos Fixos', category: 'Alimentação', sub: 'Supermercado' },

  // Fuel & Transport
  galp: { major: 'Custos Fixos', category: 'Transportes', sub: 'Carro Combustivel' },
  repsol: { major: 'Custos Fixos', category: 'Transportes', sub: 'Carro Combustivel' },
  bp: { major: 'Custos Fixos', category: 'Transportes', sub: 'Carro Combustivel' },
  cepsa: { major: 'Custos Fixos', category: 'Transportes', sub: 'Carro Combustivel' },
  'via verde': { major: 'Custos Fixos', category: 'Transportes', sub: 'Carro Via Verde' },

  // Restaurants & Takeaway
  'uber eats': { major: 'Custos Variaveis', category: 'Alimentação', sub: 'Take Away' },
  glovo: { major: 'Custos Variaveis', category: 'Alimentação', sub: 'Take Away' },
  'bolt food': { major: 'Custos Variaveis', category: 'Alimentação', sub: 'Take Away' },
  mcdonald: { major: 'Custos Variaveis', category: 'Alimentação', sub: 'Take Away' },
  'pizza hut': { major: 'Custos Variaveis', category: 'Alimentação', sub: 'Take Away' },

  // Utilities
  edp: { major: 'Custos Fixos', category: 'Casa', sub: 'Electricidade' },
  'galp energia': { major: 'Custos Fixos', category: 'Casa', sub: 'Gás' },
  vodafone: { major: 'Custos Fixos', category: 'Subscrições', sub: 'Telemóvel' },
  nos: { major: 'Custos Fixos', category: 'Casa', sub: 'Internet' },
  meo: { major: 'Custos Fixos', category: 'Casa', sub: 'Internet' },

  // Streaming & Subscriptions
  netflix: { major: 'Custos Fixos', category: 'Subscrições', sub: 'Outras Subscrições' },
  spotify: { major: 'Custos Fixos', category: 'Subscrições', sub: 'Spotify' },
  disney: { major: 'Custos Fixos', category: 'Subscrições', sub: 'Outras Subscrições' },
  hbo: { major: 'Custos Fixos', category: 'Subscrições', sub: 'Outras Subscrições' },
  'amazon prime': { major: 'Custos Fixos', category: 'Subscrições', sub: 'Amazon' },
  'google one': { major: 'Custos Fixos', category: 'Subscrições', sub: 'Google One' },

  // Health & Fitness
  ginasio: { major: 'Custos Variaveis', category: 'Desporto', sub: 'Ginásio' },
  farmacia: { major: 'Custos Variaveis', category: 'Saúde', sub: 'Medicamentos Adulto' },
  yoga: { major: 'Custos Variaveis', category: 'Desporto', sub: 'Yoga' },

  // Used Sales
  olx: { major: 'Rendimento Extra', category: 'Vendas Usados', sub: 'Olx' },
  vinted: { major: 'Rendimento Extra', category: 'Vendas Usados', sub: 'Vinted' },

  // Pet (Axl)
  ração: { major: 'Custos Fixos', category: 'Axl', sub: 'Ração' },
  veterinário: { major: 'Custos Variaveis', category: 'Axl', sub: 'Veterinário' },

  // Banking
  mbway: { major: 'Custos Variaveis', category: 'Comissões', sub: 'MbWay' },

  // Parking & Tolls
  emel: { major: 'Custos Variaveis', category: 'Transportes', sub: 'Estacionamento' },

  // Bakery & Pastry
  padaria: { major: 'Custos Variaveis', category: 'Alimentação', sub: 'Padaria / Pastelaria' },
  pastelaria: { major: 'Custos Variaveis', category: 'Alimentação', sub: 'Padaria / Pastelaria' },
}

// Convert MERCHANT_RULES to DEFAULT_RULES format for database seeding
export const DEFAULT_RULES = Object.entries(MERCHANT_RULES).map(([keyword, rule]) => ({
  keyword,
  majorCategory: rule.major,
  category: rule.category,
  subCategory: rule.sub || rule.category,
}))
