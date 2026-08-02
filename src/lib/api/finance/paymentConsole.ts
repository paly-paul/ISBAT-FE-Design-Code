import { apiGet, apiPost, AuthError } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Read-side of the Payment Console spec (Payment-Console/*.bru at repo
// root) — search/profile/ledgers/history only. Create/Update/Refund/
// Advance-Deposit endpoints are documented in that folder too but
// intentionally not wired here yet; /finance/payment-console's "Record
// Payment" step still fabricates its receipt locally.

// Confirmed via SearchStudents.bru — keyed by applicationGuid/appRefNo, the
// same identity model as /admission/applicants' ApplicationListItem. There
// is no separate "student number" concept anywhere in this API.
export interface ApplicationSummary {
  applicationGuid: string
  appRefNo: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  emailId: string | null
  programGuid: string | null
  action: number | null
}

interface ApplicationSummaryListResponse {
  items: ApplicationSummary[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Confirmed via GetStudentProfile.bru. The docs mention the response also
// carries "any active discount assignments" but give no field name/shape
// for it — omitted here rather than guessing; add it once a real sample
// response confirms the shape.
export interface StudentProfile {
  applicationGuid: string
  appRefNo: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  emailId: string | null
  intakeCode: string | null
  yearCode: string | null
  intakeGuid: string | null
  campusGuid: string | null
  programGuid: string | null
  semesterGuid: string | null
  feeHdGuid: string | null
  batchGuid: string | null
  refugee: number | null
  refugeeId: string | null
  studCategory: number | null
  gender: number | null
  action: number | null
  universityEmail: string | null
}

// Confirmed via GetOutstandingLedgers.bru — tuition-only ledger lines for
// the student's current programme/semester. Unlike the old mock's flat
// Admission/Registration/Tuition/NCHE/Guild list, this endpoint has no
// "priority" or fee-category concept at all — GetAllOutstandingLedgers
// (not wired here) is what covers the other/NCHE/guild categories.
export interface OutstandingLedger {
  intLedger: number
  semesterGuid: string | null
  ledgerName: string
  ledgerNum: string | null
  intCurrency: number
  currencyName: string
  ledgerAmount: number
  paidAmount: number
  outstanding: number
}

// Confirmed via GetPaymentHistory.bru — category/payType are documented
// with explicit int↔label mappings right in the spec (unlike most other
// int-enum fields in this codebase), so labelling them client-side here is
// safe, not a guess.
export interface PaymentHistoryEntry {
  paymentGuid: string
  category: number
  paymentCode: string
  payDate: string
  amount: number
  intCurrency: number
  currencyName: string
  receipt: string | null
  intReceipt: number | null
  bookCode: string | null
  payType: number
}

// Confirmed via GetPayableLedgers.bru — given a tuition amount + currency +
// date, the backend returns how it would actually be allocated (discount
// and rounding lines included, flagged explicitly rather than needing to
// be inferred). intCurrency here, not currencyGuid — a different currency
// key from CreatePayment's own currencyGuid below; both are sourced from
// the same useFinanceCurrencies() record (it carries both fields), so
// don't cross-reference two different currency lists for this.
export interface PayableLedgerLine {
  intLedger: number
  semesterGuid: string | null
  ledgerName: string
  ledgerNum: string | null
  amount: number
  intCurrency: number
  currencyName: string
  amtDef: number
  isDiscountLine: boolean
  isRoundingLine: boolean
}

export interface PayableLedgersResult {
  lines: PayableLedgerLine[]
  balance: number
}

export interface PayableLedgersParams {
  applicationGuid: string
  studentGuid?: string | null
  amount: number
  intCurrency: number
  payDate: string
}

// Confirmed via CreatePayment.bru — records a tuition payment, auto-
// allocated server-side against the outstanding ledgers (same allocation
// GetPayableLedgers previews). procBankGuid references the ProcBank master
// (lib/api/finance/procBank.ts, useProcBanks()) — confirmed by the matching
// field name, NOT the plain Bank master (bank.ts) the old mock UI used.
export interface PaymentInput {
  applicationGuid: string
  studentGuid: string | null
  amount: number
  currencyGuid: string
  receiptBookGuid: string
  payDate: string
  payType: number
  procBankGuid: string | null
  remarks: string | null
}

export interface PaymentResult {
  paymentGuid: string
  paymentCode: string
  receipt: string
  balance: number
  advanceMessage: string | null
}

export const PAYMENT_CATEGORY_LABELS: Record<number, string> = {
  1: 'Tuition',
  2: 'Other',
  3: 'NCHE',
  4: 'Guild',
  5: 'Advance',
}

export const PAY_TYPE_LABELS: Record<number, string> = {
  1: 'Cash',
  2: 'Cheque',
  3: 'Bank',
  4: 'Demand Draft',
  5: 'Online',
}

const mockApplicationSummaries: ApplicationSummary[] = []
const mockStudentProfiles: Record<string, StudentProfile> = {}
const mockOutstandingLedgers: Record<string, OutstandingLedger[]> = {}
const mockPaymentHistory: Record<string, PaymentHistoryEntry[]> = {}
let mockPaymentSeq = 1

export function searchStudents(searchTerm: string, pageNumber = 1, pageSize = 20): Promise<ApplicationSummaryListResponse> {
  if (MOCK_AUTH) {
    const items = searchTerm.trim()
      ? mockApplicationSummaries.filter(a => `${a.appRefNo} ${a.firstName} ${a.lastName} ${a.emailId} ${a.phone}`.toLowerCase().includes(searchTerm.toLowerCase()))
      : mockApplicationSummaries
    return Promise.resolve({ items, totalCount: items.length, pageNumber, pageSize })
  }
  return apiGet<ApplicationSummaryListResponse | null>(
    `/api/v1/finance/payment-console/search?searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
  ).then(data => data ?? { items: [], totalCount: 0, pageNumber, pageSize })
}

export function getStudentProfile(applicationGuid: string): Promise<StudentProfile> {
  if (MOCK_AUTH) {
    const existing = mockStudentProfiles[applicationGuid]
    if (!existing) return Promise.reject(new Error('Application not found'))
    return Promise.resolve(existing)
  }
  return apiGet<StudentProfile>(`/api/v1/finance/payment-console/student-profile/${applicationGuid}`)
}

export function getOutstandingLedgers(applicationGuid: string): Promise<OutstandingLedger[]> {
  if (MOCK_AUTH) return Promise.resolve(mockOutstandingLedgers[applicationGuid] ?? [])
  return apiGet<OutstandingLedger[] | null>(`/api/v1/finance/payment-console/outstanding-ledgers/${applicationGuid}`)
    .then(data => data ?? [])
    // Confirmed live: an application with no fee structure lines wired up
    // yet returns a 404 `not_found` ("No fee structure lines found.")
    // instead of a 200 with an empty array — a real empty-result case, not
    // a genuine error. Without this, react-query treats it as a query
    // error (retries a few times, then leaves the page stuck on an error
    // state) instead of just showing "no outstanding ledgers".
    .catch(err => {
      if (err instanceof AuthError && err.code === 'not_found') return []
      throw err
    })
}

export function getPaymentHistory(applicationGuid: string): Promise<PaymentHistoryEntry[]> {
  if (MOCK_AUTH) return Promise.resolve(mockPaymentHistory[applicationGuid] ?? [])
  return apiGet<PaymentHistoryEntry[] | null>(`/api/v1/finance/payment-console/payment-history/${applicationGuid}`)
    .then(data => data ?? [])
}

export function getPayableLedgers(params: PayableLedgersParams): Promise<PayableLedgersResult> {
  if (MOCK_AUTH) return Promise.resolve({ lines: [], balance: 0 })
  const qs = new URLSearchParams({
    applicationGuid: params.applicationGuid,
    amount: String(params.amount),
    intCurrency: String(params.intCurrency),
    payDate: params.payDate,
  })
  if (params.studentGuid) qs.set('studentGuid', params.studentGuid)
  return apiGet<PayableLedgersResult | null>(`/api/v1/finance/payment-console/payable-ledgers?${qs.toString()}`)
    .then(data => data ?? { lines: [], balance: 0 })
}

export function createPayment(input: PaymentInput): Promise<PaymentResult> {
  if (MOCK_AUTH) {
    const result: PaymentResult = {
      paymentGuid: `mock-payment-${mockPaymentSeq}`,
      paymentCode: `PAY-MOCK-${mockPaymentSeq++}`,
      receipt: `RCP-MOCK-${Date.now()}`,
      balance: 0,
      advanceMessage: null,
    }
    return Promise.resolve(result)
  }
  return apiPost<PaymentResult>('/api/v1/finance/payment-console/payments', input)
}
