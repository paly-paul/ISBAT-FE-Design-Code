import { AuthError, apiDelete, apiPost, apiPut } from '../client'
import { getPagedList } from '../pagedList'
import type { PaginatedItems } from '@/lib/pagination'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Course levels (erp-docs/api/userrole-service/course-levels): the
// qualifications a designation can name as its minimum qualification. Each is
// only a name. Int-keyed: PUT/DELETE take intLevel, while courseLevelGuid is
// what other screens send when they pick one. status is always 2 (active) and
// isn't editable.
export interface CourseLevel {
  intLevel: number
  courseLevelGuid: string
  levelName: string
  status: number
}

export interface CourseLevelInput {
  levelName: string
}

export const COURSE_LEVEL_NAME_MAX = 100

// The seven levels carried over from the old system.
const mockCourseLevels: CourseLevel[] = ['A Level', 'Bachelors', 'Certificate', 'Diploma', 'Masters', 'PhD', 'Postgraduate Diploma']
  .map((levelName, i) => ({ intLevel: i + 1, courseLevelGuid: `00000000-0000-4000-9000-${String(i + 1).padStart(12, '0')}`, levelName, status: 2 }))
let mockLevelSeq = mockCourseLevels.length + 1

function sortMock() {
  mockCourseLevels.sort((a, b) => a.levelName.localeCompare(b.levelName))
}

function mockNameTaken(name: string, exceptId?: number) {
  const n = name.trim().toLowerCase()
  return mockCourseLevels.some(l => l.intLevel !== exceptId && l.levelName.toLowerCase() === n)
}

// GET /users/course-levels?page=&pageSize=&search= — sorted by name on the server.
export function getCourseLevelsPaged(page = 1, pageSize = 10, search = ''): Promise<PaginatedItems<CourseLevel>> {
  return getPagedList<CourseLevel>('/api/v1/users/course-levels', page, pageSize, search, { rows: mockCourseLevels, text: r => r.levelName })
}

// POST /users/course-levels → 201 with the new row.
// Errors: validation_error (400), conflict (409, name already used), forbidden (403).
export function createCourseLevel(input: CourseLevelInput): Promise<CourseLevel> {
  if (MOCK_AUTH) {
    if (mockNameTaken(input.levelName)) return Promise.reject(new AuthError('conflict', 'A course level with this name already exists.'))
    const level: CourseLevel = { intLevel: mockLevelSeq, courseLevelGuid: crypto.randomUUID(), levelName: input.levelName.trim(), status: 2 }
    mockLevelSeq++
    mockCourseLevels.push(level)
    sortMock()
    return Promise.resolve(level)
  }
  return apiPost<CourseLevel>('/api/v1/users/course-levels', input)
}

// PUT /users/course-levels/{intLevel} → 200 with the updated row.
// Errors: validation_error (400), not_found (404), conflict (409), forbidden (403).
export function updateCourseLevel(intLevel: number, input: CourseLevelInput): Promise<CourseLevel> {
  if (MOCK_AUTH) {
    const existing = mockCourseLevels.find(l => l.intLevel === intLevel)
    if (!existing) return Promise.reject(new AuthError('not_found', 'Course level not found.'))
    if (mockNameTaken(input.levelName, intLevel)) return Promise.reject(new AuthError('conflict', 'A course level with this name already exists.'))
    existing.levelName = input.levelName.trim()
    sortMock()
    return Promise.resolve({ ...existing })
  }
  return apiPut<CourseLevel>(`/api/v1/users/course-levels/${intLevel}`, input)
}

// DELETE /users/course-levels/{intLevel} → 200 data: true (soft delete).
// Errors: course_level_in_use (400, a designation uses it as its minimum
// qualification), not_found (404), forbidden (403).
export function deleteCourseLevel(intLevel: number): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockCourseLevels.findIndex(l => l.intLevel === intLevel)
    if (index === -1) return Promise.reject(new AuthError('not_found', 'Course level not found.'))
    mockCourseLevels.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/users/course-levels/${intLevel}`)
}
