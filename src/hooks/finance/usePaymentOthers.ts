import { useQuery } from '@tanstack/react-query'
import { getPaymentOthers, getResitFee, PaymentOtherListParams } from '@/lib/api/finance/paymentOthers'

// Exported (not just used internally) so useCreatePaymentOther in
// usePaymentConsole.ts can invalidate this list too — a newly-added Other
// payment there needs this query to refetch, even though it's a separate
// key family from that file's own ['payment-console', …] keys.
export const PAYMENT_OTHERS_KEY = ['payment-others']

export function usePaymentOthersList(params: PaymentOtherListParams, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_OTHERS_KEY, 'list', params],
    queryFn: () => getPaymentOthers(params),
    enabled,
  })
}

// Lives under PAYMENT_OTHERS_KEY on purpose — useCreatePaymentOther already
// invalidates that whole family, so a just-paid resit fee refetches (and
// drops to 0) without any extra wiring. retry: false — a 400 here ("no
// intake assigned") won't fix itself on retry, same reasoning as
// usePayableLedgers.
export function useResitFee(studentGuid: string | null, applicationGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_OTHERS_KEY, 'resit-fee', studentGuid, applicationGuid],
    queryFn: () => getResitFee(studentGuid as string, applicationGuid as string),
    enabled: enabled && !!studentGuid && !!applicationGuid,
    retry: false,
  })
}

export type { PaymentOtherDto, PaymentOtherListResponse, PaymentOtherListParams } from '@/lib/api/finance/paymentOthers'
