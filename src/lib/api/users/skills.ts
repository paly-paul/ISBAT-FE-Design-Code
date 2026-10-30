import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Backs /academic/skill-master's lecturer-skill approval workflow — a
// genuinely different domain from lib/api/academic/skill.ts (which backs
// /config/skill, a plain skill-name catalog with no employee/proficiency/
// approval concept at all). Don't conflate the two.
export interface LecturerSkill {
  lecturerSkillGuid: string
  // Confirmed via a real GET /api/v1/users/skills sample: the list response
  // now carries a real employeeGuid — the old "only a legacy intEmployee int,
  // no way to resolve it to a name" gotcha is gone, this can be matched
  // straight against Employee.employeeGuid (lib/api/employee/employee.ts).
  employeeGuid: string
  // Also on the wire now, but every pre-existing record in the same sample
  // came back as the zero guid ('00000000-...') — only skills created since
  // the catalog started returning real skillGuids (see skillMaster.ts) carry
  // a resolvable one. Not used for display yet, kept for when it's needed
  // (e.g. reverse-matching Edit's skill dropdown by guid instead of name).
  skillGuid: string
  skillName: string
  // Confirmed on the wire as a bare int (1/2/3 seen in sample data) with no
  // accompanying enum doc — CREATE_PROFICIENCY_OPTIONS below is a reasonable
  // assumed ascending-competence mapping (Familiar/Proficient/Expert,
  // matching the pre-existing modal's own wording), not a confirmed spec.
  proficiency: number
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | string
  // Not present at all in the same real sample (every row, approved or not)
  // — kept optional rather than dropped in case the backend only omits them
  // when null.
  approvedByIntUser?: number | null
  approvedDate?: string | null
}

// POST payload (PUT takes a per-skill list — see UpdateLecturerSkillsInput).
//
// Confirmed shape (real POST /api/v1/users/skills call — a per-skill
// `skills: [{skillGuid, proficiency}]` array was tried first but the
// backend rejected it with "'Request Skill Guids' must not be empty",
// meaning it binds a flat `skillGuids` array, not a nested one): one call
// creates/updates against one or more skills at once, all sharing a single
// proficiency. skillGuid values come from the skill catalog (see
// lib/api/academic/skillMaster.ts's SkillMaster.skillGuid). There is no
// `approved` flag in the payload.
export interface CreateLecturerSkillInput {
  employeeGuid: string
  skillGuids: string[]
  proficiency: number
}

const mockSkills: LecturerSkill[] = [
  { lecturerSkillGuid: '5c7845a0-a804-4c0e-a62a-9e560deea54d', employeeGuid: '814e150d-8bfd-4900-9e70-d6fdaeaacab7', skillGuid: '00000000-0000-0000-0000-000000000000', skillName: 'Digital Electronics', proficiency: 1, approvalStatus: 'Pending' },
  { lecturerSkillGuid: '77b926b8-9043-41bc-bbe1-441152160488', employeeGuid: '61adbd66-a0db-413c-b306-ef70c700e937', skillGuid: '00000000-0000-0000-0000-000000000000', skillName: 'Business Communication Skills for Leaders', proficiency: 1, approvalStatus: 'Approved' },
  { lecturerSkillGuid: '1881d64d-a35c-4000-9224-d987bb27881e', employeeGuid: '4ce96b1f-40c3-41a7-b24d-c6919135f4be', skillGuid: '00000000-0000-0000-0000-000000000000', skillName: 'CISCO', proficiency: 1, approvalStatus: 'Approved' },
  { lecturerSkillGuid: '9bbf722e-1298-4a66-9d5e-9ca854853fb9', employeeGuid: '2bd3f122-0b53-4e50-b5d1-ed6bcc428c42', skillGuid: '00000000-0000-0000-0000-000000000000', skillName: 'Data Science', proficiency: 1, approvalStatus: 'Approved' },
]

