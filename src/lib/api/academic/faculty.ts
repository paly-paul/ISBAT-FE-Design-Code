// Mock-only for now — the academic master endpoints aren't implemented on
// the real backend yet. Swap these for apiGet/apiPost calls (see
// src/lib/api/client.ts) once the API is available.

export interface Faculty {
  id: string
  code: string
  name: string
  dean: string
  programmes: number
}

export type FacultyInput = Omit<Faculty, 'id' | 'programmes'>

const mockFaculties: Faculty[] = [
  { id: '1', code: 'FCT', name: 'Faculty of Computing & Technology', dean: 'Dr. Ssekibuule Ronald', programmes: 3 },
  { id: '2', code: 'FBM', name: 'Faculty of Business & Management', dean: 'Prof. Mukasa Charles', programmes: 4 },
  { id: '3', code: 'FEN', name: 'Faculty of Engineering', dean: 'Dr. Tendo Patrick', programmes: 2 },
]

export function getFaculties(): Promise<Faculty[]> {
  return Promise.resolve(mockFaculties)
}

export function createFaculty(input: FacultyInput): Promise<Faculty> {
  const faculty: Faculty = { id: String(mockFaculties.length + 1), programmes: 0, ...input }
  mockFaculties.push(faculty)
  return Promise.resolve(faculty)
}

export function updateFaculty(id: string, input: FacultyInput): Promise<Faculty> {
  const existing = mockFaculties.find(f => f.id === id)
  if (!existing) return Promise.reject(new Error('Faculty not found'))
  Object.assign(existing, input)
  return Promise.resolve(existing)
}
