import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes with proper precedence
 *
 * Combines clsx for conditional classes and tailwind-merge
 * to handle Tailwind-specific class conflicts.
 *
 * @example
 * ```tsx
 * cn('px-4 py-2', isActive && 'bg-primary', className)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts bank transaction descriptions to smart title case
 *
 * Preserves banking prefixes (TRF, DD-, PAG, MB, COMPRA, MBWAY) in uppercase
 * and lowercases small Portuguese words except when they're the first word.
 * This is a UI-layer formatting function - it does NOT mutate the original data.
 *
 * @param text - The transaction description to format
 * @returns Formatted string in smart title case
 *
 * @example
 * ```ts
 * toSmartTitleCase('TRF COMPRA CONTINENTE DO ALGARVE')
 * // => 'TRF COMPRA Continente do Algarve'
 *
 * toSmartTitleCase('MBWAY PAGAMENTO NA LOJA')
 * // => 'MBWAY Pagamento na Loja'
 * ```
 */
export function toSmartTitleCase(text: string): string {
  if (!text) return text

  // Banking prefixes to preserve in uppercase (excluding COMPRA which has special rules)
  const bankingPrefixes = ['TRF', 'DD-', 'PAG', 'MB', 'MBWAY']

  // Small Portuguese words to lowercase (except when first word)
  const smallWords = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'a', 'p/', 'em', 'na', 'no'])

  const words = text.split(/\s+/)

  return words
    .map((word, index) => {
      const upperWord = word.toUpperCase()

      // Preserve banking prefixes (exact match or with following digits for DD-)
      for (const prefix of bankingPrefixes) {
        if (upperWord === prefix || (prefix.endsWith('-') && upperWord.startsWith(prefix))) {
          return upperWord
        }
      }

      // Special handling for COMPRA: only uppercase when:
      // 1. At index 0 or 1 (after TRF), AND
      // 2. Followed by a proper noun (next word is NOT a small word)
      if (
        upperWord === 'COMPRA' &&
        (index === 0 || (index === 1 && words[0].toUpperCase() === 'TRF'))
      ) {
        const nextWord = words[index + 1]
        if (nextWord) {
          // Check if next word is a proper noun (not a small Portuguese word)
          const nextLower = nextWord.toLowerCase()
          const isProperNoun = !smallWords.has(nextLower)
          if (isProperNoun) {
            return upperWord
          }
        } else {
          // No next word, treat as banking prefix
          return upperWord
        }
      }

      const lowerWord = word.toLowerCase()

      // Keep small words lowercase unless they're the first word
      if (index !== 0 && smallWords.has(lowerWord)) {
        return lowerWord
      }

      // Title case: first letter uppercase, rest lowercase
      return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1)
    })
    .join(' ')
}
