/**
 * Bank name normalization utility
 * Provides generic string normalization for bank names.
 * Users configure their own banks via the Banks API.
 */

/**
 * Normalize a bank name for consistent display
 * Trims whitespace and capitalizes the first letter.
 */
export function normalizeBankName(bankName: string): string {
  if (!bankName) return bankName

  const trimmed = bankName.trim()
  if (!trimmed) return trimmed

  // Return with first letter capitalized
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Get unique normalized bank names from an array
 * Handles duplicates caused by inconsistent casing
 * @param banks - Array of bank names (may contain nulls and duplicates)
 * @returns Sorted array of unique normalized bank names
 */
export function getUniqueBanks(banks: (string | null)[]): string[] {
  // Normalize all bank names and filter out empty/null values
  const normalized = banks.filter((b): b is string => !!b).map(b => normalizeBankName(b))

  // Remove duplicates and sort
  return Array.from(new Set(normalized)).sort((a, b) => a.localeCompare(b))
}
