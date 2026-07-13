import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ledger, LedgerInput, createLedger, getLedgers, updateLedger } from '@/lib/api/academic/ledger'

const LEDGERS_KEY = ['ledgers']

export function useLedgers() {
  return useQuery({
    queryKey: LEDGERS_KEY,
    queryFn: () => getLedgers(),
    // Never treat the cached list as stale on its own — only refetch when a
    // mutation (create/update) explicitly invalidates this key below,
    // instead of on every remount/window focus.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useCreateLedger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LedgerInput) => createLedger(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LEDGERS_KEY }),
  })
}

export function useUpdateLedger() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LedgerInput }) => updateLedger(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LEDGERS_KEY }),
  })
}

export type { Ledger, LedgerInput }
