import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Country, CountryInput, createCountry, deleteCountry, getCountries, updateCountry } from '@/lib/api/academic/country'

const COUNTRIES_KEY = ['countries']

// Fetch a single page large enough to cover the whole list — nothing in
// this codebase currently paginates the master lists client-side, so the
// hook needs the full set in one request rather than the API's default
// page=1/pageSize=10 (which was silently hiding any row past the 10th).
const COUNTRIES_PAGE_SIZE = 1000

export function useCountries() {
  return useQuery({
    queryKey: COUNTRIES_KEY,
    queryFn: () => getCountries(1, COUNTRIES_PAGE_SIZE),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
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
