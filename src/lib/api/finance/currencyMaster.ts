import { apiGet, apiPost } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Previous mock-only shape (pre GET /api/v1/academic/currencies integration)
// — kept for reference until create/update against the real backend are
// confirmed (only GET has been confirmed so far).
// export interface Currency {
//   id: string
//   currencyCode: string
//   currencyName: string
//   isDefault: number
// }
//
// export type CurrencyInput = Omit<Currency, 'id'>
//
// const mockCurrencies: Currency[] = [
//   { id: '1', currencyCode: 'UGX', currencyName: 'Uganda Shilling', isDefault: 1 },
//   { id: '2', currencyCode: 'USD', currencyName: 'US Dollar',       isDefault: 0 },
//   { id: '3', currencyCode: 'EUR', currencyName: 'Euro',            isDefault: 0 },
//   { id: '4', currencyCode: 'GBP', currencyName: 'British Pound',   isDefault: 0 },
//   { id: '5', currencyCode: 'KES', currencyName: 'Kenyan Shilling', isDefault: 0 },
// ]
//
// export function getCurrencies(): Promise<Currency[]> {
//   return Promise.resolve(mockCurrencies)
// }
//
// export function createCurrency(input: CurrencyInput): Promise<Currency> {
//   const currency: Currency = { id: String(mockCurrencies.length + 1), ...input }
//   mockCurrencies.push(currency)
//   return Promise.resolve(currency)
// }
//
// export function updateCurrency(id: string, input: CurrencyInput): Promise<Currency> {
//   const existing = mockCurrencies.find(c => c.id === id)
//   if (!existing) return Promise.reject(new Error('Currency not found'))
//   Object.assign(existing, input)
//   return Promise.resolve(existing)
// }

// Represents a currency record returned by the finance API.
export interface Currency {
  intCurrency: number
  currencyGuid?: string
  currencyCode: string
  currencyName: string
  isDefault: number
}

// Payload used when creating or updating a currency.
export type CurrencyInput = Omit<Currency, 'intCurrency' | 'currencyGuid'>

// Response wrapper for the paginated currency list endpoint.
interface CurrencyListResponse {
  items: Currency[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Update is still handled locally in mock mode until the real endpoint is confirmed.
const mockCurrencies: Currency[] = [
  { intCurrency: 1, currencyCode: 'UGX', currencyName: 'Uganda Shilling', isDefault: 1 },
  { intCurrency: 2, currencyCode: 'USD', currencyName: 'US Dollar',       isDefault: 0 },
  { intCurrency: 3, currencyCode: 'EUR', currencyName: 'Euro',            isDefault: 0 },
  { intCurrency: 4, currencyCode: 'GBP', currencyName: 'British Pound',   isDefault: 0 },
  { intCurrency: 5, currencyCode: 'KES', currencyName: 'Kenyan Shilling', isDefault: 0 },
]
let mockCurrencySeq = mockCurrencies.length + 1

// Fetch the currency list, using mock data when the mock auth flag is enabled.
export function getCurrencies(page = 1, pageSize = 10): Promise<Currency[]> {
  if (MOCK_AUTH) return Promise.resolve(mockCurrencies)
  return apiGet<CurrencyListResponse | null>(`/api/v1/finance/currencies?page=${page}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

export function createCurrency(input: CurrencyInput): Promise<Currency> {
  if (MOCK_AUTH) {
    const currency: Currency = { intCurrency: mockCurrencySeq++, ...input }
    mockCurrencies.push(currency)
    return Promise.resolve(currency)
  }
  return apiPost<Currency>('/api/v1/finance/currencies', input)
}

export function updateCurrency(id: string, input: CurrencyInput): Promise<Currency> {
  const existing = mockCurrencies.find(c => String(c.intCurrency) === id)
  if (!existing) return Promise.reject(new Error('Currency not found'))
  Object.assign(existing, input)
  return Promise.resolve(existing)
}
