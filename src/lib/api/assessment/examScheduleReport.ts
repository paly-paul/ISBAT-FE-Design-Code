import { apiGet, apiPostWithMessage } from '../client'
import { normalizeReportJob, type ReportJob } from '../finance/discountReport'

// Exam Schedule Report (erp-docs/pages/assessment/exam-schedule-report-page.md)
// APIs:
//   GET  /api/v1/assessment/reports/exam-schedule/preview
//   POST /api/v1/assessment/reports/exam-schedule/export

export const SCHEDULE_TYPE = {
  UniversityExam: 1,
  Coursework: 2,
  Test: 3,
  MockExam: 4,
  ResitUniversityExam: 5,
  ResitClassTest: 6,
  ResitCoursework: 7,
} as const

export const SCHEDULE_TYPE_LABELS: Record<number, string> = {
  1: 'University Exam',
  2: 'Coursework',
  3: 'Test',
  4: 'Mock Exam',
  5: 'Resit University Exam',
  6: 'Resit Class Test',
  7: 'Resit Coursework',
}

export const PUBLISH_STATUS = {
  Unpublished: 0,
  Published: 1,
} as const

export const MODE = {
  Online: 0,
  Offline: 1,
} as const

export const UE_TYPE = {
  Theory: 0,
  Practical: 1,
} as const

export const QUESTION_VERIFICATION = {
  NotVerified: 0,
  PartiallyVerified: 1,
  Verified: 2,
} as const

// Whether to list dated schedules, undated ones, or both (2026-11-17).
// Scheduled is the API's default when the param is left out.
export const SCHEDULING_STATUS = {
  Scheduled: 0,
  NotScheduled: 1,
  All: 2,
} as const

export const SCHEDULING_STATUS_LABELS: Record<number, string> = {
  0: 'Scheduled',
  1: 'Not scheduled',
  2: 'All',
}

// Only these types can exist without a date; Mock Exam and the resits
// always have one, so they never appear under Not scheduled.
export const UNDATABLE_SCHEDULE_TYPES: number[] = [SCHEDULE_TYPE.UniversityExam, SCHEDULE_TYPE.Coursework, SCHEDULE_TYPE.Test]

export interface ExamScheduleReportFilters {
  scheduleTypes?: number[]
  intakeGuids?: string[]
  fromDate?: string        // yyyy-MM-dd
  toDate?: string          // yyyy-MM-dd
  programGuids?: string[]
  semesterGuids?: string[]
  courseUnitGuids?: string[]
  publishStatuses?: number[]
  modes?: number[]
  ueTypes?: number[]
  // 0 Scheduled (default), 1 Not scheduled, 2 All. With Not scheduled the
  // dates are ignored; with All they only limit the dated rows.
  schedulingStatus?: number
}

export interface ExamScheduleReportRow {
  scheduleType: number
  scheduleTypeName: string
  scheduleGuid: string
  // false for a schedule never given a date: date, dayOfWeek, startTime
  // and endTime are then null. Undated rows come last.
  isScheduled?: boolean
  date: string | null            // plain date, no TZ
  dayOfWeek: string | null       // Monday, Tuesday...
  startTime: string | null       // HH:mm:ss, plain time
  endTime: string | null         // HH:mm:ss, plain time
  intakeName: string | null
  programName: string | null
  semesterName: string | null
  unitCode: string | null
  unitName: string | null
  ueType: number | null          // 0 Theory, 1 Practical
  mode: number | null            // 0 Online, 1 Offline
  maxMark: number | null
  publishStatus: number | null   // 0 Unpublished, 1 Published
  scheduledByName: string | null
  scheduledDate: string | null   // UTC without Z
  questionCount: number | null
  questionsLastUploadedDate: string | null // UTC without Z
  questionsLastUploadedByName: string | null
  questionVerification: number | null     // 0 NotVerified, 1 PartiallyVerified, 2 Verified
  courseUnitGuid: string | null
  applicantCount: number | null
  questionsRequired: number | null
  questionsAvailable: number | null
  questionsReady: boolean | null
}

