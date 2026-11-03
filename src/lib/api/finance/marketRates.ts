// Market reference rates for Exchange Rate Management's "Fetch market rates"
// button — fawazahmed0's keyless exchange-api, called straight from the
// browser (jsDelivr sends access-control-allow-origin: *). Chosen over
// open.er-api.com, whose free UGX rate came in ~4% under every other quote
// when compared on 2026-11-03 (4,114 vs Google 4,226, Wise 4,271).
//
// These are market rates, updated once a day — a starting figure for finance
// to review, never saved without someone pressing Save.
const MARKET_RATES_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'

export interface MarketRates {
  // Provider's own date for the figures (YYYY-MM-DD).
  date: string
  // Units of each currency per 1 USD, upper-case codes.
  perUsd: Record<string, number>
}

export async function getMarketRates(): Promise<MarketRates> {
  // no-store: jsDelivr serves this with a 7-day browser max-age, which
  // would otherwise hand back last week's rates.
  const res = await fetch(MARKET_RATES_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Market rates unavailable (HTTP ${res.status}).`)
  const data = await res.json() as { date?: string; usd?: Record<string, number> }
  if (!data.usd || typeof data.usd !== 'object') throw new Error('Market rates came back in an unexpected format.')
  const perUsd: Record<string, number> = {}
  for (const [code, rate] of Object.entries(data.usd)) {
    if (typeof rate === 'number' && rate > 0) perUsd[code.toUpperCase()] = rate
  }
  return { date: data.date ?? '', perUsd }
}

// "1 {code} = ___ {base}" — the app's exRate direction. null when the
// provider has no rate for either side.
export function marketRateFor(rates: MarketRates, code: string, base: string): number | null {
  const c = rates.perUsd[code.trim().toUpperCase()]
  const b = rates.perUsd[base.trim().toUpperCase()]
  if (!c || !b) return null
  return b / c
}
