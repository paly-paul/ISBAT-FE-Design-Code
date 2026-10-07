import { apiGet, apiGetBlob, apiPost } from '../client'

// Hall Ticket Issue endpoints (assessment-attendance-service/assessment/
// hall-ticket-issue/*.md). Backs three pages, per their page docs
// (pages/assessment/hall-ticket-*.md, 2026-10-06):
//  - /assessment/hall-ticket             — eligibility + issue only
//  - /assessment/hall-print              — single-student print
//  - /assessment/hall-ticket-print-all   — whole-intake combined PDF
// `term` is always 1 or 2 — there's no API for it, the pages supply it.

export type HallTicketTerm = 1 | 2

export interface HallTicketEligibilityDto {
  // null only on the already-issued short-circuit.
  studentName: string | null
  // When true every other field is false/null — no further checks ran.
  alreadyIssued: boolean
  isFeeExcepted: boolean
  isExempted: boolean
  cwOk: boolean
  ctOk: boolean
  feeOk: boolean
  // null for Term 1 (not checked).
  guildOk: boolean | null
  ncheOk: boolean | null
  // The only gate the UI should use; POST / re-checks it server-side.
  canIssue: boolean
}

export function getHallTicketEligibility(studentGuid: string, intakeGuid: string, term: HallTicketTerm): Promise<HallTicketEligibilityDto> {
  const params = new URLSearchParams({ studentGuid, intakeGuid, term: String(term) })
  return apiGet<HallTicketEligibilityDto>(`/api/v1/assessment/hall-ticket-issue/eligibility?${params.toString()}`)
}

// Idempotent — re-issuing an already-issued student succeeds without a
// duplicate (post-issue.md).
export function issueHallTicket(payload: { studentGuid: string; intakeGuid: string; term: HallTicketTerm }): Promise<boolean> {
  return apiPost<boolean>('/api/v1/assessment/hall-ticket-issue', payload)
}

export interface BulkIssueResponseDto {
  totalConsidered: number
  issued: number
  alreadyIssued: number
  ineligible: number
  failed: number
}

// Program + semester together scope it to one class; omit both for the
// whole intake (post-bulk-issue.md).
export interface HallTicketScope {
  intakeGuid: string
  term: HallTicketTerm
  programGuid?: string | null
  semesterGuid?: string | null
}

export function issueBulkHallTickets(scope: HallTicketScope): Promise<BulkIssueResponseDto> {
  return apiPost<BulkIssueResponseDto>('/api/v1/assessment/hall-ticket-issue/bulk', {
    intakeGuid: scope.intakeGuid,
    term: scope.term,
    programGuid: scope.programGuid || null,
    semesterGuid: scope.semesterGuid || null,
  })
}

// Exact casing — the backend binds it as an enum and 400s anything else.
export type HallTicketIssueStatus = 'Issued' | 'NotIssued'

export interface HallTicketScopeStudentDto {
  studentGuid: string
  studentRegNo: string | null
  studentName: string | null
  programName: string
  semCode: string
  batchCode: string
  status: HallTicketIssueStatus
}

function scopeParams(scope: HallTicketScope) {
  const params = new URLSearchParams({ intakeGuid: scope.intakeGuid, term: String(scope.term) })
  if (scope.programGuid) params.set('programGuid', scope.programGuid)
  if (scope.semesterGuid) params.set('semesterGuid', scope.semesterGuid)
  return params
}

// GET /bulk (get-bulk-issued.md) — every registered student in the scope
// with an Issued/NotIssued status; `status` narrows to one group. Unpaged.
export function getHallTicketScopeStudents(scope: HallTicketScope, status?: HallTicketIssueStatus | null): Promise<HallTicketScopeStudentDto[]> {
  const params = scopeParams(scope)
  if (status) params.set('status', status)
  return apiGet<HallTicketScopeStudentDto[] | null>(`/api/v1/assessment/hall-ticket-issue/bulk?${params.toString()}`)
    .then(data => data ?? [])
}

// Raw PDF downloads (no JSON envelope on success; errors still come back as
// the envelope, which apiGetBlob surfaces as a thrown AuthError). Fetched
// rather than window.open'd so a 404 "not issued" shows as a toast instead
// of a JSON page in a new tab. Both record the print audit server-side as a
// side effect — the pages never call POST /print themselves.
export async function downloadHallTicketPdf(studentGuid: string, intakeGuid: string, term: HallTicketTerm) {
  const params = new URLSearchParams({ intakeGuid, term: String(term) })
  const { blob, filename } = await apiGetBlob(`/api/v1/assessment/hall-ticket-issue/${studentGuid}/pdf?${params.toString()}`)
  return { blob, filename: filename ?? `hallticket_${studentGuid}.pdf` }
}

export async function downloadBulkHallTicketPdf(scope: HallTicketScope) {
  const { blob, filename } = await apiGetBlob(`/api/v1/assessment/hall-ticket-issue/bulk/pdf?${scopeParams(scope).toString()}`)
  return { blob, filename: filename ?? 'hallticket_batch.pdf' }
}

// image/png. intakeGuid is required (get-qr-image.md) — a student can hold
// tickets in several intakes.
export function getHallTicketQrImageUrl(studentGuid: string, intakeGuid: string, term: HallTicketTerm): string {
  const params = new URLSearchParams({ intakeGuid, term: String(term) })
  return `/api/v1/assessment/hall-ticket-issue/${studentGuid}/qr-image?${params.toString()}`
}
