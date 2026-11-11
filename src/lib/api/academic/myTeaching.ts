import { apiGet } from '../client'
import type { LecturerTimetable } from './timetable'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// The signed-in staff member's own teaching, for My Profile's "Timetable &
// Course Units" tab. Both endpoints take the lecturer from the login token:
// never send a lecturer or employee id, so a user only ever sees their own.
// Login only, no permission. 401 = not logged in, or the account has no
// staff identity (the client retries once after a refresh, then throws).
// Docs: academic/timetables/get-my-timetable.md,
//       academic/program-plannings/get-my-program-plannings.md

// GET /timetables/my. term is required (a missing term is a 500); without
// intakeGuid the current intake is used (400 "No current academic intake is
// set." when none is). Same shape as by-lecturer: entries come sorted by
// weekday, then start time. No entries = 200 with entries: [], totalLoad: 0.
export function getMyTimetable(term: number, intakeGuid?: string): Promise<LecturerTimetable> {
  if (MOCK_AUTH) return Promise.resolve({ lecturerGuid: 'me', lecturerName: null, totalLoad: 0, entries: [] })
  const qs = new URLSearchParams({ term: String(term) })
  if (intakeGuid) qs.set('intakeGuid', intakeGuid)
  return apiGet<LecturerTimetable>(`/api/v1/academic/timetables/my?${qs.toString()}`)
}

export interface MyProgramPlanning {
  programPlanGuid: string
  unitGuid: string
  courseUnitCode: string | null
  courseUnitName: string | null
  load: number
  schoolGuid: string | null
  facultyCode: string | null
  facultyName: string | null
  intakeGuid: string | null
  intakeCode: number | null
  description: string | null   // intake, e.g. "Fall 2026"
  term: number | null
}

export interface MyProgramPlanningList {
  items: MyProgramPlanning[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface MyProgramPlanningParams {
  intakeGuid?: string   // omit for every intake
  term?: number         // omit for every term
  search?: string       // unit code or name, faculty, or intake description
  page: number
  pageSize: number
}

// GET /program-plannings/my: the course units allocated to the signed-in staff member.
export function getMyProgramPlannings(p: MyProgramPlanningParams): Promise<MyProgramPlanningList> {
  if (MOCK_AUTH) return Promise.resolve({ items: [], totalCount: 0, pageNumber: p.page, pageSize: p.pageSize })
  const qs = new URLSearchParams({ page: String(p.page), pageSize: String(p.pageSize) })
  if (p.intakeGuid) qs.set('intakeGuid', p.intakeGuid)
  if (p.term) qs.set('term', String(p.term))
  if (p.search) qs.set('search', p.search)
  return apiGet<MyProgramPlanningList | null>(`/api/v1/academic/program-plannings/my?${qs.toString()}`)
    .then(d => d ?? { items: [], totalCount: 0, pageNumber: p.page, pageSize: p.pageSize })
}
