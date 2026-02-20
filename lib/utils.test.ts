import { describe, it, expect } from 'vitest'
import { cn, toSmartTitleCase } from './utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('px-4 py-2', 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500')
  })

  it('handles conditional classes', () => {
    expect(cn('px-4', true && 'py-2', false && 'bg-red-500')).toBe('px-4 py-2')
  })

  it('resolves Tailwind conflicts correctly', () => {
    expect(cn('px-4 px-8')).toBe('px-8')
  })
})

describe('toSmartTitleCase', () => {
  describe('banking prefixes preservation', () => {
    it('preserves TRF prefix in uppercase', () => {
      expect(toSmartTitleCase('TRF COMPRA CONTINENTE DO ALGARVE')).toBe(
        'TRF COMPRA Continente do Algarve'
      )
      expect(toSmartTitleCase('trf pagamento')).toBe('TRF Pagamento')
    })

    it('preserves DD- prefix in uppercase', () => {
      expect(toSmartTitleCase('DD-123 PAGAMENTO LUZ')).toBe('DD-123 Pagamento Luz')
      expect(toSmartTitleCase('dd-456 compra')).toBe('DD-456 Compra')
    })

    it('preserves PAG prefix in uppercase', () => {
      expect(toSmartTitleCase('PAG SERVIÇOS')).toBe('PAG Serviços')
      expect(toSmartTitleCase('pag continente')).toBe('PAG Continente')
    })

    it('preserves MB prefix in uppercase', () => {
      expect(toSmartTitleCase('MB PAGAMENTO NA LOJA')).toBe('MB Pagamento na Loja')
      expect(toSmartTitleCase('mb compra')).toBe('MB Compra')
    })

    it('preserves COMPRA prefix in uppercase', () => {
      expect(toSmartTitleCase('COMPRA PINGO DOCE')).toBe('COMPRA Pingo Doce')
      expect(toSmartTitleCase('compra lidl')).toBe('COMPRA Lidl')
    })

    it('preserves MBWAY prefix in uppercase', () => {
      expect(toSmartTitleCase('MBWAY PAGAMENTO NA LOJA')).toBe('MBWAY Pagamento na Loja')
      expect(toSmartTitleCase('mbway transferencia')).toBe('MBWAY Transferencia')
    })
  })

  describe('small Portuguese words lowercasing', () => {
    it('lowercases "de" except when first word', () => {
      expect(toSmartTitleCase('CASA DE PAPEL')).toBe('Casa de Papel')
      expect(toSmartTitleCase('DE CASA')).toBe('De Casa')
    })

    it('lowercases "da" except when first word', () => {
      expect(toSmartTitleCase('FARMACIA DA ESQUINA')).toBe('Farmacia da Esquina')
      expect(toSmartTitleCase('DA MARIA')).toBe('Da Maria')
    })

    it('lowercases "do" except when first word', () => {
      expect(toSmartTitleCase('CONTINENTE DO ALGARVE')).toBe('Continente do Algarve')
      expect(toSmartTitleCase('DO PORTO')).toBe('Do Porto')
    })

    it('lowercases "dos" except when first word', () => {
      expect(toSmartTitleCase('CASA DOS VINHOS')).toBe('Casa dos Vinhos')
      expect(toSmartTitleCase('DOS SANTOS')).toBe('Dos Santos')
    })

    it('lowercases "das" except when first word', () => {
      expect(toSmartTitleCase('LOJA DAS FLORES')).toBe('Loja das Flores')
      expect(toSmartTitleCase('DAS LOJAS')).toBe('Das Lojas')
    })

    it('lowercases "e" except when first word', () => {
      expect(toSmartTitleCase('PINGO E DOCE')).toBe('Pingo e Doce')
      expect(toSmartTitleCase('E FILHOS')).toBe('E Filhos')
    })

    it('lowercases "a" except when first word', () => {
      expect(toSmartTitleCase('COMPRA A VISTA')).toBe('Compra a Vista')
      expect(toSmartTitleCase('A LOJA')).toBe('A Loja')
    })

    it('lowercases "p/" except when first word', () => {
      expect(toSmartTitleCase('TRANSFERENCIA P/ JOAO')).toBe('Transferencia p/ Joao')
      expect(toSmartTitleCase('P/ PAGAMENTO')).toBe('P/ Pagamento')
    })

    it('lowercases "em" except when first word', () => {
      expect(toSmartTitleCase('COMPRA EM LISBOA')).toBe('Compra em Lisboa')
      expect(toSmartTitleCase('EM CASA')).toBe('Em Casa')
    })

    it('lowercases "na" except when first word', () => {
      expect(toSmartTitleCase('PAGAMENTO NA LOJA')).toBe('Pagamento na Loja')
      expect(toSmartTitleCase('NA CASA')).toBe('Na Casa')
    })

    it('lowercases "no" except when first word', () => {
      expect(toSmartTitleCase('COMPRA NO MERCADO')).toBe('Compra no Mercado')
      expect(toSmartTitleCase('NO ALGARVE')).toBe('No Algarve')
    })
  })

  describe('combined scenarios', () => {
    it('handles banking prefix with small words', () => {
      expect(toSmartTitleCase('TRF P/ JOAO DA SILVA')).toBe('TRF p/ Joao da Silva')
      expect(toSmartTitleCase('MBWAY PAGAMENTO NA LOJA DO PORTO')).toBe(
        'MBWAY Pagamento na Loja do Porto'
      )
    })

    it('handles multiple small words in sequence', () => {
      expect(toSmartTitleCase('CASA DA MAE DO JOAO')).toBe('Casa da Mae do Joao')
    })

    it('handles mixed case input', () => {
      expect(toSmartTitleCase('tRf CoMpRa CoNtInEnTe Do AlGaRvE')).toBe(
        'TRF COMPRA Continente do Algarve'
      )
    })

    it('handles already formatted text', () => {
      expect(toSmartTitleCase('TRF Compra Continente do Algarve')).toBe(
        'TRF COMPRA Continente do Algarve'
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(toSmartTitleCase('')).toBe('')
    })

    it('handles single word', () => {
      expect(toSmartTitleCase('COMPRA')).toBe('COMPRA')
      expect(toSmartTitleCase('LIDL')).toBe('Lidl')
    })

    it('handles extra whitespace', () => {
      expect(toSmartTitleCase('TRF  COMPRA   CONTINENTE')).toBe('TRF COMPRA Continente')
    })

    it('handles lowercase input', () => {
      expect(toSmartTitleCase('trf compra continente do algarve')).toBe(
        'TRF COMPRA Continente do Algarve'
      )
    })

    it('handles uppercase input', () => {
      expect(toSmartTitleCase('TRF COMPRA CONTINENTE DO ALGARVE')).toBe(
        'TRF COMPRA Continente do Algarve'
      )
    })
  })
})
