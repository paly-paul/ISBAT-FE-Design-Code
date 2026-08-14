import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Represents a repetition tag record returned by the API.
export interface RepetitionTag {
  courseUnitRepetitionGuid: string
  tagCode: string
  tagName: string
  intLevel: number
  levelCode: string
  levelName: string
}

// In-memory list used only when mock auth is enabled.
const mockRepetitionTags: RepetitionTag[] = [
  { courseUnitRepetitionGuid: '1', tagCode: 'RT-CU-001', tagName: 'Standard repeat for failed course units',     intLevel: 3, levelCode: 'BACH', levelName: "Bachelor's Degree" },
  { courseUnitRepetitionGuid: '2', tagCode: 'RT-CU-002', tagName: 'Supplementary exam carry-forward repeat',      intLevel: 2, levelCode: 'DIP',  levelName: 'Diploma' },
  { courseUnitRepetitionGuid: '3', tagCode: 'RT-CU-003', tagName: 'Medical or special consideration repeat',      intLevel: 5, levelCode: 'MAST', levelName: "Master's Degree" },
  { courseUnitRepetitionGuid: '4', tagCode: 'RT-CU-004', tagName: 'Retake after academic probation',              intLevel: 3, levelCode: 'BACH', levelName: "Bachelor's Degree" },
  { courseUnitRepetitionGuid: '5', tagCode: 'RT-CU-005', tagName: 'Credit exemption repeat for lateral entrants', intLevel: 4, levelCode: 'PGD',  levelName: 'Postgraduate Diploma' },
]

// Fetch all repetition tags.
export function getRepetitionTags(): Promise<RepetitionTag[]> {
  if (MOCK_AUTH) return Promise.resolve(mockRepetitionTags)
  return apiGet<any>('/api/v1/academic/course-unit-repetitions').then(data => Array.isArray(data) ? data : Array.isArray(data?.courseUnitRepetitions) ? data.courseUnitRepetitions : [])
}

// Payload used when creating or updating a repetition tag.
export interface RepetitionTagInput {
  tagCode: string
  tagName: string
  programLevelGuid: string
}

let mockRepetitionTagSeq = mockRepetitionTags.length + 1

// Create a new repetition tag and return the saved record.
export function createRepetitionTag(input: RepetitionTagInput): Promise<RepetitionTag> {
  if (MOCK_AUTH) {
    const tag: RepetitionTag = {
      courseUnitRepetitionGuid: String(mockRepetitionTagSeq++),
      tagCode: input.tagCode,
      tagName: input.tagName,
      // intLevel/levelCode/levelName are server-resolved from
      // programLevelGuid on the real GET response — no local programme-level
      // lookup to cross-reference against here.
      intLevel: 0,
      levelCode: '',
      levelName: '',
    }
    mockRepetitionTags.push(tag)
    return Promise.resolve(tag)
  }
  return apiPost<RepetitionTag>('/api/v1/academic/course-unit-repetitions', input)
}

// Fetch one repetition tag by its GUID.
export function getRepetitionTagById(guid: string): Promise<RepetitionTag> {
  if (MOCK_AUTH) {
    const existing = mockRepetitionTags.find(t => t.courseUnitRepetitionGuid === guid)
    if (!existing) return Promise.reject(new Error('Repetition tag not found'))
    return Promise.resolve(existing)
  }
  return apiGet<RepetitionTag>(`/api/v1/academic/course-unit-repetitions/${guid}`)
}

// Update a repetition tag by GUID and return the updated record.
export function updateRepetitionTag(guid: string, input: RepetitionTagInput): Promise<RepetitionTag> {
  if (MOCK_AUTH) {
    const existing = mockRepetitionTags.find(t => t.courseUnitRepetitionGuid === guid)
    if (!existing) return Promise.reject(new Error('Repetition tag not found'))
    Object.assign(existing, input)
    return Promise.resolve(existing)
  }
  return apiPut<RepetitionTag>(`/api/v1/academic/course-unit-repetitions/${guid}`, input)
}

// Delete a repetition tag and return true when the API confirms success.
export function deleteRepetitionTag(guid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockRepetitionTags.findIndex(t => t.courseUnitRepetitionGuid === guid)
    if (index === -1) return Promise.reject(new Error('Repetition tag not found'))
    mockRepetitionTags.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/course-unit-repetitions/${guid}`)
}
