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

// Confirmed via payment-console/get-student-profile.md plus a real live
// response — the live DTO carries more than the spec's own sample shows.
// The docs mention the response also carries "any active discount
// assignments" but give no field name/shape for it — still omitted here
// rather than guessing.
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
  // Confirmed via a real live student-profile response — not in the .md
  // spec's own sample. studentGuid is the one that matters functionally:
  // it's the studentGuid outstanding-ledgers/payable-ledgers/createPayment
  // all optionally accept (see get-outstanding-ledgers.md,
  // get-payable-ledgers.md) — null until the application becomes an
  // enrolled student, same lifecycle as studentRegNo/studentNum below.
  studentGuid: string | null
  studentRegNo: string | null
  studentNum: string | null
  studentName: string | null
  // Pre-resolved display names, server-side — prefer these over the
  // client-side GUID lookups (useProgramMasters/useBatches/
  // useSemestersForProgram) the page falls back to when a field here comes
  // back null, which a live sample confirms it can (programName, batchCode
  // and semesterName were all null on an application with a fee structure
  // and program level otherwise fully resolved).
  programCode: string | null
  programName: string | null
  programLevelGuid: string | null
  levelCode: string | null
  levelName: string | null
  semesterName: string | null
  batchCode: string | null
  batchIntakeCode: string | null
  feeCode: string | null
  intType: string | null
  admissionTypeLabel: string | null
  // Type genuinely unconfirmed — null on every live sample seen so far, no
  // spec coverage, and the name isn't self-explanatory enough to guess a
  // shape for. Left as unknown rather than assuming string; narrow it once
  // a non-null sample turns up.
  ucam: unknown
}

// Confirmed via payment-console/get-outstanding-ledgers.md — tuition-only
// ledger lines for the student's current programme/semester. Unlike the old
// mock's flat Admission/Registration/Tuition/NCHE/Guild list, this endpoint
// has no "priority" or fee-category concept at all — GetAllOutstandingLedgers
// (not wired here) is what covers the other/NCHE/guild categories.
//
// GUID-keyed (ledgerGuid/currencyGuid), not int-keyed — a correction from an
// earlier version of this file that keyed rows by intLedger/intCurrency per
// a since-superseded .bru sample. Don't reintroduce the int fields; the spec
// doc is explicit that the DTO carries GUIDs.
export interface OutstandingLedger {
  ledgerGuid: string | null
  semesterGuid: string | null
  ledgerName: string
  ledgerNum: number | null
  currencyGuid: string | null
  currencyName: string
  ledgerAmount: number
  paidAmount: number
  outstanding: number
}

// Confirmed via payment-console/get-payment-history.md — category is
// documented with an explicit int↔label mapping right in the spec (unlike
// most other int-enum fields in this codebase), so PAYMENT_CATEGORY_LABELS
// below is safe, not a guess. payType, however, comes back **pre-resolved**
// as `{ value, name }` (and null for NCHE/guild rows, which have no
// pay-type column) — a correction from an earlier version of this file that
// treated it as a bare number per a since-superseded .bru sample; use
// `payType.name` directly instead of cross-referencing PAY_TYPE_LABELS for
// this endpoint. Likewise currencyGuid, not intCurrency; receiptBookGuid,
// not intReceipt.
export interface PaymentHistoryEntry {
  paymentGuid: string
  category: number
  paymentCode: string
  payDate: string
  amount: number
  currencyGuid: string | null
  currencyName: string
  receipt: string | null
  receiptBookGuid: string | null
  bookCode: string | null
  payType: { value: number; name: string } | null
}

