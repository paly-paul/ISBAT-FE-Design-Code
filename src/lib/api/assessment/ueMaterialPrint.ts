import { apiPost, apiGet, apiGetBlob } from '@/lib/api/client'

export interface UeBookletPrintRequest {
  programGuid: string
  semesterGuid: string
  courseUnitGuid: string
  intakeGuid: string
  streamGuid?: string | null
}

export interface UeBookletPrintResponse {
  wasReprint: boolean
  totalStudentCount: number
  addedStudentCount: number
}

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export function printUeBooklet(data: UeBookletPrintRequest) {
  if (MOCK_AUTH) return Promise.resolve({ wasReprint: false, totalStudentCount: 42, addedStudentCount: 42 })
  return apiPost<UeBookletPrintResponse>('/api/v1/assessment/ue-booklet', data)
}

export function downloadUeBookletPdf(data: UeBookletPrintRequest) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock pdf content'], { type: 'application/pdf' }), filename: 'mock-booklet.pdf' })
  // Query parameters
  const params = new URLSearchParams({
    programGuid: data.programGuid,
    semesterGuid: data.semesterGuid,
    courseUnitGuid: data.courseUnitGuid,
    intakeGuid: data.intakeGuid,
  })
  if (data.streamGuid) {
    params.append('streamGuid', data.streamGuid)
  }
  return apiGetBlob(`/api/v1/assessment/ue-booklet/pdf?${params.toString()}`)
}

export interface UeQuestionPrintResponse {
  outcome: 'Printed' | 'Reprinted' | 'ExamRuleNotSet' | 'QuestionsNotAvailable'
}

export function printUeQuestionTheory(data: UeBookletPrintRequest) {
  if (MOCK_AUTH) return Promise.resolve({ outcome: 'Printed' as const })
  return apiPost<UeQuestionPrintResponse>('/api/v1/assessment/ue-question-print/theory', data)
}

export function downloadUeQuestionTheoryWord(data: UeBookletPrintRequest) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock word content'], { type: 'application/msword' }), filename: 'mock-theory.doc' })
  const params = new URLSearchParams({
    programGuid: data.programGuid,
    semesterGuid: data.semesterGuid,
    courseUnitGuid: data.courseUnitGuid,
    intakeGuid: data.intakeGuid,
  })
  if (data.streamGuid) {
    params.append('streamGuid', data.streamGuid)
  }
  return apiGetBlob(`/api/v1/assessment/ue-question-print/theory/word?${params.toString()}`)
}

export function printUeQuestionPractical(data: UeBookletPrintRequest) {
  if (MOCK_AUTH) return Promise.resolve({ outcome: 'Printed' as const })
  return apiPost<UeQuestionPrintResponse>('/api/v1/assessment/ue-question-print/practical', data)
}

export function downloadUeQuestionPracticalWord(data: UeBookletPrintRequest) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock word content'], { type: 'application/msword' }), filename: 'mock-practical.doc' })
  const params = new URLSearchParams({
    programGuid: data.programGuid,
    semesterGuid: data.semesterGuid,
    courseUnitGuid: data.courseUnitGuid,
    intakeGuid: data.intakeGuid,
  })
  if (data.streamGuid) {
    params.append('streamGuid', data.streamGuid)
  }
  return apiGetBlob(`/api/v1/assessment/ue-question-print/practical/word?${params.toString()}`)
}
