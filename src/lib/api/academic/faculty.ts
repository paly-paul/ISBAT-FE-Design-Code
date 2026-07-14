import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Previous mock-only shape (pre GET /api/v1/academic/faculties integration) —
// kept for reference. The real API has a different field set (facultyGuid,
// campusGuid/campusName, deanEmployeeGuid/deanName instead of id/dean, and no
// programmes count), so create/update below still operate on the new shape
// with mock data until POST/PUT are wired to the real endpoints.
// export interface Faculty {
//   id: string
//   code: string
//   name: string
//   dean: string
//   programmes: number
// }
//
// export type FacultyInput = Omit<Faculty, 'id' | 'programmes'>
//
// const mockFaculties: Faculty[] = [
//   { id: '1', code: 'FCT', name: 'Faculty of Computing & Technology', dean: 'Dr. Ssekibuule Ronald', programmes: 3 },
//   { id: '2', code: 'FBM', name: 'Faculty of Business & Management', dean: 'Prof. Mukasa Charles', programmes: 4 },
//   { id: '3', code: 'FEN', name: 'Faculty of Engineering', dean: 'Dr. Tendo Patrick', programmes: 2 },
// ]
//
// export function getFaculties(): Promise<Faculty[]> {
//   return Promise.resolve(mockFaculties)
// }
//
// export function createFaculty(input: FacultyInput): Promise<Faculty> {
//   const faculty: Faculty = { id: String(mockFaculties.length + 1), programmes: 0, ...input }
//   mockFaculties.push(faculty)
//   return Promise.resolve(faculty)
// }
//
// export function updateFaculty(id: string, input: FacultyInput): Promise<Faculty> {
//   const existing = mockFaculties.find(f => f.id === id)
//   if (!existing) return Promise.reject(new Error('Faculty not found'))
//   Object.assign(existing, input)
//   return Promise.resolve(existing)
// }

// Real backend shape returned by GET /api/v1/academic/faculties (paginated
// list) — id is now facultyGuid; dean is split into deanEmployeeGuid/deanName
// (deanName can be null); campusGuid/campusName are new; programmes isn't
// returned by this endpoint.
export interface Faculty {
  facultyGuid: string
  facultyCode: string
  facultyName: string
  campusGuid: string
  campusName: string
  deanEmployeeGuid: string | null
  deanName: string | null
}

// Confirmed via POST /api/v1/academic/faculties and reused as-is for PUT
// /api/v1/academic/faculties/:facultyGuid (same body/validation per the
// docs). The dean is chosen by employee (deanEmployeeGuid), not typed as a
// name — deanName is a read-only field the backend derives for display, not
// part of the input.
export type FacultyInput = {
  facultyCode: string
  facultyName: string
  campusGuid: string
  deanEmployeeGuid: string | null
}

interface FacultyListResponse {
  items: Faculty[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const mockFaculties: Faculty[] = [
  { facultyGuid: '1', facultyCode: 'FCT', facultyName: 'Faculty of Computing & Technology', campusGuid: '1', campusName: 'Makerere Campus', deanEmployeeGuid: null, deanName: 'Dr. Ssekibuule Ronald' },
  { facultyGuid: '2', facultyCode: 'FBM', facultyName: 'Faculty of Business & Management', campusGuid: '2', campusName: 'Kampala City Campus', deanEmployeeGuid: null, deanName: 'Prof. Mukasa Charles' },
  { facultyGuid: '3', facultyCode: 'FEN', facultyName: 'Faculty of Engineering', campusGuid: '3', campusName: 'Mbarara Campus', deanEmployeeGuid: null, deanName: 'Dr. Tendo Patrick' },
]
let mockFacultySeq = mockFaculties.length + 1

export function getFaculties(page = 1, pageSize = 10): Promise<Faculty[]> {
  if (MOCK_AUTH) return Promise.resolve(mockFaculties)
  return apiGet<FacultyListResponse | null>(`/api/v1/academic/faculties?page=${page}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

export function createFaculty(input: FacultyInput): Promise<Faculty> {
  if (MOCK_AUTH) {
    // campusName isn't known here in mock mode (no cross-module lookup) —
    // fine for offline dev since it isn't exercised against a real backend.
    const faculty: Faculty = {
      facultyGuid: String(mockFacultySeq++),
      facultyCode: input.facultyCode,
      facultyName: input.facultyName,
      campusGuid: input.campusGuid,
      campusName: '',
      deanEmployeeGuid: input.deanEmployeeGuid,
      deanName: null,
    }
    mockFaculties.push(faculty)
    return Promise.resolve(faculty)
  }
  return apiPost<Faculty>('/api/v1/academic/faculties', input)
}

// Confirmed via PUT /api/v1/academic/faculties/:facultyGuid — same body as
// create. Fails with 400 validation_error or 404 not_found (unknown
// facultyGuid), both surfaced to the Edit modal via AuthError.
export function updateFaculty(id: string, input: FacultyInput): Promise<Faculty> {
  if (MOCK_AUTH) {
    const existing = mockFaculties.find(f => f.facultyGuid === id)
    if (!existing) return Promise.reject(new Error('Faculty not found'))
    existing.facultyCode = input.facultyCode
    existing.facultyName = input.facultyName
    existing.campusGuid = input.campusGuid
    existing.deanEmployeeGuid = input.deanEmployeeGuid
    return Promise.resolve(existing)
  }
  return apiPut<Faculty>(`/api/v1/academic/faculties/${id}`, input)
}

// Confirmed via DELETE /api/v1/academic/faculties/:facultyGuid — data is
// null on success. Fails with 404 not_found for an unknown facultyGuid.
export function deleteFaculty(id: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockFaculties.findIndex(f => f.facultyGuid === id)
    if (index === -1) return Promise.reject(new Error('Faculty not found'))
    mockFaculties.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/faculties/${id}`)
}
