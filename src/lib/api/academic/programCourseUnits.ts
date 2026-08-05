import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// GET /api/v1/academic/program-course-units/{programGuid} — confirmed via a
// real sample response from the backend team. Flat list, one row per
// (courseUnit, semester) pairing already assigned to this specific program —
// this is the real source of truth for how many semesters a program actually
// has and what each is called ("Year One - Semester One", …), since that
// varies per program rather than being a fixed count. Note this DTO carries
// no unitType/unitCat/streamGuid — those still only come from
// ProgramMasterFullDetails's programUnits[] (see useProgramMasterFullDetails)
// and have to be merged in by courseUnitGuid; this endpoint's only job is
// telling you the real semesterGuid/semName grouping.
export interface ProgramCourseUnitDto {
  courseUnitGuid: string
  courseUnitName: string
  courseUnitCode: string
  semesterGuid: string
  semName: string
  flag: number
}

export function getProgramCourseUnits(programGuid: string): Promise<ProgramCourseUnitDto[]> {
  if (MOCK_AUTH) return Promise.resolve([])
  return apiGet<ProgramCourseUnitDto[] | null>(`/api/v1/academic/program-course-units/${programGuid}`)
    .then(data => data ?? [])
}
