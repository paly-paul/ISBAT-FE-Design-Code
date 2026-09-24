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
  // return apiGet<UeDetailedMarksGridDto>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}`)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        universityExamGuid: universityExamGuid,
        isVerified: false, // Change this to test Verified state
        examName: 'CSE 1301 - Algorithms (Standard/70m)',
        maxMarks: 100,
        passMarks: 50,
        students: [
          {
            studentGuid: 'std-1',
            matchingCode: '4821-7734',
            studentRegNo: 'BCS/2024/0031',
            studentName: 'Amara Nkosi',
            iaTotal: 23.4,
            iaPass: true,
            ueRawMark: 72,
            ueConvertedMark: 50.4,
            uePass: true,
            isAbsent: false,
            result: 'PASS',
            iaPercentage: 78,
            uePercentage: 72
          },
          {
            studentGuid: 'std-2',
            matchingCode: '4822-9901',
            studentRegNo: 'BCS/2024/0017',
            studentName: 'Emmanuel Okello',
            iaTotal: 21.6,
            iaPass: true,
            ueRawMark: 58,
            ueConvertedMark: 40.6,
            uePass: true,
            isAbsent: false,
            result: 'PASS',
            iaPercentage: 72,
            uePercentage: 58
          },
          {
            studentGuid: 'std-3',
            matchingCode: '4823-3312',
            studentRegNo: 'BCS/2024/0058',
            studentName: 'David Ssemwogerere',
            iaTotal: 28.8,
            iaPass: true,
            ueRawMark: 42,
            ueConvertedMark: 29.4,
            uePass: false,
            isAbsent: false,
            result: 'FAIL (UE)',
            iaPercentage: 96,
            uePercentage: 42
          }
        ]
      })
    }, 800)
  })
}

export function saveStudentUeMark(universityExamGuid: string, studentGuid: string, payload: { mark: number | null, isAbsent: boolean }): Promise<void> {
  // return apiPut<void>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}/students/${studentGuid}`, payload)
  return new Promise((resolve) => setTimeout(resolve, 300))
}

export function verifyUeMarks(universityExamGuid: string): Promise<VerifyUeMarksResultDto> {
  // return apiPost<VerifyUeMarksResultDto>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}/verify`, {})
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ universityExamGuid, isVerified: true })
    }, 1000)
  })
}