export interface ExamScheduleReportTypeCount {
  scheduleType: number
  scheduleTypeName: string
  rowCount: number
}

export interface ExamScheduleReportSummary {
  totalRows: number
  byScheduleType: ExamScheduleReportTypeCount[]
}

export interface ExamScheduleReportPreview {
  summary: ExamScheduleReportSummary | null
  rows: {
    items: ExamScheduleReportRow[]
    totalCount: number
    pageNumber: number
    pageSize: number
  }
}

export const EXAM_SCHEDULE_REPORT_PAGE_SIZE = 15

function appendListParams(params: URLSearchParams, key: string, values?: (string | number)[]) {
  if (!values || !Array.isArray(values) || values.length === 0) return
  for (const v of values) {
    params.append(key, String(v))
  }
}

function buildPreviewQueryString(
  filters: ExamScheduleReportFilters,
  pageNumber: number,
  pageSize: number,
  includeSummary: boolean
): string {
  const params = new URLSearchParams()
  params.set('pageNumber', String(pageNumber))
  params.set('pageSize', String(pageSize))
  if (!includeSummary) {
    params.set('includeSummary', 'false')
  }

  appendListParams(params, 'scheduleTypes', filters.scheduleTypes)
  appendListParams(params, 'intakeGuids', filters.intakeGuids)
  if (filters.fromDate) params.set('fromDate', filters.fromDate)
  if (filters.toDate) params.set('toDate', filters.toDate)
  appendListParams(params, 'programGuids', filters.programGuids)
  appendListParams(params, 'semesterGuids', filters.semesterGuids)
  appendListParams(params, 'courseUnitGuids', filters.courseUnitGuids)
  appendListParams(params, 'publishStatuses', filters.publishStatuses)
  appendListParams(params, 'modes', filters.modes)
  appendListParams(params, 'ueTypes', filters.ueTypes)
  params.set('schedulingStatus', String(filters.schedulingStatus ?? SCHEDULING_STATUS.Scheduled))

  return params.toString()
}

export function getExamScheduleReportPreview(
  filters: ExamScheduleReportFilters,
  pageNumber = 1,
  pageSize = EXAM_SCHEDULE_REPORT_PAGE_SIZE
): Promise<ExamScheduleReportPreview> {
  const includeSummary = pageNumber === 1
  const qs = buildPreviewQueryString(filters, pageNumber, pageSize, includeSummary)
  return apiGet<ExamScheduleReportPreview>(`/api/v1/assessment/reports/exam-schedule/preview?${qs}`)
}

export function exportExamScheduleReport(
  filters: ExamScheduleReportFilters
): Promise<{ job: ReportJob; message: string | null }> {
  const body = {
    scheduleTypes: filters.scheduleTypes?.length ? filters.scheduleTypes : null,
    intakeGuids: filters.intakeGuids?.length ? filters.intakeGuids : null,
    fromDate: filters.fromDate || null,
    toDate: filters.toDate || null,
    programGuids: filters.programGuids?.length ? filters.programGuids : null,
    semesterGuids: filters.semesterGuids?.length ? filters.semesterGuids : null,
    courseUnitGuids: filters.courseUnitGuids?.length ? filters.courseUnitGuids : null,
    publishStatuses: filters.publishStatuses?.length ? filters.publishStatuses : null,
    modes: filters.modes?.length ? filters.modes : null,
    ueTypes: filters.ueTypes?.length ? filters.ueTypes : null,
    // Same value as the preview, so the file matches what's on screen.
    schedulingStatus: filters.schedulingStatus ?? SCHEDULING_STATUS.Scheduled,
  }

  return apiPostWithMessage<any>('/api/v1/assessment/reports/exam-schedule/export', body)
    .then(({ data, message }) => ({ job: normalizeReportJob(data), message }))
}
