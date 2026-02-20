/**
 * Format a number as currency in European Portuguese format
 * Example: 1234.56 => "1.234,56 €"
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return amount.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a number in European Portuguese format
 * Example: 1234.56 => "1.234,56"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a date in European Portuguese format
 * Example: "23/12/2025"
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(
    'pt-PT',
    options || {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  )
}

/**
 * Format a date and time in European Portuguese format
 * Example: "23/12/2025, 14:30"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Banking prefixes that should remain uppercase.
 * These are common Portuguese banking transaction prefixes.
 * Order matters: longer prefixes checked first to avoid partial matches.
 */
const BANKING_PREFIXES = ['MBWAY', 'DD-', 'TRF', 'PAG', 'MB', 'TPA', 'ATM', 'NIB', 'IBAN', 'SEPA']

/**
 * Pattern to detect legal suffixes that should remain uppercase.
 * Matches: S.A., S.A.U., S.A.U.,  LDA, LDA., S.L., LTD, LTD.
 */
const LEGAL_SUFFIX_TOKENS = /^S\.A\.U?\.?,?$|^LDA\.?$|^S\.L\.?$|^LTD\.?$/i

/**
 * Portuguese small words that should be lowercase (unless first word).
 */
const SMALL_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'a',
  'o',
  'as',
  'os',
  'p/',
  'c/',
  'p',
  'ao',
  'na',
  'no',
  'nas',
  'nos',
  'por',
  'para',
  'com',
  'sem',
])

/**
 * Format a bank-imported transaction description from ALL CAPS to title case.
 * Display-only transformation — does NOT modify the stored value.
 *
 * Rules:
 * - Banking prefixes (DD-, TRF, PAG, MB, etc.) stay uppercase
 * - Legal suffixes (S.A., S.A.U., LDA) stay uppercase
 * - Portuguese small words (de, da, do, e, em, a, o, p/) stay lowercase (unless first)
 * - Everything else gets title-cased
 *
 * @example
 * formatTransactionDescription("COMPRA FARMACIA MOREIRA BAR")
 * // => "Compra Farmacia Moreira Bar"
 *
 * formatTransactionDescription("DD-ASISA VIDA SEGUROS, S.A.U.,")
 * // => "DD-Asisa Vida Seguros, S.A.U.,"
 *
 * formatTransactionDescription("TRF.P/ INFANTARIO MONFORTINHOS")
 * // => "TRF.p/ Infantario Monfortinhos"
 */
export function formatTransactionDescription(description: string): string {
  if (!description) return description

  // If the description is not mostly uppercase, return as-is
  const letters = description.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (letters.length === 0) return description
  const uppercaseCount = (description.match(/[A-ZÀ-Ý]/g) || []).length
  if (uppercaseCount / letters.length < 0.7) return description

  // Check if the description starts with a known banking prefix
  let prefix = ''
  let rest = description
  for (const bp of BANKING_PREFIXES) {
    const upperRest = rest.toUpperCase()
    if (upperRest.startsWith(bp)) {
      const afterPrefix = rest.substring(bp.length)
      // For prefixes ending in '-' (like DD-), the next char is directly part of the text
      if (bp.endsWith('-')) {
        prefix = rest.substring(0, bp.length)
        rest = afterPrefix
        break
      }
      // For other prefixes, require a separator or end of string
      if (
        afterPrefix.length === 0 ||
        afterPrefix[0] === '.' ||
        afterPrefix[0] === '-' ||
        afterPrefix[0] === ' '
      ) {
        prefix = rest.substring(0, bp.length)
        rest = afterPrefix
        // Also consume '.' separator (e.g., "TRF.P/")
        if (rest.startsWith('.')) {
          prefix += '.'
          rest = rest.substring(1)
        }
        break
      }
    }
  }

  // Title-case the remaining text
  const words = rest.split(/(\s+)/)
  let isFirst = prefix === '' // first word in output if no prefix
  const transformed = words.map(word => {
    // Preserve whitespace tokens
    if (/^\s+$/.test(word)) return word

    // Skip empty
    if (!word) return word

    // Check for legal suffixes (S.A., S.A.U., LDA, etc.)
    if (LEGAL_SUFFIX_TOKENS.test(word)) {
      return word.toUpperCase()
    }

    // Check if it's a banking prefix appearing mid-text (e.g., "MB" in middle)
    const wordUpper = word.toUpperCase().replace(/[,;.:]+$/, '')
    if (BANKING_PREFIXES.includes(wordUpper) || BANKING_PREFIXES.includes(wordUpper + '-')) {
      return word.toUpperCase()
    }

    // Separate leading non-letter characters from the alphabetic core
    const match = word.match(/^([^a-zA-ZÀ-ÿ]*)([a-zA-ZÀ-ÿ].*)$/)
    if (!match) {
      // Word has no letters (e.g., "12345", punctuation) — return as-is
      return word
    }
    const punctBefore = match[1]
    const core = match[2]

    // Check for small words (Portuguese prepositions/articles)
    const coreLower = core.toLowerCase().replace(/[,;.:]+$/, '')
    if (!isFirst && SMALL_WORDS.has(coreLower)) {
      isFirst = false
      return punctBefore + core.toLowerCase()
    }

    isFirst = false

    // Title-case: first letter uppercase, rest lowercase
    const titleCased = core.charAt(0).toUpperCase() + core.substring(1).toLowerCase()
    return punctBefore + titleCased
  })

  return prefix + transformed.join('')
}
