import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Country, CountryInput, createCountry, deleteCountry, getCountries, updateCountry } from '@/lib/api/academic/country'

const COUNTRIES_KEY = ['countries']

export function useCountries() {
  return useQuery({
    queryKey: COUNTRIES_KEY,
    queryFn: () => getCountries(),
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
