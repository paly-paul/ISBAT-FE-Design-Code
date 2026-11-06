import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Country, CountryInput, CountryDropdownItemDto, createCountry, deleteCountry, findDefaultCountry, getCountries, getCountriesByGuids, getCountriesDropdown, getCountriesPaged, updateCountry } from '@/lib/api/academic/country'
import { getNextPageParam } from '@/lib/pagination'

const COUNTRIES_KEY = ['countries']

// Load enough rows to cover the full country list in one request.
const COUNTRIES_PAGE_SIZE = 1000
// One search page, for looking up specific countries by name.
const COUNTRY_LOOKUP_PAGE_SIZE = 20
const HOME_COUNTRY_NAME = 'Uganda'

export function useCountries(enabled = true) {
  return useQuery({
    queryKey: COUNTRIES_KEY,
    queryFn: async () => {
      const dropdownItems = await getCountriesDropdown()
      return dropdownItems.map(d => ({
        countryGuid: d.countryGuid,
        countryName: d.countryName,
        countryCode: d.countryPrefix ? d.countryPrefix.replace(/^\+/, '') : '',
        countryPrefix: d.countryPrefix ?? '',
        nationality: d.nationality ?? '',
        defaultCountry: d.isDefault ? 1 : 0,
      })) as Country[]
    },
    // Keep the list cached until a mutation invalidates it.
    staleTime: Infinity,
    gcTime: Infinity,
    enabled,
  })
}

export function useCountryDropdown(search = '', enabled = true) {
  const q = search.trim()
  return useQuery({
    queryKey: [...COUNTRIES_KEY, 'dropdown', q],
    queryFn: () => getCountriesDropdown(q),
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

const NO_COUNTRIES: Country[] = []

// Only the given countries, in one request, for screens that hold a few guids
// and need their names or dial codes rather than the whole list.
export function useCountriesByGuids(guids: string[]) {
  const unique = Array.from(new Set(guids.filter(Boolean))).sort()
  const query = useQuery({
    queryKey: [...COUNTRIES_KEY, 'by-guids', unique],
    queryFn: () => getCountriesByGuids(unique),
    enabled: unique.length > 0,
    gcTime: Infinity,
  })
  return { countries: query.data ?? NO_COUNTRIES, isLoading: query.isLoading }
}

// For the country pickers on the enquiry forms, without loading the full list:
// the home country to default to, plus every country seen so far (home and the
// pickers' loaded pages). A selection made in the picker comes from one of
// those, so its label stays available after the picker's search moves on.
export function useKnownCountries(pageCountries: Country[]) {
  // There's no guid to ask for yet, since the home country is what's being found.
  const { data: homeMatches } = useQuery({
    queryKey: [...COUNTRIES_KEY, 'by-name', HOME_COUNTRY_NAME],
    queryFn: () => getCountriesPaged(1, COUNTRY_LOOKUP_PAGE_SIZE, HOME_COUNTRY_NAME),
    gcTime: Infinity,
  })
  const home = findDefaultCountry(homeMatches?.items ?? NO_COUNTRIES)
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