export interface LecturerSkillListResponse {
  items: LecturerSkill[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Real server-side pagination (2026-09-09) — GET /api/v1/users/skills now
// accepts page/pageSize and returns a real {items, totalCount, pageNumber,
// pageSize} envelope (previously a flat, unpaged array — this was the one
// blocked entity in the academic-module pagination sweep until the backend
// added it). Tolerates a plain array or an items-only shape defensively,
// same convention as getRepetitionTagsPaged/getProgramGroupsPaged, in case
// an older build of the endpoint is what's actually deployed.
export function getSkills(page = 1, pageSize = 10, search = ''): Promise<LecturerSkillListResponse> {
  const q = search.trim()
  if (MOCK_AUTH) {
    const filtered = q ? mockSkills.filter(s => s.skillName.toLowerCase().includes(q.toLowerCase())) : mockSkills
    const start = (page - 1) * pageSize
    return Promise.resolve({ items: filtered.slice(start, start + pageSize), totalCount: filtered.length, pageNumber: page, pageSize })
  }
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  if (q) params.set('search', q)
  return apiGet<any>(`/api/v1/users/skills?${params.toString()}`).then(data => {
    const items: LecturerSkill[] = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
    return {
      items,
      totalCount: typeof data?.totalCount === 'number' ? data.totalCount : items.length,
      pageNumber: data?.pageNumber ?? page,
      pageSize: data?.pageSize ?? pageSize,
    }
  })
}

// One call now fans out to one skill entry per guid in skillGuids, all
// sharing input.proficiency — mirrors the batched POST shape above.
export function createSkill(input: CreateLecturerSkillInput): Promise<LecturerSkill[]> {
  if (MOCK_AUTH) {
    const created = input.skillGuids.map(skillGuid => {
      const skill: LecturerSkill = {
        lecturerSkillGuid: crypto.randomUUID(),
        employeeGuid: input.employeeGuid,
        skillGuid,
        // Only the skill guid is on the payload, no name — real skillName
        // would come back from the server's response.
        skillName: `Skill #${skillGuid}`,
        proficiency: input.proficiency,
        approvalStatus: 'Pending',
      }
      mockSkills.push(skill)
      return skill
    })
    return Promise.resolve(created)
  }
  return apiPost<LecturerSkill[]>('/api/v1/users/skills', input)
}

// Fetches the full record for the Edit modal — same shape as the list
// response, so employeeGuid is available to prefill Edit's faculty picker.
export function getSkillById(guid: string): Promise<LecturerSkill> {
  if (MOCK_AUTH) {
    const existing = mockSkills.find(s => s.lecturerSkillGuid === guid)
    if (!existing) return Promise.reject(new Error('Skill not found'))
    return Promise.resolve(existing)
  }
  return apiGet<LecturerSkill>(`/api/v1/users/skills/${guid}`)
}

// Legacy imported skills have no catalog link and come back with this
// skillGuid; they're identified by lecturerSkillGuid instead.
export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

// GET /api/v1/users/skills?employeeGuid=… (get-skills.md) — one employee's
// complete skill set, which PUT needs to send back in full. Documented as a
// plain array; tolerates the paged envelope getSkills also handles.
export function getEmployeeSkills(employeeGuid: string): Promise<LecturerSkill[]> {
  if (MOCK_AUTH) return Promise.resolve(mockSkills.filter(s => s.employeeGuid === employeeGuid))
  const params = new URLSearchParams({ employeeGuid, page: '1', pageSize: '1000' })
  return apiGet<any>(`/api/v1/users/skills?${params.toString()}`)
    .then(data => (Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []) as LecturerSkill[])
}

// PUT /api/v1/users/skills (put-skill.md, 2026-10-30) replaces the
// employee's whole skill set: items it omits are soft-deleted, and an empty
// list is rejected. An item with lecturerSkillGuid updates that stored row
// (skillGuid is then ignored — needed for legacy rows); an item with only
// skillGuid adds that catalog skill. The old per-row PUT /skills/{guid} was
// removed in August and returns 405.
export interface LecturerSkillItemInput {
  lecturerSkillGuid?: string
  skillGuid: string
  proficiency: number
}

export interface UpdateLecturerSkillsInput {
  employeeGuid: string
  skills: LecturerSkillItemInput[]
}

export function updateSkills(input: UpdateLecturerSkillsInput): Promise<LecturerSkill[]> {
  if (MOCK_AUTH) {
    const kept = input.skills.map(item => {
      const existing = item.lecturerSkillGuid ? mockSkills.find(s => s.lecturerSkillGuid === item.lecturerSkillGuid) : undefined
      if (existing) { existing.proficiency = item.proficiency; return existing }
      const created: LecturerSkill = { lecturerSkillGuid: crypto.randomUUID(), employeeGuid: input.employeeGuid, skillGuid: item.skillGuid, skillName: `Skill #${item.skillGuid}`, proficiency: item.proficiency, approvalStatus: 'Approved' }
      mockSkills.push(created)
      return created
    })
    for (let i = mockSkills.length - 1; i >= 0; i--) {
      if (mockSkills[i].employeeGuid === input.employeeGuid && !kept.includes(mockSkills[i])) mockSkills.splice(i, 1)
    }
    return Promise.resolve(kept)
  }
  return apiPut<LecturerSkill[]>('/api/v1/users/skills', input)
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
