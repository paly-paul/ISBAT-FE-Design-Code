import { apiPostWithMessage, apiGet, apiGetBlob, apiDeleteWithMessage } from '@/lib/api/client'

export interface UePrintParams {
  programGuid: string
  semesterGuid: string
  courseUnitGuid: string
  intakeGuid: string
  streamGuid?: string | null
  confirm?: boolean
}

export interface UeOutcomeResponse {
  outcome: 'Printed' | 'Reprinted' | 'ExamRuleNotSet' | 'QuestionsNotAvailable' | 'ConfirmationRequired'
  message?: string
}

export interface UeBookletResponse {
  confirmationRequired: boolean
  message?: string
  wasReprint?: boolean
  totalStudentCount?: number
  addedStudentCount?: number
}

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// UE paper types a unit can be printed as: 0 = Theory, 1 = Practical.
export const UE_TYPE = { Theory: 0, Practical: 1 } as const

export interface UeQuestionPrintCourseUnit {
  courseUnitGuid: string
  courseUnitCode: string
  courseUnitName: string
  unitTypeName?: string
  // [0] Theory, [1] Practical, [0, 1] Combined, null for Project / no type
  // (get-course-units.md, 2026-11-17). Only a unit with both offers the
  // Theory/Practical choice.
  allowedUeTypes?: number[] | null
}

// -- Dropdowns --
export function getUeQuestionPrintCourseUnits(
  programGuid: string,
  semesterGuid: string,
  intakeGuid?: string,
  unitTypes?: string[]
): Promise<UeQuestionPrintCourseUnit[]> {
  if (MOCK_AUTH) return Promise.resolve([
    { courseUnitGuid: 'cu-1', courseUnitCode: 'CS101', courseUnitName: 'Introduction to CS', unitTypeName: 'Theory', allowedUeTypes: [0] },
    { courseUnitGuid: 'cu-2', courseUnitCode: 'CS103', courseUnitName: 'Advanced CS', unitTypeName: 'Combined', allowedUeTypes: [0, 1] }
  ])
  const params = new URLSearchParams({
    programGuid: programGuid?.toUpperCase() || '',
    semesterGuid: semesterGuid?.toUpperCase() || ''
  })
  if (intakeGuid) {
    params.append('intakeGuid', intakeGuid.toUpperCase())
  }
  if (unitTypes && unitTypes.length > 0) {
    unitTypes.forEach(ut => params.append('unitTypes', ut))
  }
  return apiGet<UeQuestionPrintCourseUnit[]>(`/api/v1/assessment/ue-question-print/course-units?${params.toString()}`)
}

// -- Theory Actions --
export async function printUeQuestionTheory(data: UePrintParams): Promise<UeOutcomeResponse> {
  if (MOCK_AUTH) return { outcome: 'Printed' as const, message: '' }
  const { data: resData, message: envMessage } = await apiPostWithMessage<any>('/api/v1/assessment/ue-question-print/theory', {
    programGuid: data.programGuid,
    semesterGuid: data.semesterGuid,
    courseUnitGuid: data.courseUnitGuid,
    intakeGuid: data.intakeGuid,
    confirm: Boolean(data.confirm),
  })
  if (resData && typeof resData === 'object') {
    return {
      ...resData,
      outcome: resData.outcome ?? resData.Outcome,
      message: resData.message || envMessage || '',
    }
  }
  return {
    outcome: resData,
    message: envMessage || '',
  }
}

export function downloadUeQuestionTheoryPdf(paramsObj: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock pdf content'], { type: 'application/pdf' }), filename: 'mock-theory.pdf' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid?.toUpperCase() || '',
    semesterGuid: paramsObj.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: paramsObj.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: paramsObj.intakeGuid?.toUpperCase() || ''
  })
  return apiGetBlob(`/api/v1/assessment/ue-question-print/theory/pdf?${params.toString()}`)
}

export function downloadUeQuestionTheoryWord(paramsObj: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock word content'], { type: 'application/msword' }), filename: 'mock-theory.doc' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid?.toUpperCase() || '',
    semesterGuid: paramsObj.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: paramsObj.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: paramsObj.intakeGuid?.toUpperCase() || ''
  })
  return apiGetBlob(`/api/v1/assessment/ue-question-print/theory/word?${params.toString()}`)
}

