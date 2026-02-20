import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  formatTransactionDescription,
} from './format'

describe('formatCurrency', () => {
  it('should format positive numbers as currency', () => {
    const result = formatCurrency(1234.56)
    // Match Portuguese format with comma as decimal separator and € symbol
    expect(result).toMatch(/1[.,\s]?234,56\s?€/)
    expect(result).toContain('1234')
    expect(result).toContain(',56')
    expect(result).toContain('€')
  })

  it('should format negative numbers as currency', () => {
    const result = formatCurrency(-1234.56)
    expect(result).toMatch(/-\s?1[.,\s]?234,56\s?€/)
    expect(result).toContain('1234')
    expect(result).toContain(',56')
    expect(result).toContain('€')
  })

  it('should format zero as currency', () => {
    const result = formatCurrency(0)
    expect(result).toMatch(/0,00\s?€/)
    expect(result).toContain('€')
  })

  it('should respect custom decimal places', () => {
    const result = formatCurrency(1234.5678, 3)
    expect(result).toMatch(/1[.,\s]?234,568\s?€/)
    expect(result).toContain(',568')
  })
})

describe('formatNumber', () => {
  it('should format numbers with default 2 decimals', () => {
    const result = formatNumber(1234.56)
    // Match Portuguese format with comma as decimal separator
    expect(result).toMatch(/1[.,\s]?234,56/)
    expect(result).toContain('1234')
    expect(result).toContain(',56')
  })

  it('should format numbers with custom decimals', () => {
    const result = formatNumber(1234.5678, 3)
    expect(result).toMatch(/1[.,\s]?234,568/)
    expect(result).toContain(',568')
  })

  it('should format integers', () => {
    const result = formatNumber(1234, 0)
    expect(result).toContain('1234')
  })
})

describe('formatDate', () => {
  it('should format Date object', () => {
    const date = new Date('2025-12-23T10:30:00Z')
    const result = formatDate(date)
    // Note: Result depends on timezone, so we just check format pattern
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('should format ISO string', () => {
    const result = formatDate('2025-12-23T10:30:00Z')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('should accept custom format options', () => {
    const date = new Date('2025-12-23')
    const result = formatDate(date, { year: 'numeric', month: 'long' })
    // Result format varies, just check it's not empty
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatDateTime', () => {
  it('should format Date object with time', () => {
    const date = new Date('2025-12-23T14:30:00Z')
    const result = formatDateTime(date)
    // Check format pattern DD/MM/YYYY, HH:MM
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4},\s\d{2}:\d{2}$/)
  })

  it('should format ISO string with time', () => {
    const result = formatDateTime('2025-12-23T14:30:00Z')
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4},\s\d{2}:\d{2}$/)
  })
})

describe('formatTransactionDescription', () => {
  // Basic title-case conversion
  it('should convert ALL CAPS to title case', () => {
    expect(formatTransactionDescription('COMPRA FARMACIA MOREIRA BAR')).toBe(
      'Compra Farmacia Moreira Bar'
    )
  })

  // Banking prefix: DD-
  it('should preserve DD- prefix', () => {
    const result = formatTransactionDescription('DD-ASISA VIDA SEGUROS, S.A.U.,')
    expect(result).toMatch(/^DD-/)
    expect(result).toContain('Asisa')
    expect(result).toContain('Vida')
    expect(result).toContain('Seguros,')
    expect(result).toContain('S.A.U.')
  })

  // Banking prefix: TRF with dot separator
  it('should preserve TRF prefix with dot separator', () => {
    const result = formatTransactionDescription('TRF.P/ INFANTARIO MONFORTINHOS')
    expect(result).toMatch(/^TRF\./)
    expect(result).toContain('p/')
    expect(result).toContain('Infantario')
    expect(result).toContain('Monfortinhos')
  })

  // Banking prefix: PAG
  it('should preserve PAG prefix', () => {
    const result = formatTransactionDescription('PAG SERVICOS AGUA E ENERGIA')
    expect(result).toMatch(/^PAG/)
    expect(result).toContain('Servicos')
    expect(result).toContain('Agua')
    // "e" should be lowercase (small word)
    expect(result).toContain(' e ')
    expect(result).toContain('Energia')
  })

  // Banking prefix: MB
  it('should preserve MB prefix', () => {
    const result = formatTransactionDescription('MB PAGAMENTO DE SERVICO')
    expect(result).toMatch(/^MB/)
    expect(result).toContain('Pagamento')
    expect(result).toContain(' de ')
    expect(result).toContain('Servico')
  })

  // Portuguese small words should be lowercase
  it('should lowercase Portuguese small words (except first word)', () => {
    const result = formatTransactionDescription('TRANSFERENCIA DE ALICE PARA BOB')
    expect(result).toBe('Transferencia de Alice para Bob')
  })

  it('should capitalize small words when they are the first word', () => {
    const result = formatTransactionDescription('DE ALICE PARA BOB')
    expect(result).toMatch(/^De /)
  })

  // Legal suffixes should stay uppercase
  it('should preserve S.A. suffix', () => {
    const result = formatTransactionDescription('EMPRESA TESTE S.A.')
    expect(result).toContain('S.A.')
  })

  it('should preserve LDA suffix', () => {
    const result = formatTransactionDescription('EMPRESA TESTE LDA')
    expect(result).toContain('LDA')
  })

  // Edge cases
  it('should return empty string for empty input', () => {
    expect(formatTransactionDescription('')).toBe('')
  })

  it('should return null/undefined as-is', () => {
    expect(formatTransactionDescription(null as any)).toBe(null)
    expect(formatTransactionDescription(undefined as any)).toBe(undefined)
  })

  it('should not modify already mixed-case descriptions', () => {
    const desc = 'Already Mixed Case Description'
    expect(formatTransactionDescription(desc)).toBe(desc)
  })

  it('should not modify lowercase descriptions', () => {
    const desc = 'already lowercase description'
    expect(formatTransactionDescription(desc)).toBe(desc)
  })

  // Numbers in descriptions
  it('should handle descriptions with numbers', () => {
    const result = formatTransactionDescription('COMPRA 12345 FARMACIA')
    expect(result).toBe('Compra 12345 Farmacia')
  })

  // MB appearing mid-text should stay uppercase
  it('should preserve MB when it appears as a standalone word mid-text', () => {
    const result = formatTransactionDescription('PAGAMENTO MB MULTIBANCO')
    expect(result).toContain('MB')
  })

  // SEPA prefix
  it('should preserve SEPA prefix', () => {
    const result = formatTransactionDescription('SEPA TRANSFERENCIA BANCARIA')
    expect(result).toMatch(/^SEPA/)
    expect(result).toContain('Transferencia')
  })

  // Multiple small words
  it('should handle multiple consecutive small words', () => {
    const result = formatTransactionDescription('PAGAMENTO DA CONTA DE AGUA')
    expect(result).toBe('Pagamento da Conta de Agua')
  })

  // Only special characters
  it('should handle descriptions with only numbers/special chars', () => {
    expect(formatTransactionDescription('12345-67890')).toBe('12345-67890')
  })

  // TPA prefix
  it('should preserve TPA prefix', () => {
    const result = formatTransactionDescription('TPA COMPRA SUPERMERCADO CONTINENTE')
    expect(result).toMatch(/^TPA/)
    expect(result).toContain('Compra')
    expect(result).toContain('Supermercado')
  })

  // Real-world examples
  it('should handle real bank descriptions correctly', () => {
    expect(formatTransactionDescription('COMPRA TPA PINGO DOCE LISBOA')).toBe(
      'Compra TPA Pingo Doce Lisboa'
    )
  })
})
