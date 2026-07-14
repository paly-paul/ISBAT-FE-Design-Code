import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Previous mock-only shape (pre GET /api/v1/users/designations integration) —
// kept for reference until a confirmed create/update payload says whether
// the department name string still applies (the real list endpoint only
// returns intDept, a numeric department reference).
// export interface Designation {
//   id: string
//   designationName: string
//   department: string
// }
//
// export type DesignationInput = Omit<Designation, 'id'>
//
// const mockDesignations: Designation[] = [
//   { id: '1', designationName: 'Professor',           department: 'Computer Science' },
//   { id: '2', designationName: 'Associate Professor', department: 'Computer Science' },
//   { id: '3', designationName: 'Senior Lecturer',     department: 'Information Technology' },
//   { id: '4', designationName: 'Lecturer',            department: 'Business Administration' },
//   { id: '5', designationName: 'Assistant Lecturer',  department: 'Civil Engineering' },
//   { id: '6', designationName: 'Teaching Assistant',  department: 'Nursing Sciences' },
// ]
//
// export function getDesignations(): Promise<Designation[]> {
//   return Promise.resolve(mockDesignations)
// }
//
// export function createDesignation(input: DesignationInput): Promise<Designation> {
//   const designation: Designation = { id: String(mockDesignations.length + 1), ...input }
//   mockDesignations.push(designation)
//   return Promise.resolve(designation)
// }
//
// export function updateDesignation(id: string, input: DesignationInput): Promise<Designation> {
//   const existing = mockDesignations.find(d => d.id === id)
//   if (!existing) return Promise.reject(new Error('Designation not found'))
//   Object.assign(existing, input)
//   return Promise.resolve(existing)
// }

// Real backend shape returned by GET /api/v1/users/designations (paginated
// list) — id is now intDesignation, and department is a numeric intDept
// reference rather than a department name string.
export interface Designation {
  intDesignation: number
  designationName: string
  intDept: number
}

export type DesignationInput = Omit<Designation, 'intDesignation'>

interface DesignationListResponse {
  items: Designation[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const mockDesignations: Designation[] = [
  { intDesignation: 1, designationName: 'Professor',           intDept: 1 },
  { intDesignation: 2, designationName: 'Associate Professor', intDept: 1 },
  { intDesignation: 3, designationName: 'Senior Lecturer',     intDept: 2 },
  { intDesignation: 4, designationName: 'Lecturer',            intDept: 3 },
  { intDesignation: 5, designationName: 'Assistant Lecturer',  intDept: 5 },
  { intDesignation: 6, designationName: 'Teaching Assistant',  intDept: 6 },
]
let mockDesignationSeq = mockDesignations.length + 1

export function getDesignations(page = 1, pageSize = 10): Promise<Designation[]> {
  if (MOCK_AUTH) return Promise.resolve(mockDesignations)
  return apiGet<DesignationListResponse | null>(`/api/v1/users/designations?page=${page}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

export function createDesignation(input: DesignationInput): Promise<Designation> {
  if (MOCK_AUTH) {
    const designation: Designation = { intDesignation: mockDesignationSeq++, ...input }
    mockDesignations.push(designation)
    return Promise.resolve(designation)
  }
  return apiPost<Designation>('/api/v1/users/designations', input)
}

export function updateDesignation(id: string, input: DesignationInput): Promise<Designation> {
  if (MOCK_AUTH) {
    const existing = mockDesignations.find(d => String(d.intDesignation) === id)
    if (!existing) return Promise.reject(new Error('Designation not found'))
    Object.assign(existing, input)
    return Promise.resolve(existing)
  }
  return apiPut<Designation>(`/api/v1/users/designations/${id}`, input)
}

// DELETE /api/v1/users/designations/{id} — soft-delete (data: true on success).
export function deleteDesignation(id: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockDesignations.findIndex(d => String(d.intDesignation) === id)
    if (index === -1) return Promise.reject(new Error('Designation not found'))
    mockDesignations.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/users/designations/${id}`)
}
