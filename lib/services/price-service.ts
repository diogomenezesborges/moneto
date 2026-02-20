/**
 * Price Service - Yahoo Finance Integration
 *
 * Fetches live stock/ETF prices from Yahoo Finance API.
 * Implements caching to avoid rate limits and improve performance.
 *
 * Issue #107: Investment Tracking - Price Service
 */

import yahooFinance from 'yahoo-finance2'

// ============================================================================
// Types
// ============================================================================

export interface PriceQuote {
  ticker: string
  price: number
  currency: string
  change: number
  changePercent: number
  lastUpdated: Date
  source: 'yahoo' | 'cache'
}

export interface PriceServiceError {
  ticker: string
  error: string
  timestamp: Date
}

// ============================================================================
// In-Memory Cache (5 minutes TTL)
// ============================================================================

interface CacheEntry {
  quote: PriceQuote
  expiresAt: Date
}

const priceCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Get a quote from cache if valid
 */
function getCachedQuote(ticker: string): PriceQuote | null {
  const cached = priceCache.get(ticker.toUpperCase())
  if (!cached) return null

  // Check if expired
  if (new Date() > cached.expiresAt) {
    priceCache.delete(ticker.toUpperCase())
    return null
  }

  return { ...cached.quote, source: 'cache' }
}

/**
 * Store a quote in cache
 */
function setCachedQuote(ticker: string, quote: PriceQuote): void {
  priceCache.set(ticker.toUpperCase(), {
    quote,
    expiresAt: new Date(Date.now() + CACHE_TTL_MS),
  })
}

// ============================================================================
// Yahoo Finance API
// ============================================================================

/**
 * Fetch a single stock/ETF quote from Yahoo Finance
 *
 * @param ticker - Stock/ETF ticker (e.g., "IWDA.AS", "AAPL")
 * @returns PriceQuote or null if failed
 *
 * @example
 * const quote = await getQuote("IWDA.AS")
 * if (quote) {
 *   console.log(`${quote.ticker}: €${quote.price}`)
 * }
 */
export async function getQuote(ticker: string): Promise<PriceQuote | null> {
  try {
    // Check cache first
    const cached = getCachedQuote(ticker)
    if (cached) {
      return cached
    }

    // Fetch from Yahoo Finance
    const result = await yahooFinance.quote(ticker)

    // Validate response
    if (!result || (result as any).regularMarketPrice === undefined) {
      console.error(`Invalid response from Yahoo Finance for ticker: ${ticker}`)
      return null
    }

    const quote: PriceQuote = {
      ticker: ticker.toUpperCase(),
      price: (result as any).regularMarketPrice,
      currency: (result as any).currency || 'EUR',
      change: (result as any).regularMarketChange || 0,
      changePercent: (result as any).regularMarketChangePercent || 0,
      lastUpdated: new Date(),
      source: 'yahoo',
    }

    // Cache the result
    setCachedQuote(ticker, quote)

    return quote
  } catch (error: any) {
    console.error(`Failed to fetch quote for ${ticker}:`, error.message)
    return null
  }
}

/**
 * Fetch multiple stock/ETF quotes in parallel
 *
 * @param tickers - Array of tickers (e.g., ["IWDA.AS", "VWCE.DE", "AAPL"])
 * @returns Map of ticker → PriceQuote (only successful fetches)
 *
 * @example
 * const quotes = await getBatchQuotes(["IWDA.AS", "AAPL", "TSLA"])
 * quotes.forEach((quote, ticker) => {
 *   console.log(`${ticker}: $${quote.price}`)
 * })
 */
export async function getBatchQuotes(tickers: string[]): Promise<Map<string, PriceQuote>> {
  const results = new Map<string, PriceQuote>()

  // Fetch all quotes in parallel
  const quotes = await Promise.allSettled(tickers.map(ticker => getQuote(ticker)))

  quotes.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      results.set(tickers[index].toUpperCase(), result.value)
    }
  })

  return results
}

/**
 * Get historical price for a specific date (for benchmark comparison)
 *
 * @param ticker - Stock/ETF ticker
 * @param date - Date to fetch price for
 * @returns Price or null if failed
 *
 * @example
 * const price = await getHistoricalPrice("IWDA.AS", new Date("2024-01-15"))
 * if (price) console.log(`Price on 2024-01-15: €${price}`)
 */
export async function getHistoricalPrice(ticker: string, date: Date): Promise<number | null> {
  try {
    // Fetch historical data for the specific date
    // Yahoo Finance historical API returns data for a date range
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1) // Add 1 day to ensure we get the date

    const results = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
    })

    if (!results || (results as any).length === 0) {
      console.warn(`No historical data found for ${ticker} on ${date.toISOString()}`)
      return null
    }

    // Return the closing price of the first result
    return (results as any)[0].close
  } catch (error: any) {
    console.error(
      `Failed to fetch historical price for ${ticker} on ${date.toISOString()}:`,
      error.message
    )
    return null
  }
}

/**
 * Refresh prices for all tickers (clears cache and refetches)
 *
 * @param tickers - Array of tickers to refresh
 * @returns Map of ticker → PriceQuote
 */
export async function refreshPrices(tickers: string[]): Promise<Map<string, PriceQuote>> {
  // Clear cache for these tickers
  tickers.forEach(ticker => priceCache.delete(ticker.toUpperCase()))

  // Fetch fresh data
  return getBatchQuotes(tickers)
}

/**
 * Clear the entire price cache
 */
export function clearPriceCache(): void {
  priceCache.clear()
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  const now = new Date()
  let validEntries = 0
  let expiredEntries = 0

  priceCache.forEach(entry => {
    if (now < entry.expiresAt) {
      validEntries++
    } else {
      expiredEntries++
    }
  })

  return {
    totalEntries: priceCache.size,
    validEntries,
    expiredEntries,
    cacheTtlMinutes: CACHE_TTL_MS / 1000 / 60,
  }
}
