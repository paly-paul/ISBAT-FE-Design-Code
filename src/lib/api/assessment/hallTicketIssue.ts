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

export interface BulkIssuedStudentDto {
  studentGuid: string
  studentRegNo: string
  studentName: string
  programName: string
  semCode: string
  batchCode: string
}

export function getBulkIssuedHallTickets(intakeGuid: string, term: number, programGuid?: string, semesterGuid?: string): Promise<BulkIssuedStudentDto[]> {
  const params = new URLSearchParams({ intakeGuid, term: term.toString() })
  if (programGuid) params.append('programGuid', programGuid)
  if (semesterGuid) params.append('semesterGuid', semesterGuid)
  return apiGet<BulkIssuedStudentDto[]>(`/api/v1/assessment/hall-ticket-issue/bulk?${params.toString()}`)
}

export function recordHallTicketPrint(payload: { 
  intakeGuid: string
  programGuid: string
  semesterGuid: string
  term: number
  studentGuids: string[] 
}): Promise<boolean> {
  return apiPost<boolean>(`/api/v1/assessment/hall-ticket-issue/print`, payload)
}

export function getHallTicketQrImageUrl(studentGuid: string, term: number): string {
  const params = new URLSearchParams({ term: term.toString() })
  return `/api/v1/assessment/hall-ticket-issue/${studentGuid}/qr-image?${params.toString()}`
}

export interface HallTicketQrVerificationDto {
  studentGuid: string
  studentName: string | null
  programmeName: string | null
  semesterName: string | null
  term: number
  isIssued: boolean
  issueDate: string | null
}

export function verifyHallTicketQrScan(studentGuid: string, intakeGuid: string, term: number): Promise<HallTicketQrVerificationDto> {
  const params = new URLSearchParams({ intakeGuid, term: term.toString() })
  return apiGet<HallTicketQrVerificationDto>(`/api/v1/assessment/hall-ticket-issue/${studentGuid}/qr-scan?${params.toString()}`)
}
