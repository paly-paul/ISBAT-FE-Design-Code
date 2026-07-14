import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Currency, CurrencyInput, createCurrency, getCurrencies, updateCurrency } from '@/lib/api/academic/currency'

const CURRENCIES_KEY = ['currencies']

export function useCurrencies() {
  return useQuery({
    queryKey: CURRENCIES_KEY,
    queryFn: () => getCurrencies(),
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
