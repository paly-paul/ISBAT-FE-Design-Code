import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Country,
  CountryInput,
  CountryDropdownItemDto,
  countryFromDropdown,
  createCountry,
  deleteCountry,
  findDefaultCountry,
  getCountriesByGuids,
  getCountriesDropdown,
  updateCountry } from '@/lib/api/academic/country'

export const COUNTRIES_KEY = ['countries']

/**
 * Full countries list for Country Master (/config/country-master).
 * Calls GET /api/v1/users/countries?page=1&pageSize=1000 to preserve
 * countryCode, countryPrefix, defaultCountry, and nationality.
 */

/**
 * Lightweight dropdown list specifically for form pickers (Employee form, Refugee, Student profile, ODeL).
 * Calls GET /api/v1/users/countries/dropdown without the heavy 1000-page payload.
 */
export function useCountryDropdown(
  searchOrEnabled?: string | boolean | { search?: string; enabled?: boolean },
  enabledParam = true
) {
  let search = ''
  let enabled = true

  if (typeof searchOrEnabled === 'string') {
    search = searchOrEnabled
    enabled = enabledParam
  } else if (typeof searchOrEnabled === 'boolean') {
    enabled = searchOrEnabled
  } else if (typeof searchOrEnabled === 'object' && searchOrEnabled !== null) {
    search = searchOrEnabled.search ?? ''
    enabled = searchOrEnabled.enabled ?? true
  }

  const q = search.trim()
  return useQuery({
    queryKey: [...COUNTRIES_KEY, 'dropdown', q],
    queryFn: () => getCountriesDropdown(q),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled })
}

const NO_COUNTRIES: Country[] = []

// Only the given countries, in one request, for screens that hold a few guids
// and need their names or dial codes rather than the whole list.
export function useCountriesByGuids(guids: string[]) {
  const unique = Array.from(new Set(guids.filter(Boolean))).sort()
  const query = useQuery({
    queryKey: [...COUNTRIES_KEY, 'by-guids', unique],
    queryFn: () => getCountriesByGuids(unique),
    enabled: unique.length > 0,
    gcTime: Infinity })
  return { countries: query.data ?? NO_COUNTRIES, isLoading: query.isLoading }
}

// Every country for a form's pickers, from GET /countries/dropdown (one
// cached call, filtered in the browser by SearchSelect), in the Country shape
// the option helpers use. home = the default country (Uganda); known = the
// whole list, so a selected country's label is always available.
export function useCountriesForPicker(enabled = true) {
  const { data, isLoading } = useQuery({
    queryKey: [...COUNTRIES_KEY, 'dropdown', 'picker'],
    queryFn: () => getCountriesDropdown().then(rows => rows.map(countryFromDropdown)),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled })
  const countries = data ?? NO_COUNTRIES
  const home = useMemo(() => findDefaultCountry(countries), [countries])
  return { countries, home, known: countries, isLoading }
}

export function useCreateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CountryInput) => createCountry(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY }) })
}

export function useUpdateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CountryInput }) => updateCountry(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY }) })
}

export function useDeleteCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCountry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY }) })
}

export type { Country, CountryInput, CountryDropdownItemDto }
