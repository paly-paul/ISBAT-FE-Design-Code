import { apiGet, apiPost, apiPut } from '@/lib/api/client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface ResitContextDto {
  resitConfigGuid: string
  refCode: string
  academicIntakeGuid: string
}

export interface ResitScheduleListItemDto {
  resitScheduleGuid: string
  courseUnitGuid: string
  unitCode: string
  unitName: string
  ueType: number // 0 Theory, 1 Practical
  examDate: string | null
  startTime: string | null
  endTime: string | null
  maxMark: number | null
  examType: number | null
  publishStatus: number
  examRuleGuid: string | null
  examRuleCode: string | null
  examRuleName: string | null
}

export interface ResitSchedulesResponse {
  resit: ResitContextDto | null
  schedules: PagedResult<ResitScheduleListItemDto>
}

export interface ResitScheduleCourseUnitDto {
  courseUnitGuid: string
  unitCode: string
  unitName: string
  isTheoryPracticalUnit: boolean
  theoryScheduled: boolean
  practicalScheduled: boolean
}

export interface ResitScheduleSaveCommand {
  courseUnitGuid?: string // only for create
  ueType?: number // only for create
  examDate: string
  startTime: string
  endTime: string
  maxMark: number
  examType: number
  publishStatus: number
  examRuleGuid: string
}

export interface ResitScheduleDetailDto extends ResitScheduleListItemDto {
  marksEntered: boolean
}

export interface ResitCwScheduleDto {
  resitCourseworkScheduleGuid: string
  startDateTime: string
  endDateTime: string
  testType: number
  publishStatus: number
  examRuleGuid: string | null
  examRuleCode: string | null
  examRuleName: string | null
}

export interface ResitCwScheduleResponse {
  resit: ResitContextDto | null
  schedule: ResitCwScheduleDto | null
  studentsStarted: number
  locked: boolean
}

export interface ResitCwScheduleSaveCommand {
  startDateTime: string
  endDateTime: string
  testType: number
  publishStatus: number
  examRuleGuid: string
}

export interface ResitCtScheduleDto {
  resitClassTestScheduleGuid: string
  startDateTime: string
  endDateTime: string
  durationMinutes: number
  testType: number
  publishStatus: number
  examRuleGuid: string | null
  examRuleCode: string | null
  examRuleName: string | null
}

export interface ResitCtScheduleResponse {
  resit: ResitContextDto | null
  schedule: ResitCtScheduleDto | null
  studentsStarted: number
  locked: boolean
}

export interface ResitCtScheduleSaveCommand {
  startDateTime: string
  endDateTime: string
  durationMinutes: number
  testType: number
  publishStatus: number
  examRuleGuid: string
}

// APIs

export function getResitSchedules(params?: { page?: number; pageSize?: number; search?: string }) {
  if (MOCK_AUTH) {
    return Promise.resolve({
      resit: { resitConfigGuid: 'guid', refCode: 'Resit 2026', academicIntakeGuid: 'guid2' },
      schedules: { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 }
    } as ResitSchedulesResponse)
  }
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', params.page.toString())
  if (params?.pageSize) qs.set('pageSize', params.pageSize.toString())
  if (params?.search) qs.set('search', params.search)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return apiGet<ResitSchedulesResponse>(`/api/v1/assessment/resit-schedule${query}`)
}

export function getResitScheduleCourseUnits() {
  if (MOCK_AUTH) return Promise.resolve([] as ResitScheduleCourseUnitDto[])
  return apiGet<ResitScheduleCourseUnitDto[]>(`/api/v1/assessment/resit-schedule/course-units`)
}

export function createResitSchedule(data: ResitScheduleSaveCommand) {
  if (MOCK_AUTH) return Promise.resolve({} as ResitScheduleListItemDto)
  return apiPost<ResitScheduleListItemDto>(`/api/v1/assessment/resit-schedule`, data)
}

export function getResitSchedule(resitScheduleGuid: string) {
  if (MOCK_AUTH) return Promise.resolve({} as ResitScheduleDetailDto)
  return apiGet<ResitScheduleDetailDto>(`/api/v1/assessment/resit-schedule/${resitScheduleGuid}`)
}

export function updateResitSchedule(resitScheduleGuid: string, data: ResitScheduleSaveCommand) {
  if (MOCK_AUTH) return Promise.resolve({} as ResitScheduleListItemDto)
  return apiPut<ResitScheduleListItemDto>(`/api/v1/assessment/resit-schedule/${resitScheduleGuid}`, data)
}

export function getResitCwSchedule() {
  if (MOCK_AUTH) return Promise.resolve({ resit: null, schedule: null, studentsStarted: 0, locked: false } as ResitCwScheduleResponse)
  return apiGet<ResitCwScheduleResponse>(`/api/v1/assessment/resit-cw-schedule`)
}

export function updateResitCwSchedule(data: ResitCwScheduleSaveCommand) {
  if (MOCK_AUTH) return Promise.resolve({} as ResitCwScheduleDto)
  return apiPut<ResitCwScheduleDto>(`/api/v1/assessment/resit-cw-schedule`, data)
}

export function getResitCtSchedule() {
  if (MOCK_AUTH) return Promise.resolve({ resit: null, schedule: null, studentsStarted: 0, locked: false } as ResitCtScheduleResponse)
  return apiGet<ResitCtScheduleResponse>(`/api/v1/assessment/resit-ct-schedule`)
}

export function updateResitCtSchedule(data: ResitCtScheduleSaveCommand) {
  if (MOCK_AUTH) return Promise.resolve({} as ResitCtScheduleDto)
  return apiPut<ResitCtScheduleDto>(`/api/v1/assessment/resit-ct-schedule`, data)
}
export function getExamRules() { return apiGet<any[]>('/api/v1/assessment/exam-rules') }