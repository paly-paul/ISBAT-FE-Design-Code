import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPaymentRefund,
  getPaymentRefunds,
  CreatePaymentRefundInput,
  PaymentRefundListParams,
} from '@/lib/api/finance/paymentRefund'

const PAYMENT_REFUND_KEY = ['payment-refunds']

export function usePaymentRefundsList(params: PaymentRefundListParams, enabled: boolean) {
  return useQuery({
    queryKey: [...PAYMENT_REFUND_KEY, 'list', params],
    queryFn: () => getPaymentRefunds(params),
    enabled,
  })
}

export function useCreatePaymentRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentGuid, input }: { paymentGuid: string; input: CreatePaymentRefundInput }) =>
      createPaymentRefund(paymentGuid, input),
    onSuccess: () => {
      // This page's own refund history list is now stale — refetch it.
      queryClient.invalidateQueries({ queryKey: PAYMENT_REFUND_KEY })
      // The refunded payment becomes permanently uneditable (per the flow
      // doc) and its refundable balance has moved — Payment Console's own
      // payment-history query (this page's source for the payment picker)
      // needs refetching too, even though it lives under a different key
      // family (['payment-console', …]).
      queryClient.invalidateQueries({ queryKey: ['payment-console', 'payment-history'] })
    },
  })
}

export type { CreatePaymentRefundInput, PaymentRefundDto, PaymentRefundListResponse, PaymentRefundListParams, RefundResultDto } from '@/lib/api/finance/paymentRefund'
