import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createRequestLogger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'
import { AuthenticationError } from '@/lib/errors'
import { getBatchQuotes, refreshPrices } from '@/lib/services/price-service'

/**
 * GET /api/investments/prices
 * Fetches current prices for multiple tickers from Yahoo Finance
 *
 * Query params:
 *  - tickers: Comma-separated list of tickers (e.g., "IWDA.AS,AAPL,VWCE.DE")
 *  - refresh: Optional boolean to force refresh (bypass cache)
 */
export async function GET(request: NextRequest) {
  const log = createRequestLogger(request)

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      log.warn('Unauthorized GET request')
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const tickersParam = searchParams.get('tickers')
    const shouldRefresh = searchParams.get('refresh') === 'true'

    if (!tickersParam) {
      return NextResponse.json({ error: 'Missing tickers parameter' }, { status: 400 })
    }

    const tickers = tickersParam.split(',').filter(t => t.trim().length > 0)

    if (tickers.length === 0) {
      return NextResponse.json({ error: 'No valid tickers provided' }, { status: 400 })
    }

    // Fetch prices (with or without cache refresh)
    const quotesMap = shouldRefresh ? await refreshPrices(tickers) : await getBatchQuotes(tickers)

    // Convert Map to object for JSON response
    const quotes = Object.fromEntries(quotesMap)

    log.info(
      { tickersCount: tickers.length, quotesCount: quotesMap.size, refresh: shouldRefresh },
      'Prices fetched'
    )

    return NextResponse.json({ quotes })
  } catch (error) {
    return handleApiError(error, log)
  }
}
