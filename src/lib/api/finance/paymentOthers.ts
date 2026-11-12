import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed via get-payment-others.md (repo root) — the dedicated "other fee"
// payment ledger (GET /api/v1/finance/other-payment, paged, filterable by
// studentGuid/applicationGuid — moved here from /payment-others on
// 2026-09-05, per the doc's changelog). Distinct from paymentConsole.ts's own PaymentOtherResult
// (the POST .../payment-other create response) and PaymentHistoryEntry (the
// cross-category .../payment-history/{applicationGuid} list Payment
// Console's own left-column history card used to show unfiltered — every
// category, not just Other — whenever the Other Payment tab was active).
// This is what that card now calls instead once that tab is active, so it
// only ever lists this application's Other-category payments.
export interface PaymentOtherDto {
  paymentOtherGuid: string
  paymentCode: string
  applicationGuid: string
  studentGuid: string | null
  amount: number
  currency: { currencyGuid: string; currencyCode: string; currencyName: string }
  // Null when funded from an advance deposit (see `advance` below) — no new
  // receipt is issued in that case, per the doc.
  receipt: string | null
  remarks: string | null
  payDate: string
  payType: number
  intakeGuid: string | null
  bank: { bankGuid: string; shortCode: string; bankName: string } | null
  // PaymentAdvanceType: 1 means this payment drew down an advance deposit
  // (get-payment-advances.md) rather than fresh cash — such rows can't be
  // edited directly (PUT /api/v1/finance/other-payment/{guid} rejects them).
  advance: number
  // One entry per ledger the payment covers (2026-09-10: the single `ledger`
  // ref was replaced by this array). Always at least one; `amount` above is
  // the sum of these lines.
  ledgers: { ledger: { ledgerGuid: string; ledgerCode: string; ledgerName: string } | null; amount: number }[]
  // Raw PaymentGroupCategory byte (1 Tuition/2 Other/3 Nche/4 Guild) — only
  // set when this row was created as part of a unified payment. Nullable;
  // every row from THIS endpoint is Other regardless of whether it's set.
  paymentCategory: number | null
}

export interface PaymentOtherListResponse {
  items: PaymentOtherDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface PaymentOtherListParams {
  page?: number
  pageSize?: number
  studentGuid?: string | null
  applicationGuid?: string | null
}

export function getPaymentOthers(params: PaymentOtherListParams): Promise<PaymentOtherListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber: page, pageSize })
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (params.studentGuid) qs.set('studentGuid', params.studentGuid)
  if (params.applicationGuid) qs.set('applicationGuid', params.applicationGuid)
  return apiGet<PaymentOtherListResponse | null>(`/api/v1/finance/other-payment?${qs.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: page, pageSize })
}

// Confirmed via get-resit-fee.md (repo root) — previews the resit fee the
// student owes so the Other Payment tab can auto-fill and lock the amount
// once the resit ledger is picked (legacy txtAmount.Enabled = false). Always
// in UGX; 0 when nothing is unpaid or there's no active resit config. The
// POST re-verifies the amount server-side, so this is a preview only.
// 404 (application not found) / 400 (no intake, or Assessment's fee call
// failed) surface as thrown errors with the backend message.
//
// Besides amount it lists the unpaid units the student applied to resit and a
// per-semester breakdown. Each semester's fee is capped (250,000), so unit
// amounts can add up to more than amount: group units under their semester
// and show semesters[].amount; never sum unit amounts. amount always equals
// the sum of semesters[].amount. "Applied to resit", not "has an exam date".
export interface ResitFeeUnit {
  courseUnitGuid: string
  unitName: string
  unitCode: string
  semesterGuid: string | null   // null when the semester couldn't be resolved
  feeType: 'UE' | 'IA' | string // UE = resit exam, IA = coursework only; a unit applied for both is charged as UE
  amount: number                // before the per-semester cap
}

export interface ResitFeeSemester {
  semesterGuid: string | null
  semesterName: string
  subtotal: number              // the semester's units added up
  amount: number                // subtotal capped at 250,000
}

export interface ResitFee {
  amount: number                // total owed, UGX: the locked amount field
  units: ResitFeeUnit[]
  semesters: ResitFeeSemester[]
}

const MOCK_RESIT_FEE: ResitFee = {
  amount: 400000,
  units: [
    { courseUnitGuid: 'cu-1', unitName: 'Artificial Intelligence an Overview', unitCode: 'BNCS2117', semesterGuid: 'sem-1', feeType: 'UE', amount: 150000 },
    { courseUnitGuid: 'cu-2', unitName: 'Database Systems', unitCode: 'BNCS2118', semesterGuid: 'sem-1', feeType: 'UE', amount: 150000 },
    { courseUnitGuid: 'cu-3', unitName: 'Web Programming', unitCode: 'BNCS2201', semesterGuid: 'sem-2', feeType: 'IA', amount: 150000 },
  ],
  semesters: [
    { semesterGuid: 'sem-1', semesterName: 'Year Two - Semester One', subtotal: 300000, amount: 250000 },
    { semesterGuid: 'sem-2', semesterName: 'Year Two - Semester Two', subtotal: 150000, amount: 150000 },
  ],
}

export function getResitFee(studentGuid: string, applicationGuid: string): Promise<ResitFee> {
  if (MOCK_AUTH) return Promise.resolve(MOCK_RESIT_FEE)
  const qs = new URLSearchParams({ studentGuid, applicationGuid })
  return apiGet<Partial<ResitFee> | null>(`/api/v1/finance/other-payment/resit-fee?${qs.toString()}`)
    .then(data => ({ amount: data?.amount ?? 0, units: data?.units ?? [], semesters: data?.semesters ?? [] }))
}
