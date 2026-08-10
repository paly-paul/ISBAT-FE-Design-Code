import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs /config/skill — a flat skill-name catalog (e.g. "Python", "SQL")
// used to populate lecturer profiles. Confirmed via a real API sample:
// keyed by a legacy int (intSkill), not a guid, full CRUD via
// /api/v1/academic/skills (+ /:id for Update/Delete).
//
// Genuinely distinct from lib/api/users/skills.ts (LecturerSkill — the
// /academic/skill-master approval workflow, keyed by
// lecturerSkillGuid/intEmployee, with proficiency/approvalStatus fields).
// Kept in its own file rather than folded into either that one or the old
// mock-only academic/skill.ts, so the two "skill" resources can't get
// confused at the import site — see the note above the directory tree in
// PROJECT_STRUCTURE.md for the same distinction.
export interface SkillMaster {
  intSkill: number
  skillName: string
}

export interface SkillMasterInput {
  skillName: string
}

interface SkillMasterListResponse {
  items: SkillMaster[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const mockSkills: SkillMaster[] = [
  { intSkill: 1, skillName: 'C#' },
  { intSkill: 2, skillName: 'Python' },
  { intSkill: 3, skillName: 'Java' },
  { intSkill: 4, skillName: 'SQL' },
  { intSkill: 5, skillName: 'JavaScript' },
  { intSkill: 6, skillName: 'Data Structures' },
  { intSkill: 7, skillName: 'Computer Networks' },
  { intSkill: 8, skillName: 'Operating Systems' },
]
let mockSkillSeq = mockSkills.length + 1

// Real pagination — a live sample returned totalCount: 12 against only 10
// items in a pageSize=10 page, so this is a genuinely server-paginated
// endpoint despite the master being small. Fetched at a large pageSize (see
// useSkillMaster.ts) and paginated/searched client-side instead, same "load
// it all" convention as every other small Config master in this app
// (useStreams/useFaculties/etc.).
export function getSkillMasters(pageNumber = 1, pageSize = 1000): Promise<SkillMasterListResponse> {
  if (MOCK_AUTH) {
    return Promise.resolve({ items: mockSkills, totalCount: mockSkills.length, pageNumber, pageSize })
  }
  return apiGet<SkillMasterListResponse | null>(`/api/v1/academic/skills?page=${pageNumber}&pageSize=${pageSize}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber, pageSize })
}

export function createSkillMaster(input: SkillMasterInput): Promise<SkillMaster> {
  if (MOCK_AUTH) {
    const skill: SkillMaster = { intSkill: mockSkillSeq++, ...input }
    mockSkills.push(skill)
    return Promise.resolve(skill)
  }
  return apiPost<SkillMaster>('/api/v1/academic/skills', input)
}

// Same payload shape as create — confirmed via the shared API sample.
export function updateSkillMaster(intSkill: number, input: SkillMasterInput): Promise<SkillMaster> {
  if (MOCK_AUTH) {
    const existing = mockSkills.find(s => s.intSkill === intSkill)
    if (!existing) return Promise.reject(new Error('Skill not found'))
    Object.assign(existing, input)
    return Promise.resolve(existing)
  }
  return apiPut<SkillMaster>(`/api/v1/academic/skills/${intSkill}`, input)
}

export function deleteSkillMaster(intSkill: number): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockSkills.findIndex(s => s.intSkill === intSkill)
    if (index === -1) return Promise.reject(new Error('Skill not found'))
    mockSkills.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/skills/${intSkill}`)
}
