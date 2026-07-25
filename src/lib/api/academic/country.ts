import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Older mock shape kept for reference.
// export interface Country {
//   id: string
//   countryCode: string
//   countryName: string
//   nationality: string
//   countryPrefix: string
//   defaultCountry: number
// }
//
// export type CountryInput = Omit<Country, 'id'>
//
// const mockCountries: Country[] = [
//   { id: '1', countryCode: 'UGA', countryName: 'Uganda',        nationality: 'Ugandan',        defaultCountry: 1, countryPrefix: '+256' },
//   { id: '2', countryCode: 'KEN', countryName: 'Kenya',          nationality: 'Kenyan',         defaultCountry: 0, countryPrefix: '+254' },
//   { id: '3', countryCode: 'TZA', countryName: 'Tanzania',       nationality: 'Tanzanian',      defaultCountry: 0, countryPrefix: '+255' },
//   { id: '4', countryCode: 'RWA', countryName: 'Rwanda',         nationality: 'Rwandan',        defaultCountry: 0, countryPrefix: '+250' },
//   { id: '5', countryCode: 'SSD', countryName: 'South Sudan',    nationality: 'South Sudanese', defaultCountry: 0, countryPrefix: '+211' },
//   { id: '6', countryCode: 'COD', countryName: 'DR Congo',       nationality: 'Congolese',      defaultCountry: 0, countryPrefix: '+243' },
//   { id: '7', countryCode: 'GBR', countryName: 'United Kingdom', nationality: 'British',        defaultCountry: 0, countryPrefix: '+44'  },
//   { id: '8', countryCode: 'IND', countryName: 'India',          nationality: 'Indian',         defaultCountry: 0, countryPrefix: '+91'  },
// ]
//
// export function getCountries(): Promise<Country[]> {
//   return Promise.resolve(mockCountries)
// }
//
// export function createCountry(input: CountryInput): Promise<Country> {
//   const country: Country = { id: String(mockCountries.length + 1), ...input }
//   mockCountries.push(country)
//   return Promise.resolve(country)
// }
//
// export function updateCountry(id: string, input: CountryInput): Promise<Country> {
//   const existing = mockCountries.find(c => c.id === id)
//   if (!existing) return Promise.reject(new Error('Country not found'))
//   Object.assign(existing, input)
//   return Promise.resolve(existing)
// }

// Current API shape for countries.
export interface Country {
  intCountryCode: number
  countryCode: string
  countryName: string
  nationality: string
  defaultCountry: number
  countryPrefix: string
}

export type CountryInput = Omit<Country, 'intCountryCode'>

interface CountryListResponse {
  items: Country[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// This in-memory list is used only in mock mode.
const mockCountries: Country[] = [
  { intCountryCode: 1, countryCode: 'UGA', countryName: 'Uganda',        nationality: 'Ugandan',        defaultCountry: 1, countryPrefix: '+256' },
  { intCountryCode: 2, countryCode: 'KEN', countryName: 'Kenya',          nationality: 'Kenyan',         defaultCountry: 0, countryPrefix: '+254' },
  { intCountryCode: 3, countryCode: 'TZA', countryName: 'Tanzania',       nationality: 'Tanzanian',      defaultCountry: 0, countryPrefix: '+255' },
  { intCountryCode: 4, countryCode: 'RWA', countryName: 'Rwanda',         nationality: 'Rwandan',        defaultCountry: 0, countryPrefix: '+250' },
  { intCountryCode: 5, countryCode: 'SSD', countryName: 'South Sudan',    nationality: 'South Sudanese', defaultCountry: 0, countryPrefix: '+211' },
  { intCountryCode: 6, countryCode: 'COD', countryName: 'DR Congo',       nationality: 'Congolese',      defaultCountry: 0, countryPrefix: '+243' },
  { intCountryCode: 7, countryCode: 'GBR', countryName: 'United Kingdom', nationality: 'British',        defaultCountry: 0, countryPrefix: '+44'  },
  { intCountryCode: 8, countryCode: 'IND', countryName: 'India',          nationality: 'Indian',         defaultCountry: 0, countryPrefix: '+91'  },
]

export function getCountries(page = 1, pageSize = 10): Promise<Country[]> {
  if (MOCK_AUTH) return Promise.resolve(mockCountries)
  return apiGet<CountryListResponse | null>(`/api/v1/users/countries?page=${page}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

// Older mock create helper kept for reference.
// export function createCountry(input: CountryInput): Promise<Country> {
//   const country: Country = { intCountryCode: mockCountries.length + 1, ...input }
//   mockCountries.push(country)
//   return Promise.resolve(country)
// }

export function createCountry(input: CountryInput): Promise<Country> {
  if (MOCK_AUTH) {
    const country: Country = { intCountryCode: mockCountries.length + 1, ...input }
    mockCountries.push(country)
    return Promise.resolve(country)
  }
  return apiPost<Country>('/api/v1/users/countries', input)
}

// Older mock update helper kept for reference.
// export function updateCountry(id: string, input: CountryInput): Promise<Country> {
//   const existing = mockCountries.find(c => String(c.intCountryCode) === id)
//   if (!existing) return Promise.reject(new Error('Country not found'))
//   Object.assign(existing, input)
//   return Promise.resolve(existing)
// }

export function updateCountry(id: string, input: CountryInput): Promise<Country> {
  if (MOCK_AUTH) {
    const existing = mockCountries.find(c => String(c.intCountryCode) === id)
    if (!existing) return Promise.reject(new Error('Country not found'))
    Object.assign(existing, input)
    return Promise.resolve(existing)
  }
  return apiPut<Country>(`/api/v1/users/countries/${id}`, input)
}

// DELETE /api/v1/users/countries/{id} — soft-delete (data: true on success).
export function deleteCountry(id: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockCountries.findIndex(c => String(c.intCountryCode) === id)
    if (index === -1) return Promise.reject(new Error('Country not found'))
    mockCountries.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/users/countries/${id}`)
}
