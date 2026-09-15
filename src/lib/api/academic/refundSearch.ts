import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs the Payment Console → Refund page's three refund-eligibility search
// tabs (2026-09-15, per the refund-search API set). Ledger/payment detail is
// intentionally not embedded in the Rejected/Fake-Certificate responses —
// fetch it separately per selected application from finance-service's
// getLedgerDetailsBatch (src/lib/api/finance/paymentRefund.ts). The
// Passout/Library Deposit search is the one exception: it embeds ledgers
// directly, merged server-side from both payment sources.

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface RefundSearchParams {
  search?: string
  page?: number
  pageSize?: number
}

// ─── GET /admissions/refund-search/rejected-applications ─────────────────
// Category 1 — applications rejected by the registrar (Action =
// RejectedByRegistrar). studentGuid is null for most rows — a rejected
// application usually never went on to register a student.
export interface RejectedApplicationRefundCandidateDto {
  applicationGuid: string
  studentGuid: string | null
  appRefNo: string
  applicantName: string
  email: string | null
  phone: string | null
}

export function searchRejectedApplications(params: RefundSearchParams): Promise<PagedResult<RejectedApplicationRefundCandidateDto>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber: page, pageSize })
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (params.search?.trim()) qs.set('search', params.search.trim())
  return apiGet<PagedResult<RejectedApplicationRefundCandidateDto> | null>(`/api/v1/admissions/refund-search/rejected-applications?${qs.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: page, pageSize })
}

// ─── GET /students/refund-search/passout-library-deposit ─────────────────
// Category 2 — students with RegStatus = Passout, eligible for a Library
// Deposit refund. Ledgers are embedded per student (merged main-ledger +
// Other-Payments lines), so a bulk-refund confirm step can post straight
// off what this response already shows without a second round trip.
export interface PassoutLedgerLineDto {
  ledgerGuid: string
  ledgerName: string
  currencyGuid: string
  currencyCode: string
  amount: number
  convertedAmount: number | null
  exchangeRateMissing: boolean
  payDate: string
  receipt: string
  receiptBookCode: string
}

export interface PassoutLibraryDepositRefundCandidateDto {
  studentGuid: string
  studentRegNo: string
  studentNum: string
  studentName: string
  programGuid: string | null
  programName: string | null
  batchGuid: string | null
  batchCode: string | null
  campusGuid: string | null
  campusName: string | null
  intakeGuid: string | null
  ledgers: PassoutLedgerLineDto[]
}

export interface PassoutLibraryDepositSearchParams extends RefundSearchParams {
  intakeGuid?: string
  programGuid?: string
  batchGuid?: string
  campusGuid?: string
}

export function searchPassoutLibraryDeposit(params: PassoutLibraryDepositSearchParams): Promise<PagedResult<PassoutLibraryDepositRefundCandidateDto>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber: page, pageSize })
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (params.search?.trim()) qs.set('search', params.search.trim())
  if (params.intakeGuid) qs.set('intakeGuid', params.intakeGuid)
  if (params.programGuid) qs.set('programGuid', params.programGuid)
  if (params.batchGuid) qs.set('batchGuid', params.batchGuid)
  if (params.campusGuid) qs.set('campusGuid', params.campusGuid)
  return apiGet<PagedResult<PassoutLibraryDepositRefundCandidateDto> | null>(`/api/v1/students/refund-search/passout-library-deposit?${qs.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: page, pageSize })
}

// ─── GET /students/refund-search/fake-certificate-terminations ───────────
// Category 3 — students terminated mid-program with reason "Fake
// Certificate" (POST /students/{studentGuid}/terminate). No applicationGuid
// on this DTO — resolve it via getStudentByGuid(studentGuid)
// (src/lib/api/student/student.ts), whose applicationSummary.applicationGuid
// carries it, the same resolver the page already needs for the refund step
// (ledger detail is fetched by applicationGuid, not studentGuid).
export interface TerminatedStudentRefundCandidateDto {
  studentGuid: string
  studentRegNo: string
  studentNum: string
  studentName: string
  programGuid: string | null
  programName: string | null
  batchGuid: string | null
  batchCode: string | null
  terminationRemarks: string | null
}

export function searchFakeCertificateTerminations(params: RefundSearchParams): Promise<PagedResult<TerminatedStudentRefundCandidateDto>> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber: page, pageSize })
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (params.search?.trim()) qs.set('search', params.search.trim())
  return apiGet<PagedResult<TerminatedStudentRefundCandidateDto> | null>(`/api/v1/students/refund-search/fake-certificate-terminations?${qs.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: page, pageSize })
}
