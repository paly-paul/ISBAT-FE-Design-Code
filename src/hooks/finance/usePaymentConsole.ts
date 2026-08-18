import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPayment,
  getOutstandingLedgers,
  getPayableLedgers,
  getPaymentHistory,
  getPaymentHistoryList,
  getStudentProfile,
  searchStudents,
  PaymentInput,
  PayableLedgersParams,
} from '@/lib/api/finance/paymentConsole'

const PAYMENT_CONSOLE_KEY = ['payment-console']

export function useSearchStudents(searchTerm: string, pageNumber: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_CONSOLE_KEY, 'search', searchTerm, pageNumber, pageSize],
    queryFn: () => searchStudents(searchTerm, pageNumber, pageSize),
    enabled,
  })
}

export function useStudentProfile(applicationGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_CONSOLE_KEY, 'profile', applicationGuid],
    queryFn: () => getStudentProfile(applicationGuid as string),
    enabled: enabled && !!applicationGuid,
  })
}

// studentGuid is optional (see getOutstandingLedgers) — pass it once the
// caller has one; most callers today don't (the payment console only ever
// resolves an applicationGuid via search, never a separate studentGuid).
export function useOutstandingLedgers(applicationGuid: string | null, enabled: boolean, studentGuid?: string | null) {
  return useQuery({
    queryKey: [...PAYMENT_CONSOLE_KEY, 'outstanding-ledgers', applicationGuid, studentGuid],
    queryFn: () => getOutstandingLedgers(applicationGuid as string, studentGuid),
    enabled: enabled && !!applicationGuid,
  })
}

export function usePaymentHistory(applicationGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_CONSOLE_KEY, 'payment-history', applicationGuid],
    queryFn: () => getPaymentHistory(applicationGuid as string),
    enabled: enabled && !!applicationGuid,
  })
}

// Cross-application ledger (GET .../payment-history, no guid) — genuinely
// distinct from usePaymentHistory(applicationGuid, enabled) above, see the
// getPaymentHistoryList() comment in lib/api/finance/paymentConsole.ts.
// Backs the standalone /finance/payment-history page's server-side pagination
// (the real totalCount runs into six figures — fetch-all-client-side, the old
// mock page's approach, isn't viable here).
export function usePaymentHistoryList(pageNumber: number, pageSize: number) {
  return useQuery({
    queryKey: [...PAYMENT_CONSOLE_KEY, 'payment-history-list', pageNumber, pageSize],
    queryFn: () => getPaymentHistoryList(pageNumber, pageSize),
  })
}

// params is expected to already be debounced by the caller (Step 3's Amount/
// Currency/Date fields change on every keystroke — this hook itself doesn't
// debounce, it just fetches whatever params it's given).
export function usePayableLedgers(params: PayableLedgersParams | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_CONSOLE_KEY, 'payable-ledgers', params],
    queryFn: () => getPayableLedgers(params as PayableLedgersParams),
    enabled: enabled && !!params,
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PaymentInput) => createPayment(input),
    // Step 2's outstanding-ledgers/payment-history for this application are
    // now stale the moment the payment lands — refetch both.
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: [...PAYMENT_CONSOLE_KEY, 'outstanding-ledgers', input.applicationGuid] })
      queryClient.invalidateQueries({ queryKey: [...PAYMENT_CONSOLE_KEY, 'payment-history', input.applicationGuid] })
    },
  })
}

export type { ApplicationSummary, OutstandingLedger, PayableLedgerLine, PayableLedgersParams, PaymentHistoryEntry, PaymentHistoryListEntry, PaymentInput, PaymentResult, StudentProfile } from '@/lib/api/finance/paymentConsole'
export { PAYMENT_CATEGORY_LABELS, PAY_TYPE_LABELS } from '@/lib/api/finance/paymentConsole'
