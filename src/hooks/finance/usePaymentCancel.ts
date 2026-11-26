import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelAdvanceAdjustment, cancelPayment, CancellableCategory } from '@/lib/api/finance/paymentCancel'
import { useStrictMenuPermission } from '@/hooks/users/usePagePermissions'
import { PAYMENT_OTHERS_KEY } from './usePaymentOthers'

// A cancel re-allocates the student's later payments and changes balances,
// advance funds and NCHE/Guild semester status, so every finance view that
// could show this student's money is refetched (only the ones on screen
// actually refetch; the rest are just marked stale).
function invalidateAfterCancel(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of [
    ['payment-console'], ['payments'], PAYMENT_OTHERS_KEY, ['nche-payment'], ['guild-payment'],
    ['advance-deposits'], ['advance-balance'], ['adjustments-by-advance'], ['adjustment-ledger-breakdown'],
  ]) {
    queryClient.invalidateQueries({ queryKey: key })
  }
}

export function useCancelPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ category, guid, reason }: { category: CancellableCategory; guid: string; reason: string }) =>
      cancelPayment(category, guid, reason),
    onSuccess: () => invalidateAfterCancel(queryClient),
  })
}

export function useCancelAdvanceAdjustment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ adjustmentGuid, reason }: { adjustmentGuid: string; reason: string }) =>
      cancelAdvanceAdjustment(adjustmentGuid, reason),
    onSuccess: () => invalidateAfterCancel(queryClient),
  })
}

// Which payment categories the user may cancel. Each permission lives on the
// menu page that owns that payment type:
//   finance.paymentconsole.cancel   → Payment Console    (tuition, other)
//   finance.ncheguildpayment.cancel → NCHE & Guild       (NCHE, guild)
//   finance.advancedpayments.cancel → Advanced Payments  (deposits, adjustments)
// Strict: a page without an explicit `cancel` grant hides the button, rather
// than falling back to `edit` the way usePagePermissions does.
export function useCancelPermissions() {
  const consoleCancel = useStrictMenuPermission('/finance/payment-console', 'cancel')
  const ncheGuildCancel = useStrictMenuPermission('/finance/nche-guild-payment', 'cancel')
  const advanceCancel = useStrictMenuPermission('/finance/advanced-payments', 'cancel')
  return {
    advance: advanceCancel,
    canCancel(category: number): boolean {
      if (category === 1 || category === 2) return consoleCancel
      if (category === 3 || category === 4) return ncheGuildCancel
      if (category === 5) return advanceCancel
      return false
    },
  }
}
