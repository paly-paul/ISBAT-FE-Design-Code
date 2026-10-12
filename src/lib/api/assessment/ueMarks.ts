import { apiGet, apiPost, apiPut } from '../client'

// Confirmed via erp-docs/api/assessment-attendance-service/assessment/
// ue-detailed-marks/*.md. The grid is layout-dependent: which mark fields
// are meaningful depends on `layout` (resolved server-side from the course
// unit's type), and `maxMarks` carries the ceiling for each of them.

export type UeLayout = 'Theory' | 'Practical' | 'Project'

export type UeMarkField =
  | 'sectionAMark' | 'sectionBMark' | 'sectionCMark'
  | 'recordMark' | 'codingMark' | 'outputMark' | 'vivaMark'
  | 'synopsisMark' | 'reviewMark' | 'methodologyMark' | 'analysisMark'

export type UeMaxField =
  | 'sectionAMax' | 'sectionBMax' | 'sectionCMax'
  | 'recordMax' | 'codingMax' | 'outputMax' | 'vivaMax'
  | 'synopsisMax' | 'reviewMax' | 'methodologyMax' | 'analysisMax'

export type UeMarkValues = Record<UeMarkField, number | null>

export interface UeDetailedMarkRowDto extends UeMarkValues {
  studentGuid: string
  studentRegNo: string | null
  studentName: string | null
  isAbsent: boolean
  totalMark: number | null
}

export interface UeDetailedMarksGridDto {
  universityExamGuid: string
  courseUnitName: string | null
  layout: UeLayout
  isVerified: boolean
  maxMarks: Record<UeMaxField, number | null>
  rows: UeDetailedMarkRowDto[]
}

export interface VerifyUeMarksResultDto {
  universityExamGuid: string
  isVerified: boolean
}

// Columns per layout, in the legacy grid's order. Project reuses recordMark
// as "Report" (get-ue-detailed-marks.md).
export const UE_LAYOUT_FIELDS: Record<UeLayout, { field: UeMarkField; max: UeMaxField; label: string }[]> = {
  Theory: [
    { field: 'sectionAMark', max: 'sectionAMax', label: 'Section A' },
    { field: 'sectionBMark', max: 'sectionBMax', label: 'Section B' },
    { field: 'sectionCMark', max: 'sectionCMax', label: 'Section C' },
  ],
  Practical: [
    { field: 'recordMark', max: 'recordMax', label: 'Record' },
    { field: 'codingMark', max: 'codingMax', label: 'Coding' },
    { field: 'outputMark', max: 'outputMax', label: 'Output' },
    { field: 'vivaMark', max: 'vivaMax', label: 'Viva' },
  ],
  Project: [
    { field: 'synopsisMark', max: 'synopsisMax', label: 'Synopsis' },
    { field: 'reviewMark', max: 'reviewMax', label: 'Review' },
    { field: 'methodologyMark', max: 'methodologyMax', label: 'Methodology' },
    { field: 'analysisMark', max: 'analysisMax', label: 'Analysis' },
    { field: 'recordMark', max: 'recordMax', label: 'Report' },
    { field: 'vivaMark', max: 'vivaMax', label: 'Viva' },
  ],
}

// The doc says `layout` is "Theory" | "Practical" | "Project", but the live
// response didn't match it (the grid crashed on an unknown layout). Cased
// differently or serialized as an enum it would
// arrive as 0/1/2. Normalise both; anything unrecognised is Theory, same as
// the server's own fallback.
const LAYOUT_BY_INDEX: UeLayout[] = ['Theory', 'Practical', 'Project']
function normalizeLayout(raw: unknown): UeLayout {
  if (typeof raw === 'number') return LAYOUT_BY_INDEX[raw] ?? 'Theory'
  const s = String(raw ?? '').trim().toLowerCase()
  return LAYOUT_BY_INDEX.find(l => l.toLowerCase() === s) ?? 'Theory'
}

export function getUeDetailedMarks(universityExamGuid: string): Promise<UeDetailedMarksGridDto> {
  return apiGet<UeDetailedMarksGridDto>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}`)
    .then(data => ({
      ...data,
      layout: normalizeLayout(data?.layout),
      maxMarks: data?.maxMarks ?? ({} as UeDetailedMarksGridDto['maxMarks']),
      rows: data?.rows ?? [],
    }))
}

// One student per call (insert-or-update). Every field of the exam's layout
// is required; every other field must be null. totalMark is server-computed.
export function saveStudentUeMark(universityExamGuid: string, studentGuid: string, marks: UeMarkValues): Promise<UeDetailedMarkRowDto> {
  return apiPut<UeDetailedMarkRowDto>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}/students/${studentGuid}`, marks)
}

export function verifyUeMarks(universityExamGuid: string): Promise<VerifyUeMarksResultDto> {
  return apiPost<VerifyUeMarksResultDto>(`/api/v1/assessment/ue-detailed-marks/${universityExamGuid}/verify`, {})
}
