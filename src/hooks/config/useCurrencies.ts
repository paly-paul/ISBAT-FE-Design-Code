import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Currency, CurrencyInput, createCurrency, getCurrencies, updateCurrency } from '@/lib/api/academic/currency'

const CURRENCIES_KEY = ['currencies']

// Fetch a single page large enough to cover the whole list — nothing in
// this codebase currently paginates the master lists client-side, so the
// hook needs the full set in one request rather than the API's default
// page=1/pageSize=10 (which would silently hide any row past the 10th).
const CURRENCIES_PAGE_SIZE = 1000

export function useCurrencies() {
  return useQuery({
    queryKey: CURRENCIES_KEY,
    queryFn: () => getCurrencies(1, CURRENCIES_PAGE_SIZE),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateCurrency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CurrencyInput) => createCurrency(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURRENCIES_KEY }),
  })
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CurrencyInput }) => updateCurrency(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURRENCIES_KEY }),
  })
}

export type { Currency, CurrencyInput }
