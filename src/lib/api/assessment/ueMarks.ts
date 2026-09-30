import { apiGet, apiPost, apiPut } from '../client'

export interface UeDetailedMarkStudentDto {
  studentGuid: string
  matchingCode: string | null
  studentRegNo: string
  studentName: string
  iaTotal: number | null
  iaPass: boolean
  ueRawMark: number | null
  ueConvertedMark: number | null
  uePass: boolean
  isAbsent: boolean
  result: string
  iaPercentage: number | null
  uePercentage: number | null
}

export interface UeDetailedMarksGridDto {
  universityExamGuid: string
  isVerified: boolean
  examName: string
  maxMarks: number
  passMarks: number
  students: UeDetailedMarkStudentDto[]
}

export interface VerifyUeMarksResultDto {
  universityExamGuid: string
  isVerified: boolean
}

export function getUeDetailedMarks(universityExamGuid: string): Promise<UeDetailedMarksGridDto> {
  return apiGet<UeDetailedMarksGridDto>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}`)
}

export function saveStudentUeMark(universityExamGuid: string, studentGuid: string, payload: { mark: number | null, isAbsent: boolean }): Promise<void> {
  return apiPut<void>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}/students/${studentGuid}`, payload)
}

export function verifyUeMarks(universityExamGuid: string): Promise<VerifyUeMarksResultDto> {
  return apiPost<VerifyUeMarksResultDto>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}/verify`, {})
}
