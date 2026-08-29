import { apiDelete, apiGet, apiPostForm, AuthError } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// students/refugee/*.md gives no JSON response sample for any of these five
// endpoints — prose only. Shapes below are modeled on the closest documented
// sibling (DropoutStudentDto, itself confirmed via a real sample) for the
// list/eligible endpoints, and on the assign request's own fields for the
// details DTO. Flagged unconfirmed, same caution as sponsor.ts's
// mandatoryFeeCheck note — correct once seen live.
export interface RefugeeStudentSummaryDto {
  studentGuid: string
  studentRegNo: string
  studentName: string
  programName: string | null
  semesterName: string | null
  batchCode: string | null
}

export interface RefugeeDetailsDto {
  studentGuid: string
  intCountryCode: number
  refugeeId: string
  // Field name/presence unconfirmed — the docs only say a "supporting
  // document uploaded at assignment" is part of the record, without naming
  // the field. Treated as optional/unknown rather than relied on.
  documentPath?: string | null
}

export interface AssignRefugeeStatusRequest {
  studentGuid: string
  intCountryCode: number
  refugeeId: string
  document: File
}

const mockEligible: RefugeeStudentSummaryDto[] = [
  { studentGuid: 'stu-mock-1', studentRegNo: '011240104', studentName: 'Aisha Nakamya', programName: 'BSc. Computer Science', semesterName: 'Semester 1', batchCode: 'BSC-IT-S26-DA' },
  { studentGuid: 'stu-mock-2', studentRegNo: '012221279', studentName: 'Okello James', programName: 'BBA Business Administration', semesterName: 'Semester 2', batchCode: 'BBA-2024-JAN-A' },
]
const mockRefugees: Record<string, RefugeeDetailsDto> = {}

// Unpaged per the docs — the full set comes back in one call, so no
// page/pageSize params here.
export function getEligibleStudents(): Promise<RefugeeStudentSummaryDto[]> {
  if (MOCK_AUTH) return Promise.resolve(mockEligible.filter(s => !mockRefugees[s.studentGuid]))
  return apiGet<RefugeeStudentSummaryDto[] | null>('/api/v1/students/refugee/eligible').then(data => data ?? [])
}

export function getRefugeeStudents(): Promise<RefugeeStudentSummaryDto[]> {
  if (MOCK_AUTH) return Promise.resolve(mockEligible.filter(s => !!mockRefugees[s.studentGuid]))
  return apiGet<RefugeeStudentSummaryDto[] | null>('/api/v1/students/refugee').then(data => data ?? [])
}

// A student with no refugee-status record is the common case (404
// `not_found` per the docs) — resolve to null rather than throwing.
export function getStudentRefugeeDetails(studentGuid: string): Promise<RefugeeDetailsDto | null> {
  if (MOCK_AUTH) return Promise.resolve(mockRefugees[studentGuid] ?? null)
  return apiGet<RefugeeDetailsDto>(`/api/v1/students/refugee/${studentGuid}`).catch(err => {
    if (err instanceof AuthError && err.code === 'not_found') return null
    throw err
  })
}

// multipart/form-data — the document is mandatory and validated server-side
// (post-assign-refugee-status.md), unlike most file uploads in this app.
export function assignRefugeeStatus(payload: AssignRefugeeStatusRequest): Promise<RefugeeDetailsDto> {
  if (MOCK_AUTH) {
    const row: RefugeeDetailsDto = { studentGuid: payload.studentGuid, intCountryCode: payload.intCountryCode, refugeeId: payload.refugeeId, documentPath: payload.document.name }
    mockRefugees[payload.studentGuid] = row
    return Promise.resolve(row)
  }
  const formData = new FormData()
  formData.append('intCountryCode', String(payload.intCountryCode))
  formData.append('refugeeId', payload.refugeeId)
  formData.append('document', payload.document)
  return apiPostForm<RefugeeDetailsDto>(`/api/v1/students/refugee/${payload.studentGuid}`, formData)
}

// No restore — re-granting requires re-uploading the document via assign
// (delete-refugee-status.md).
export function removeRefugeeStatus(studentGuid: string): Promise<void> {
  if (MOCK_AUTH) { delete mockRefugees[studentGuid]; return Promise.resolve() }
  return apiDelete<void>(`/api/v1/students/refugee/${studentGuid}`)
}
