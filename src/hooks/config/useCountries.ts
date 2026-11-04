import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueries, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { Country, CountryInput, CountryListResponse, createCountry, deleteCountry, findDefaultCountry, getCountries, getCountriesPaged, updateCountry } from '@/lib/api/academic/country'
import { getNextPageParam } from '@/lib/pagination'

const COUNTRIES_KEY = ['countries']

// Load enough rows to cover the full country list in one request.
const COUNTRIES_PAGE_SIZE = 1000
// One search page, for looking up specific countries by name.
const COUNTRY_LOOKUP_PAGE_SIZE = 20
export const HOME_COUNTRY_NAME = 'Uganda'

export function useCountries(enabled = true) {
  return useQuery({
    queryKey: COUNTRIES_KEY,
    queryFn: () => getCountries(1, COUNTRIES_PAGE_SIZE),
    // Keep the list cached until a mutation invalidates it.
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  })
}

export function useSearchCountriesInfinite(search: string, pageSize: number, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: [...COUNTRIES_KEY, 'search-infinite', search, pageSize],
    queryFn: ({ pageParam }) => getCountriesPaged(pageParam, pageSize, search),
    initialPageParam: 1,
    getNextPageParam,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

function combineCountryLookups(results: UseQueryResult<CountryListResponse>[]) {
  return {
    countries: results.flatMap(r => r.data?.items ?? []),
    isLoading: results.some(r => r.isLoading),
  }
}

// Only the named countries, one small search per distinct name (cached), for
// screens that need a few countries rather than the whole list. A search can
// also match similar names, so callers should pick their row by guid.
export function useCountryLookup(names: string[]) {
  const unique = Array.from(new Set(names.filter(Boolean)))
  return useQueries({
    queries: unique.map(name => ({
      queryKey: [...COUNTRIES_KEY, 'by-name', name],
      queryFn: () => getCountriesPaged(1, COUNTRY_LOOKUP_PAGE_SIZE, name),
      gcTime: Infinity,
    })),
    combine: combineCountryLookups,
  })
}

export function useCountriesByName(names: string[]): Country[] {
  return useCountryLookup(names).countries
}

// For the country pickers on the enquiry forms, without loading the full list:
// the home country to default to, plus every country seen so far (home and the
// pickers' loaded pages). A selection always comes from one of those, so its
// label stays available after the picker's search moves on.
export function useKnownCountries(pageCountries: Country[]) {
  const homeMatches = useCountriesByName([HOME_COUNTRY_NAME])
  const home = findDefaultCountry(homeMatches)
  const [seen, setSeen] = useState<Country[]>([])
  useEffect(() => {
    setSeen(prev => {
      const have = new Set(prev.map(c => c.countryGuid))
      const added = pageCountries.filter(c => !have.has(c.countryGuid))
      return added.length ? [...prev, ...added] : prev
    })
  }, [pageCountries])
  const known = useMemo(() => {
    if (!home || seen.some(c => c.countryGuid === home.countryGuid)) return seen
    return [home, ...seen]
  }, [home, seen])
  return { home, known }
}

export function useCreateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CountryInput) => createCountry(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY }),
  })
}

export function useUpdateCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CountryInput }) => updateCountry(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY }),
  })
}

export function useDeleteCountry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCountry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COUNTRIES_KEY }),
  })
}

export type { Country, CountryInput }
