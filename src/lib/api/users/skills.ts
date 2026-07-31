import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs /academic/skill-master's lecturer-skill approval workflow — a
// genuinely different domain from lib/api/academic/skill.ts (which backs
// /config/skill, a plain skill-name catalog with no employee/proficiency/
// approval concept at all). Don't conflate the two.
export interface LecturerSkill {
  lecturerSkillGuid: string
  // The list response only ever returns this legacy int — there is no
  // employeeGuid here, and Employee (lib/api/employee/employee.ts) exposes no
  // matching int field to reverse-map it against, so it can only be
  // displayed raw ("Employee #<n>"), never resolved to a name. Same
  // "int FK with no confirmed guid source" gotcha as batch.ts's bInCharge.
  intEmployee: number
  skillName: string
  // Confirmed on the wire as a bare int (1/2/3 seen in sample data) with no
  // accompanying enum doc — CREATE_PROFICIENCY_OPTIONS below is a reasonable
  // assumed ascending-competence mapping (Familiar/Proficient/Expert,
  // matching the pre-existing modal's own wording), not a confirmed spec.
  proficiency: number
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | string
  approvedByIntUser: number | null
  approvedDate: string | null
}

// POST payload — note this takes a real employeeGuid despite the list
// response above only ever returning intEmployee; there is no documented way
// to convert one into the other, so create and read use different employee
// identifiers for the same underlying record.
export interface CreateLecturerSkillInput {
  employeeGuid: string
  skillName: string
  proficiency: number
  approved: 0 | 1
}

const mockSkills: LecturerSkill[] = [
  { lecturerSkillGuid: '5c7845a0-a804-4c0e-a62a-9e560deea54d', intEmployee: 33, skillName: 'Digital Electronics', proficiency: 1, approvalStatus: 'Pending', approvedByIntUser: null, approvedDate: null },
  { lecturerSkillGuid: '77b926b8-9043-41bc-bbe1-441152160488', intEmployee: 58, skillName: 'Business Communication Skills for Leaders', proficiency: 1, approvalStatus: 'Approved', approvedByIntUser: null, approvedDate: null },
  { lecturerSkillGuid: '1881d64d-a35c-4000-9224-d987bb27881e', intEmployee: 55, skillName: 'CISCO', proficiency: 1, approvalStatus: 'Approved', approvedByIntUser: null, approvedDate: null },
  { lecturerSkillGuid: '9bbf722e-1298-4a66-9d5e-9ca854853fb9', intEmployee: 113, skillName: 'Data Science', proficiency: 1, approvalStatus: 'Approved', approvedByIntUser: null, approvedDate: null },
]

// search is forwarded to the real endpoint's own ?search= param; the page
// itself currently fetches the unfiltered list once and filters client-side
// (same "load it all, search client-side" convention as getBatches/
// getEmployees), but the param is wired through for when that changes.
export function getSkills(search = ''): Promise<LecturerSkill[]> {
  if (MOCK_AUTH) {
    const q = search.trim().toLowerCase()
    return Promise.resolve(q ? mockSkills.filter(s => s.skillName.toLowerCase().includes(q)) : mockSkills)
  }
  return apiGet<LecturerSkill[] | null>(`/api/v1/users/skills?search=${encodeURIComponent(search)}`).then(data => data ?? [])
}

export function createSkill(input: CreateLecturerSkillInput): Promise<LecturerSkill> {
  if (MOCK_AUTH) {
    const skill: LecturerSkill = {
      lecturerSkillGuid: crypto.randomUUID(),
      // Unknown in mock mode — nothing to resolve employeeGuid to an
      // intEmployee against client-side (see the gotcha note above).
      intEmployee: 0,
      skillName: input.skillName,
      proficiency: input.proficiency,
      approvalStatus: input.approved ? 'Approved' : 'Pending',
      approvedByIntUser: null,
      approvedDate: null,
    }
    mockSkills.push(skill)
    return Promise.resolve(skill)
  }
  return apiPost<LecturerSkill>('/api/v1/users/skills', input)
}

// Fetches the full record for the Edit modal. Note the response still only
// carries intEmployee, never employeeGuid — Edit can't prefill which
// employee the skill belongs to, same "must be re-picked every edit"
// limitation as batch.ts's Stream field.
export function getSkillById(guid: string): Promise<LecturerSkill> {
  if (MOCK_AUTH) {
    const existing = mockSkills.find(s => s.lecturerSkillGuid === guid)
    if (!existing) return Promise.reject(new Error('Skill not found'))
    return Promise.resolve(existing)
  }
  return apiGet<LecturerSkill>(`/api/v1/users/skills/${guid}`)
}

// Same payload shape as create (see CreateLecturerSkillInput above) — the
// spec documents PUT as taking an identical body to POST.
export function updateSkill(guid: string, input: CreateLecturerSkillInput): Promise<LecturerSkill> {
  if (MOCK_AUTH) {
    const existing = mockSkills.find(s => s.lecturerSkillGuid === guid)
    if (!existing) return Promise.reject(new Error('Skill not found'))
    existing.skillName = input.skillName
    existing.proficiency = input.proficiency
    existing.approvalStatus = input.approved ? 'Approved' : 'Pending'
    return Promise.resolve(existing)
  }
  return apiPut<LecturerSkill>(`/api/v1/users/skills/${guid}`, input)
}

export function deleteSkill(guid: string): Promise<void> {
  if (MOCK_AUTH) {
    const index = mockSkills.findIndex(s => s.lecturerSkillGuid === guid)
    if (index === -1) return Promise.reject(new Error('Skill not found'))
    mockSkills.splice(index, 1)
    return Promise.resolve()
  }
  return apiDelete<void>(`/api/v1/users/skills/${guid}`)
}
