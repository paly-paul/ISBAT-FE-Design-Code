// Mock-only for now — the academic master endpoints aren't implemented on
// the real backend yet. Swap these for apiGet/apiPost calls (see
// src/lib/api/client.ts) once the API is available.

export interface Currency {
  id: string
  currencyCode: string
  currencyName: string
  isDefault: number
}

export type CurrencyInput = Omit<Currency, 'id'>

const mockCurrencies: Currency[] = [
  { id: '1', currencyCode: 'UGX', currencyName: 'Uganda Shilling', isDefault: 1 },
  { id: '2', currencyCode: 'USD', currencyName: 'US Dollar',       isDefault: 0 },
  { id: '3', currencyCode: 'EUR', currencyName: 'Euro',            isDefault: 0 },
  { id: '4', currencyCode: 'GBP', currencyName: 'British Pound',   isDefault: 0 },
  { id: '5', currencyCode: 'KES', currencyName: 'Kenyan Shilling', isDefault: 0 },
]

export function getCurrencies(): Promise<Currency[]> {
  return Promise.resolve(mockCurrencies)
}

export function createCurrency(input: CurrencyInput): Promise<Currency> {
  const currency: Currency = { id: String(mockCurrencies.length + 1), ...input }
  mockCurrencies.push(currency)
  return Promise.resolve(currency)
}

export function updateCurrency(id: string, input: CurrencyInput): Promise<Currency> {
  const existing = mockCurrencies.find(c => c.id === id)
  if (!existing) return Promise.reject(new Error('Currency not found'))
  Object.assign(existing, input)
  return Promise.resolve(existing)
}