export function deleteUeQuestionTheory(data: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ data: true, message: 'Deleted successfully' })
  const params = new URLSearchParams({
    programGuid: data.programGuid?.toUpperCase() || '',
    semesterGuid: data.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: data.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: data.intakeGuid?.toUpperCase() || ''
  })
  if (data.confirm !== undefined) params.append('confirm', String(data.confirm))
  // Callers need both `data` (false = confirm step) and the message.
  return apiDeleteWithMessage<boolean>(`/api/v1/assessment/ue-question-print/theory?${params.toString()}`)
}

export function downloadUeQuestionTheoryAnswerKey(paramsObj: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock answer key'], { type: 'application/pdf' }), filename: 'answer-key.pdf' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid?.toUpperCase() || '',
    semesterGuid: paramsObj.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: paramsObj.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: paramsObj.intakeGuid?.toUpperCase() || ''
  })
  return apiGetBlob(`/api/v1/assessment/ue-question-print/theory/answer-key?${params.toString()}`)
}

// -- Booklet Actions --
export async function printUeBooklet(data: UePrintParams): Promise<UeBookletResponse> {
  if (MOCK_AUTH) return { confirmationRequired: false, message: '', wasReprint: false, totalStudentCount: 42, addedStudentCount: 0 }
  const { data: resData, message: envMessage } = await apiPostWithMessage<UeBookletResponse>('/api/v1/assessment/ue-booklet', {
    programGuid: data.programGuid,
    semesterGuid: data.semesterGuid,
    courseUnitGuid: data.courseUnitGuid,
    intakeGuid: data.intakeGuid,
    ...(data.streamGuid ? { streamGuid: data.streamGuid } : {}),
    confirm: Boolean(data.confirm),
  })
  return {
    ...resData,
    message: resData?.message || envMessage || '',
  }
}

export function downloadUeBookletPdf(paramsObj: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock pdf content'], { type: 'application/pdf' }), filename: 'mock-booklet.pdf' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid?.toUpperCase() || '',
    semesterGuid: paramsObj.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: paramsObj.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: paramsObj.intakeGuid?.toUpperCase() || ''
  })
  if (paramsObj.streamGuid) params.append('streamGuid', paramsObj.streamGuid)
  return apiGetBlob(`/api/v1/assessment/ue-booklet/pdf?${params.toString()}`)
}

export function downloadUeBookletAttendance(paramsObj: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock attendance'], { type: 'application/pdf' }), filename: 'attendance.pdf' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid?.toUpperCase() || '',
    semesterGuid: paramsObj.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: paramsObj.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: paramsObj.intakeGuid?.toUpperCase() || ''
  })
  if (paramsObj.streamGuid) params.append('streamGuid', paramsObj.streamGuid)
  return apiGetBlob(`/api/v1/assessment/ue-booklet/attendance/pdf?${params.toString()}`)
}

export function downloadUeBookletCover(paramsObj: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock cover'], { type: 'application/pdf' }), filename: 'cover.pdf' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid?.toUpperCase() || '',
    semesterGuid: paramsObj.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: paramsObj.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: paramsObj.intakeGuid?.toUpperCase() || ''
  })
  if (paramsObj.streamGuid) params.append('streamGuid', paramsObj.streamGuid)
  return apiGetBlob(`/api/v1/assessment/ue-booklet/cover/pdf?${params.toString()}`)
}

// -- Mark Sheet --
export function downloadUeConsolidatedMarkSheet(paramsObj: UePrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock marksheet'], { type: 'application/pdf' }), filename: 'marksheet.pdf' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid?.toUpperCase() || '',
    semesterGuid: paramsObj.semesterGuid?.toUpperCase() || '',
    courseUnitGuid: paramsObj.courseUnitGuid?.toUpperCase() || '',
    intakeGuid: paramsObj.intakeGuid?.toUpperCase() || ''
  })
  return apiGetBlob(`/api/v1/assessment/consolidated-mark-sheet/pdf?${params.toString()}`)
}
