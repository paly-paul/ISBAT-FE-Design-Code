import { useQuery } from '@tanstack/react-query'
import { getGrievanceFee, getPaymentOthers, getResitFee, PaymentOtherListParams } from '@/lib/api/finance/paymentOthers'

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
// drops to 0) without any extra wiring. A 400 here is typically "No current
// academic intake is configured." (an admin must set it in Academic).
export function useResitFee(studentGuid: string | null, applicationGuid: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_OTHERS_KEY, 'resit-fee', studentGuid, applicationGuid],
    queryFn: () => getResitFee(studentGuid as string, applicationGuid as string),
    enabled: enabled && !!studentGuid && !!applicationGuid,
  })
}

// The flat grievance fee per unit — the same for every student, so one
// cached value; fetched only once a grievance ledger row exists.
export function useGrievanceFee(enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_OTHERS_KEY, 'grievance-fee'],
    queryFn: getGrievanceFee,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export type { GrievanceFee } from '@/lib/api/finance/paymentOthers'
export type { PaymentOtherDto, PaymentOtherListResponse, PaymentOtherListParams, ResitFee, ResitFeeUnit, ResitFeeSemester } from '@/lib/api/finance/paymentOthers'
