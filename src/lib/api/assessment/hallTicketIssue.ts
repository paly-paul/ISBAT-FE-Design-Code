import { apiGet, apiPost } from '../client'

export interface HallTicketEligibilityDto {
  studentName: string
  alreadyIssued: boolean
  isFeeExcepted: boolean
  isExempted: boolean
  cwOk: boolean
  ctOk: boolean
  feeOk: boolean
  guildOk: boolean | null
  ncheOk: boolean | null
  canIssue: boolean
}


export function getHallTicketEligibility(studentGuid: string, intakeGuid: string, term: number): Promise<HallTicketEligibilityDto> {
  const params = new URLSearchParams({
    studentGuid,
    intakeGuid,
    term: term.toString()
  })
  
  return apiGet<HallTicketEligibilityDto>(`/api/v1/assessment/hall-ticket-issue/eligibility?${params.toString()}`)
}

export function issueHallTicket(payload: { studentGuid: string; intakeGuid: string; term: number }): Promise<boolean> {
  return apiPost<boolean>(`/api/v1/assessment/hall-ticket-issue`, payload)
}

export interface BulkIssueResponseDto {
  totalConsidered: number
  issued: number
  alreadyIssued: number
  ineligible: number
  failed: number
}

export function issueBulkHallTickets(payload: { intakeGuid: string; term: number }): Promise<BulkIssueResponseDto> {
  return apiPost<BulkIssueResponseDto>(`/api/v1/assessment/hall-ticket-issue/bulk`, payload)
}

export function getHallTicketPdfUrl(studentGuid: string, intakeGuid: string, term: number): string {
  const params = new URLSearchParams({ intakeGuid, term: term.toString() })
  return `/api/v1/assessment/hall-ticket-issue/${studentGuid}/pdf?${params.toString()}`
}

export function getBulkHallTicketPdfUrl(intakeGuid: string, term: number): string {
  const params = new URLSearchParams({ intakeGuid, term: term.toString() })
  return `/api/v1/assessment/hall-ticket-issue/bulk/pdf?${params.toString()}`
}
