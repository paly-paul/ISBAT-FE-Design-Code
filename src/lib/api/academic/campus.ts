import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Previous mock-only shape (pre GET /api/v1/academic/campus integration) —
// kept for reference. Field set is otherwise identical to the real API,
// just id -> campusGuid.
// export interface Campus {
//   id: string
//   campusCode: string
//   campusName: string
//   location: string
//   address: string
//   contact: string
// }
//
// export type CampusInput = Omit<Campus, 'id'>
//
// const mockCampuses: Campus[] = [
//   { id: '1', campusCode: 'MKL', campusName: 'Makerere Campus',     location: 'Kampala', address: 'Plot 5, Makerere Hill Road',  contact: '+256 414 530 000' },
//   { id: '2', campusCode: 'KAM', campusName: 'Kampala City Campus', location: 'Kampala', address: '14 Kampala Road, City Centre', contact: '+256 414 230 100' },
//   { id: '3', campusCode: 'MBR', campusName: 'Mbarara Campus',      location: 'Mbarara', address: 'Kakoba Road, Mbarara',         contact: '+256 485 660 200' },
//   { id: '4', campusCode: 'GUL', campusName: 'Gulu Campus',         location: 'Gulu',    address: 'Acholi Quarters, Gulu',        contact: '+256 471 432 100' },
// ]
//
// export function getCampuses(): Promise<Campus[]> {
//   return Promise.resolve(mockCampuses)
// }
//
// export function createCampus(input: CampusInput): Promise<Campus> {
//   const campus: Campus = { id: String(mockCampuses.length + 1), ...input }
//   mockCampuses.push(campus)
//   return Promise.resolve(campus)
// }
//
// export function updateCampus(id: string, input: CampusInput): Promise<Campus> {
//   const existing = mockCampuses.find(c => c.id === id)
//   if (!existing) return Promise.reject(new Error('Campus not found'))
//   Object.assign(existing, input)
//   return Promise.resolve(existing)
// }

// Real backend shape returned by GET /api/v1/academic/campus (paginated
// list) — id is now campusGuid.
export interface Campus {
  campusGuid: string
  campusCode: string
  campusName: string
  location: string
  address: string
  contact: string
}

export type CampusInput = Omit<Campus, 'campusGuid'>

interface CampusListResponse {
  items: Campus[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const mockCampuses: Campus[] = [
  { campusGuid: '1', campusCode: 'MKL', campusName: 'Makerere Campus',     location: 'Kampala', address: 'Plot 5, Makerere Hill Road',  contact: '+256 414 530 000' },
  { campusGuid: '2', campusCode: 'KAM', campusName: 'Kampala City Campus', location: 'Kampala', address: '14 Kampala Road, City Centre', contact: '+256 414 230 100' },
  { campusGuid: '3', campusCode: 'MBR', campusName: 'Mbarara Campus',      location: 'Mbarara', address: 'Kakoba Road, Mbarara',         contact: '+256 485 660 200' },
  { campusGuid: '4', campusCode: 'GUL', campusName: 'Gulu Campus',         location: 'Gulu',    address: 'Acholi Quarters, Gulu',        contact: '+256 471 432 100' },
]
let mockCampusSeq = mockCampuses.length + 1

export function getCampuses(page = 1, pageSize = 10): Promise<Campus[]> {
  if (MOCK_AUTH) return Promise.resolve(mockCampuses)
  return apiGet<CampusListResponse | null>(`/api/v1/academic/campus?page=${page}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

// Lightweight lookup for the campus name filter dropdown — confirmed via GET
// /api/v1/academic/campus/dropdown. Only campusGuid/campusName, unlike the
// full paginated list from getCampuses above.
export interface CampusDropdownItem {
  campusGuid: string
  campusName: string
}

export function getCampusDropdown(): Promise<CampusDropdownItem[]> {
  if (MOCK_AUTH) return Promise.resolve(mockCampuses.map(({ campusGuid, campusName }) => ({ campusGuid, campusName })))
  return apiGet<CampusDropdownItem[] | null>('/api/v1/academic/campus/dropdown').then(data => data ?? [])
}

// Confirmed via POST /api/v1/academic/campus — request/response shape is
// identical to CampusInput/Campus, no extra or renamed fields.
export function createCampus(input: CampusInput): Promise<Campus> {
  if (MOCK_AUTH) {
    const campus: Campus = { campusGuid: String(mockCampusSeq++), ...input }
    mockCampuses.push(campus)
    return Promise.resolve(campus)
  }
  return apiPost<Campus>('/api/v1/academic/campus', input)
}

// Confirmed via PUT /api/v1/academic/campus/:campusGuid — same body shape as
// create. Fails with 400 validation_error or 404 not_found (bad/unknown
// campusGuid), both surfaced to the Edit modal via AuthError.
export function updateCampus(id: string, input: CampusInput): Promise<Campus> {
  if (MOCK_AUTH) {
    const existing = mockCampuses.find(c => c.campusGuid === id)
    if (!existing) return Promise.reject(new Error('Campus not found'))
    Object.assign(existing, input)
    return Promise.resolve(existing)
  }
  return apiPut<Campus>(`/api/v1/academic/campus/${id}`, input)
}

// Confirmed via DELETE /api/v1/academic/campus/:campusGuid — soft-delete,
// data is null on success. Fails with 404 not_found for an unknown campusGuid.
export function deleteCampus(id: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockCampuses.findIndex(c => c.campusGuid === id)
    if (index === -1) return Promise.reject(new Error('Campus not found'))
    mockCampuses.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/campus/${id}`)
}
