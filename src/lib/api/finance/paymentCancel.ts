import { apiPost, post } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Cancel payment (2026-11-26): finance cancels a payment instead of deleting
// it. The row stays in every list, history and the receipt register, marked
// with the fields below, and is never counted as paid. Its receipt number is
// burned and never reused. Docs: api/finance-service/*/post-*-cancel.md.
export interface CancelledFields {
  isCancelled?: boolean
  cancelReason?: string | null
  cancelledByName?: string | null
  cancelledDate?: string | null
}

// Same rule on every cancel route: required, trimmed, at most 200 characters.
export const CANCEL_REASON_MAX = 200

// The two cancel/edit refusals the backend marks as retryable (2026-11-27
// handoff): "The usage of this payment could not be verified. Please try
// again." (other payment) and "The student's semesters could not be verified.
// Please try again." (NCHE / Guild). Nothing was changed, so the same request
// can simply be sent again; every other refusal is final.
export function isRetryableVerifyError(message: string | null | undefined): boolean {
  return !!message && /could not be verified\.\s*Please try again\.?\s*$/i.test(message.trim())
}

// PaymentHistoryCategory, as tagged on every payment-history and receipt
// register row (get-payment-history.md, get-payment-receipts.md):
// 1 Tuition, 2 Other, 3 NCHE, 4 Guild, 5 Advance deposit. Each row's
// paymentGuid is the id within that category's own table, which is the id
// its cancel route takes. Advance adjustments aren't in these lists; they
// have their own cancel (cancelAdvanceAdjustment below).
export type CancellableCategory = 1 | 2 | 3 | 4 | 5

export function isCancellableCategory(category: number): category is CancellableCategory {
  return category >= 1 && category <= 5
}

const CANCEL_PATH: Record<CancellableCategory, (guid: string) => string> = {
  1: g => `/api/v1/finance/payment-console/payments/${g}/cancel`,
  2: g => `/api/v1/finance/other-payment/${g}/cancel`,
  3: g => `/api/v1/finance/nche/payment-nche/${g}/cancel`,
  4: g => `/api/v1/finance/guild/payment-guild/${g}/cancel`,
  5: g => `/api/v1/finance/advance-payment/${g}/cancel`,
}

// Refusals (already cancelled, resit exam started, advance already spent,
// refund exists, …) come back as 400 with a plain message; the caller shows
// it as-is. NCHE and Guild answer with a bare `true` instead of the usual
// { success, data } envelope, so they go through the plain post().
export async function cancelPayment(category: CancellableCategory, guid: string, reason: string): Promise<void> {
  if (MOCK_AUTH) return
  const path = CANCEL_PATH[category](encodeURIComponent(guid))
  const body = { reason: reason.trim() }
  if (category === 3 || category === 4) await post<boolean>(path, body)
  else await apiPost<boolean>(path, body)
}

// post-adjustment-cancel.md: undoes one draw from an advance deposit.
export async function cancelAdvanceAdjustment(adjustmentGuid: string, reason: string): Promise<void> {
  if (MOCK_AUTH) return
  await apiPost<boolean>(`/api/v1/finance/advance-payment/adjustments/${encodeURIComponent(adjustmentGuid)}/cancel`, { reason: reason.trim() })
}
