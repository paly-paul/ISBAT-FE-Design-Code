import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed via a real GET /api/v1/students response. programName/
// semesterName/batchCode come back as empty strings (not null) when unset —
// treat '' the same as missing when rendering.
export interface StudentDto {
  studentGuid: string
  studentRegNo: string
  studentNum: string
  studentName: string
  programName: string
  semesterName: string
  batchCode: string
}

// Confirmed via a real GET /api/v1/students/:guid response. Everything past
// batchCode is new versus the list DTO and largely unglossed on the wire —
// displayed raw rather than translated, same "don't invent a label mapping"
// caution used elsewhere in this app (e.g. vetting's gender/enquiryStatus
// ints). studActive reads as a real active/inactive flag (1/0) by naming
// convention only — not confirmed against docs, flagged here rather than
// silently assumed.
export interface StudentDetailDto extends StudentDto {
  regStatusName: string
  iStatus: number
  studActive: number
  regDate: string | null
  discountGuid: string | null
  calcType: string | null
  amtPer: number | null
  intSem: number | null
  discountStatus: string | null
  discountEffectiveFromSemesterGuid: string | null
  discountCancelledAtSemesterGuid: string | null
  intType: number | null
  regSemesterGuid: string | null
  currentSemesterGuid: string | null
  aptechCe: boolean | null
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface StudentListFilters {
  searchTerm?: string
}

const mockStudents: StudentDto[] = [
  { studentGuid: 'stu-mock-1', studentNum: 'ISB/2024/BSCS/0142', studentRegNo: '011240104', studentName: 'Aisha Nakamya', programName: 'BSc. Computer Science', semesterName: 'Semester 1', batchCode: 'BSC-IT-S26-DA' },
  { studentGuid: 'stu-mock-2', studentNum: 'ISB/2024/BBA/0089', studentRegNo: '012221279', studentName: 'Okello James', programName: 'BBA Business Administration', semesterName: 'Semester 2', batchCode: 'BBA-2024-JAN-A' },
  { studentGuid: 'stu-mock-3', studentNum: 'ISB/2023/BSIT/0201', studentRegNo: '011250093', studentName: 'Grace Nampijja', programName: 'BSc. Information Technology', semesterName: 'Semester 3', batchCode: 'BSIT-2023-SEP-B' },
  { studentGuid: 'stu-mock-4', studentNum: 'ISB/2021/NUR/0034', studentRegNo: '012240747', studentName: 'Brian Ssemanda', programName: 'Diploma in Nursing', semesterName: 'Semester 4', batchCode: 'NUR-2025-MAY-A' },
]

export function getStudents(page: number, pageSize: number, filters?: StudentListFilters): Promise<PagedResult<StudentDto>> {
  if (MOCK_AUTH) {
    const term = filters?.searchTerm?.trim().toLowerCase()
    const items = term
      ? mockStudents.filter(s => `${s.studentNum} ${s.studentRegNo} ${s.studentName}`.toLowerCase().includes(term))
      : mockStudents
    return Promise.resolve({ items, totalCount: items.length, pageNumber: page, pageSize })
  }
  const params = new URLSearchParams()
  if (filters?.searchTerm?.trim()) params.set('searchTerm', filters.searchTerm.trim())
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  return apiGet<PagedResult<StudentDto> | null>(`/api/v1/students?${params.toString()}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: page, pageSize })
}

export function getStudentByGuid(guid: string): Promise<StudentDetailDto> {
  if (MOCK_AUTH) {
    const found = mockStudents.find(s => s.studentGuid === guid)
    if (!found) throw new Error('not_found')
    return Promise.resolve({
      ...found,
      regStatusName: '', iStatus: 0, studActive: 1, regDate: null,
      discountGuid: null, calcType: null, amtPer: null, intSem: null,
      discountStatus: null, discountEffectiveFromSemesterGuid: null, discountCancelledAtSemesterGuid: null,
      intType: 1, regSemesterGuid: null, currentSemesterGuid: null, aptechCe: null,
    })
  }
  return apiGet<StudentDetailDto>(`/api/v1/students/${guid}`)
}