// Confirmed via payment-console/get-payable-ledgers.md — given a tuition
// amount + currency + date, the backend returns how it would actually be
// allocated (discount and rounding lines included, flagged explicitly
// rather than needing to be inferred). currencyGuid here — same GUID as
// CreatePayment's own currencyGuid below, both sourced from the same
// useFinanceCurrencies() record — not intCurrency, which an earlier version
// of this file used per a since-superseded .bru sample; the query is bound
// straight off currencyGuid and rejects an int.
export interface PayableLedgerLine {
  ledgerGuid: string | null
  semesterGuid: string | null
  ledgerName: string
  ledgerNum: number | null
  amount: number
  currencyGuid: string | null
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
  currencyGuid: string
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

// studentGuid is optional per get-outstanding-ledgers.md, but supplying it
// once the applicant has become a student lets the handler resolve the
// student's real current/registration semester instead of falling back to
// the application's own semester, which can widen or narrow the billed
// range.
export function getOutstandingLedgers(applicationGuid: string, studentGuid?: string | null): Promise<OutstandingLedger[]> {
  if (MOCK_AUTH) return Promise.resolve(mockOutstandingLedgers[applicationGuid] ?? [])
  const qs = studentGuid ? `?studentGuid=${encodeURIComponent(studentGuid)}` : ''
  return apiGet<OutstandingLedger[] | null>(`/api/v1/finance/payment-console/outstanding-ledgers/${applicationGuid}${qs}`)
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
    // Same "genuinely-empty-result-as-404" behavior confirmed live on
    // GetOutstandingLedgers above — an application with no payments yet
    // returns a 404 `not_found` instead of a 200 with an empty array.
    // Without this, react-query treats a brand-new application (no payment
    // history at all) as a query error instead of just "no history".
    .catch(err => {
      if (err instanceof AuthError && err.code === 'not_found') return []
      throw err
    })
}

// Confirmed via a real GetPaymentHistoryList sample response. **A genuinely
// different resource from `getPaymentHistory`/`PaymentHistoryEntry` above**
// despite sharing the same "payment-history" URL segment — that one is
// scoped to one application (`.../payment-history/{applicationGuid}`, a flat
// per-payment-line list with no student/programme info since it's already
// known from context); this one is the full cross-application ledger
// (`.../payment-history`, no guid), paginated, and each row carries its own
// studentNo/studentName/programName/feeType — same "route look-alike, don't
// conflate" pattern as enquirySource.ts/enquirySourceMaster.ts elsewhere in
// this app. Backs /finance/payment-history (the standalone page, not Payment
// Console's own Step 3 history tab). studentNo/studentName/programName are
// nullable on every row seen so far (real sample data), same "server always
// sends null for this field" shape as enquiry.ts's campusName/programName —
// display a "—" fallback, don't assume it'll ever populate. `rate` is null
// whenever `currencyCode` is already `"UGX"` (no conversion applied — pesky
// only for foreign-currency rows). `payType` is an object with its label
// already resolved server-side (`{value, name}`) — unlike the scoped
// endpoint's bare `payType: number`, there's no need to cross-reference
// PAY_TYPE_LABELS for this one. Confirmed via a real production crash that
// `payType` itself can come back `null` on some rows (not just always an
// object) — treat it as genuinely optional, don't assume every row has one.
export interface PaymentHistoryListEntry {
  paymentGuid: string
  category: number
  receiptNo: string
  payDate: string
  studentNo: string | null
  studentName: string | null
  programName: string | null
  feeType: string
  amount: number
  currencyCode: string
  ugxValue: number
  rate: number | null
  payType: { value: number; name: string } | null
}

export interface PaymentHistoryListResponse {
  items: PaymentHistoryListEntry[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export function getPaymentHistoryList(pageNumber = 1, pageSize = 20): Promise<PaymentHistoryListResponse> {
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber, pageSize })
  return apiGet<PaymentHistoryListResponse | null>(
    `/api/v1/finance/payment-console/payment-history?pageNumber=${pageNumber}&pageSize=${pageSize}`,
  ).then(data => data ?? { items: [], totalCount: 0, pageNumber, pageSize })
}

export function getPayableLedgers(params: PayableLedgersParams): Promise<PayableLedgersResult> {
  if (MOCK_AUTH) return Promise.resolve({ lines: [], balance: 0 })
  const qs = new URLSearchParams({
    applicationGuid: params.applicationGuid,
    amount: String(params.amount),
    currencyGuid: params.currencyGuid,
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
