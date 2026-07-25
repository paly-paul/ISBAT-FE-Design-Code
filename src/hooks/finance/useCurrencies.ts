import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Currency, CurrencyInput, createCurrency, getCurrencies, updateCurrency } from '@/lib/api/finance/currencyMaster'

const CURRENCIES_KEY = ['currencies']

// Load enough rows to cover the full currency list in one request.
const CURRENCIES_PAGE_SIZE = 1000

export function useCurrencies() {
  return useQuery({
    queryKey: CURRENCIES_KEY,
    queryFn: () => getCurrencies(1, CURRENCIES_PAGE_SIZE),
    // Keep the list cached until a mutation invalidates it.
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
