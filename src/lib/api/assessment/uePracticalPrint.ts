import { apiPost, apiGetBlob, apiDelete } from '@/lib/api/client'

export interface UePracticalPrintParams {
  programGuid: string
  semesterGuid: string
  courseUnitGuid: string
  intakeGuid: string
  confirm?: boolean
}

export interface UePracticalOutcomeResponse {
  outcome: 'Printed' | 'Reprinted' | 'ExamRuleNotSet' | 'QuestionsNotAvailable' | 'ConfirmationRequired'
  message?: string
}

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export function printUeQuestionPractical(data: UePracticalPrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ outcome: 'Printed' as const, message: '' })
  return apiPost<UePracticalOutcomeResponse>('/api/v1/assessment/ue-question-print/practical', data)
}

export function downloadUeQuestionPracticalPdf(paramsObj: UePracticalPrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock pdf content'], { type: 'application/pdf' }), filename: 'mock-practical.pdf' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid || '',
    semesterGuid: paramsObj.semesterGuid || '',
    courseUnitGuid: paramsObj.courseUnitGuid || '',
    intakeGuid: paramsObj.intakeGuid || ''
  })
  return apiGetBlob(`/api/v1/assessment/ue-question-print/practical/pdf?${params.toString()}`)
}

export function downloadUeQuestionPracticalWord(paramsObj: UePracticalPrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ blob: new Blob(['mock word content'], { type: 'application/msword' }), filename: 'mock-practical.doc' })
  const params = new URLSearchParams({
    programGuid: paramsObj.programGuid || '',
    semesterGuid: paramsObj.semesterGuid || '',
    courseUnitGuid: paramsObj.courseUnitGuid || '',
    intakeGuid: paramsObj.intakeGuid || ''
  })
  return apiGetBlob(`/api/v1/assessment/ue-question-print/practical/word?${params.toString()}`)
}

export function deleteUeQuestionPractical(data: UePracticalPrintParams) {
  if (MOCK_AUTH) return Promise.resolve({ data: true, message: 'Deleted successfully' })
  const params = new URLSearchParams({
    programGuid: data.programGuid || '',
    semesterGuid: data.semesterGuid || '',
    courseUnitGuid: data.courseUnitGuid || '',
    intakeGuid: data.intakeGuid || ''
  })
  if (data.confirm !== undefined) params.append('confirm', String(data.confirm))
  return apiDelete<any>(`/api/v1/assessment/ue-question-print/practical?${params.toString()}`)
}
