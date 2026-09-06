import { apiGet, apiPost } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed via post-payment-refund.md / get-payment-refunds.md (repo root).
// Refunds are issued against a single **tuition** payment — not a ledger
// picked independently — and reverse that payment's one allocation line.
// "Current limitation: only single-ledger payments can be refunded" (the doc's
// own wording): a payment spread across several ledgers by the allocation
// engine 400s with "Multi-ledger refunds are not yet supported." There's no
// client-side way to know a payment's line count in advance (Payment
// Console's own PaymentHistoryEntry carries no allocation breakdown), so this
// isn't pre-filtered — the page lets any tuition payment be picked and
// surfaces that rejection from the server if it happens.
//
// Currency is NOT sent in the request body — the refund is always issued in
// the original payment's own currency, inferred server-side.
export interface CreatePaymentRefundInput {
  amount: number
  refundDate: string
  remarks: string | null
}

export interface RefundResultDto {
  refundGuid: string
  paymentGuid: string
  paymentCode: string
  // Echoes the ORIGINAL payment's own receipt — no new receipt is claimed
  // for a refund (per the doc).
  receipt: string
  remainingRefundableBalance: number
}

export function createPaymentRefund(paymentGuid: string, input: CreatePaymentRefundInput): Promise<RefundResultDto> {
  if (MOCK_AUTH) {
    return Promise.resolve({
      refundGuid: `mock-refund-${Date.now()}`,
      paymentGuid,
      paymentCode: 'PAY-MOCK-0000',
      receipt: `RCP-MOCK-${Date.now()}`,
      remainingRefundableBalance: 0,
    })
  }
  return apiPost<RefundResultDto>(`/api/v1/finance/payment-console/payments/${paymentGuid}/refund`, input)
}

// Confirmed via get-payment-refunds.md — the cross-payment refund ledger
// (GET .../payment-refunds, paged, filterable by studentGuid/applicationGuid).
// `ledger` is the allocation line the refund reversed; since refunds are only
// ever issued against a single-line payment (see CreatePaymentRefundInput's
// own comment), this is always populated for a row that made it through the
// create endpoint above — never the null-on-NCHE/Guild shape other
// "outstanding" DTOs in this module carry.
export interface PaymentRefundDto {
  refundGuid: string
  payment: { paymentGuid: string; paymentCode: string }
  applicationGuid: string
  studentGuid: string | null
  amount: number
  currency: { currencyGuid: string; currencyCode: string; currencyName: string }
  refundDate: string
  ledger: { ledgerGuid: string; ledgerCode: string; ledgerName: string }
  remarks: string | null
}

export interface PaymentRefundListResponse {
  items: PaymentRefundDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface PaymentRefundListParams {
  page?: number
  pageSize?: number
  studentGuid?: string | null
  applicationGuid?: string | null
}

export function getPaymentRefunds(params: PaymentRefundListParams): Promise<PaymentRefundListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber: page, pageSize })
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (params.studentGuid) qs.set('studentGuid', params.studentGuid)
  if (params.applicationGuid) qs.set('applicationGuid', params.applicationGuid)
  return apiGet<PaymentRefundListResponse | null>(`/api/v1/finance/payment-refunds?${qs.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: page, pageSize })
}
