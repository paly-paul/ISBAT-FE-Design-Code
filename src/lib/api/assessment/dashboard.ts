import { apiGet } from '../client'

// Assessment Dashboard endpoints (assessment-dashboard/*.md)
// 1. GET /api/v1/assessment/assessment-overview
// 2. GET /api/v1/assessment/hall-ticket-dashboard
// 3. GET /api/v1/assessment/resit-dashboard
// 4. GET /api/v1/assessment/lecturer-dashboard

// ---------------------------------------------------------------------------
// 1. Assessment Overview (Admin, Registrar, Dean)
// ---------------------------------------------------------------------------
export interface AssessmentOverviewDto {
  academicIntakeGuid: string
  isUniversityWide: boolean
  facultyGuids: string[]
  cwSubmissionPendingCount: number
  classTestSubmissionPendingCount: number
  cwEvaluationPendingCount: number
  ueQpAwaitingVettingCount: number
}

export function getAssessmentOverview(): Promise<AssessmentOverviewDto> {
  return apiGet<AssessmentOverviewDto>('/api/v1/assessment/assessment-overview')
}

// ---------------------------------------------------------------------------
// 2. Hall Ticket Dashboard (Intake-wide summary)
// ---------------------------------------------------------------------------
export interface HallTicketTermCount {
  term: number // 1 or 2
  issuedCount: number
  pendingCount: number
}

export interface HallTicketDashboardDto {
  academicIntakeGuid: string
  registeredStudentCount: number
  terms: HallTicketTermCount[]
}

export function getHallTicketDashboard(): Promise<HallTicketDashboardDto> {
  return apiGet<HallTicketDashboardDto>('/api/v1/assessment/hall-ticket-dashboard')
}

// ---------------------------------------------------------------------------
// 3. Resit Dashboard (Resit window & exam schedule summary)
// ---------------------------------------------------------------------------
export interface ScheduledResitExamItem {
  examType: number // 1: class test, 2: coursework, 5: university exam
  scheduleGuid: string
  courseUnitGuid: string | null
  courseUnitCode: string | null
  courseUnitName: string | null
  startDateTime: string
  endDateTime: string
  publishStatus: number // 0: unpublished, 1: published
}

export interface ScheduledResitExamsPaged {
  items: ScheduledResitExamItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface PendingResitEvaluationItem {
  courseUnitGuid: string
  unitCode: string
  unitName: string
  category: number // 2: Coursework 1, 3: Coursework 2
  categoryLabel: string
  programmeNames: string[]
  headCount: number
  submittedCount: number
  evaluatedCount: number
  pendingCount: number
}

export interface ResitDashboardDto {
  academicIntakeGuid: string
  resitConfigGuid: string
  refCode: string
  applicationOpenDate: string
  applicationCloseDate: string
  registeredStudentCount: number
  registeredCourseUnitCount: number
  feeClearedStudentCount: number
  feeClearedCourseUnitCount: number
  scheduledExams: ScheduledResitExamsPaged
  pendingEvaluations: PendingResitEvaluationItem[]
}

export function getResitDashboard(page: number = 1, pageSize: number = 10): Promise<ResitDashboardDto> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return apiGet<ResitDashboardDto>(`/api/v1/assessment/resit-dashboard?${params.toString()}`)
}

// ---------------------------------------------------------------------------
// 4. Lecturer Dashboard ("My subjects" view for logged-in lecturer)
// ---------------------------------------------------------------------------
export interface LecturerScheduleItem {
  scheduleType: number // 1: class test, 2: coursework, 5: university exam
  scheduleGuid: string
  number: number | null // e.g. 1 for CW1, null for UE
  courseUnitGuid: string | null
  courseUnitCode: string | null
  courseUnitName: string | null
  startDateTime: string
  endDateTime: string
  maxMark: number
  publishStatus: number // 0: unpublished, 1: published
}

export interface LecturerDashboardDto {
  academicIntakeGuid: string
  cwSubmissionPendingCount: number
  classTestSubmissionPendingCount: number
  cwEvaluationPendingCount: number
  ueQpAwaitingVettingCount: number
  schedules: LecturerScheduleItem[]
}

export function getLecturerDashboard(): Promise<LecturerDashboardDto> {
  return apiGet<LecturerDashboardDto>('/api/v1/assessment/lecturer-dashboard')
}
