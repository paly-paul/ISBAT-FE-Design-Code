import { AuthError, apiDelete, apiGet, apiPost, apiPut } from '../client'
import { getPagedList } from '../pagedList'
import type { PaginatedItems } from '@/lib/pagination'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Designations (job titles) — erp-docs/api/userrole-service/designations and
// pages/identity/designation-master-page.md. Since 2026-11-21 a designation
// doesn't belong to a department (the employee picks one separately), and
// since 2026-11-23 it's keyed by designationGuid (intDesignation is gone) and
// carries a short code, job description, minimum qualification and skill set.
export interface Designation {
  designationGuid: string
  // Trimmed and saved in upper case by the server — show this, not what was typed.
  shortCode: string
  designationName: string
  jobDescription: string | null
  // A courseLevelGuid from GET /users/course-levels/dropdown.
  minQualificationGuid: string | null
  minQualificationName: string | null
  skillSet: string | null
}

// POST and PUT send all five fields; PUT clears any optional field sent as null.
export interface DesignationInput {
  shortCode: string
  designationName: string
  jobDescription: string | null
  minQualificationGuid: string | null
  skillSet: string | null
}

export const DESIGNATION_SHORT_CODE_MAX = 10
export const DESIGNATION_NAME_MAX = 100
export const DESIGNATION_TEXT_MAX = 1000

const mockDesignations: Designation[] = [
  ['JT004', 'Accountant', 'Bachelors'],
  ['JT012', 'Head of Department', 'Masters'],
  ['JT010', 'Lecturer', 'Masters'],
  ['JT020', 'Office Assistant', null],
].map(([shortCode, designationName, minQualificationName], i) => ({
  designationGuid: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  shortCode: shortCode as string,
  designationName: designationName as string,
  jobDescription: null,
  minQualificationGuid: null,
  minQualificationName,
  skillSet: null,
}))

function mockConflict(input: DesignationInput, exceptGuid?: string): AuthError | null {
  const others = mockDesignations.filter(d => d.designationGuid !== exceptGuid)
  if (others.some(d => d.shortCode === input.shortCode.trim().toUpperCase())) return new AuthError('conflict', 'A designation with this short code already exists.')
  if (others.some(d => d.designationName.toLowerCase() === input.designationName.trim().toLowerCase())) return new AuthError('conflict', 'A designation with this name already exists.')
  return null
}

function mockRow(designationGuid: string, input: DesignationInput): Designation {
  return {
    designationGuid,
    shortCode: input.shortCode.trim().toUpperCase(),
    designationName: input.designationName.trim(),
    jobDescription: input.jobDescription,
    minQualificationGuid: input.minQualificationGuid,
    minQualificationName: null,
    skillSet: input.skillSet,
  }
}

// GET /users/designations?page=&pageSize=&search= — sorted by name on the
// server; search matches the short code or the name.
export function getDesignationsPaged(page = 1, pageSize = 10, search = ''): Promise<PaginatedItems<Designation>> {
  return getPagedList<Designation>('/api/v1/users/designations', page, pageSize, search, {
    rows: mockDesignations,
    text: r => `${r.shortCode} ${r.designationName}`,
  })
}

// Picker shape from GET /api/v1/users/designations/dropdown
// (get-designations-dropdown.md) — carries designationGuid for POST/PUT
// /employees. Not tied to a department: always the full list.
export interface DesignationDropdownItem {
  designationGuid: string
  designationName: string
}

export function getDesignationsDropdown(): Promise<DesignationDropdownItem[]> {
  if (MOCK_AUTH) {
    return Promise.resolve(mockDesignations
      .map(d => ({ designationGuid: d.designationGuid, designationName: d.designationName }))
      .sort((a, b) => a.designationName.localeCompare(b.designationName)))
  }
  return apiGet<DesignationDropdownItem[] | null>('/api/v1/users/designations/dropdown').then(data => data ?? [])
}

// POST /users/designations → 201 with the new row.
// Errors: validation_error (400), bad_request (400, minimum qualification not
// found), conflict (409, short code or name already used), forbidden (403).
export function createDesignation(input: DesignationInput): Promise<Designation> {
  if (MOCK_AUTH) {
    const conflict = mockConflict(input)
    if (conflict) return Promise.reject(conflict)
    const row = mockRow(crypto.randomUUID(), input)
    mockDesignations.push(row)
    return Promise.resolve(row)
  }
  return apiPost<Designation>('/api/v1/users/designations', input)
}

// PUT /users/designations/{designationGuid} → 200 with the updated row.
// Errors: as POST, plus not_found (404).
export function updateDesignation(designationGuid: string, input: DesignationInput): Promise<Designation> {
  if (MOCK_AUTH) {
    const index = mockDesignations.findIndex(d => d.designationGuid === designationGuid)
    if (index === -1) return Promise.reject(new AuthError('not_found', 'Designation not found.'))
    const conflict = mockConflict(input, designationGuid)
    if (conflict) return Promise.reject(conflict)
    mockDesignations[index] = mockRow(designationGuid, input)
    return Promise.resolve(mockDesignations[index])
  }
  return apiPut<Designation>(`/api/v1/users/designations/${encodeURIComponent(designationGuid)}`, input)
}

// DELETE /users/designations/{designationGuid} → 200 data: true (soft delete).
// Errors: designation_in_use (400, an employee holds it), not_found (404),
// forbidden (403).
export function deleteDesignation(designationGuid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockDesignations.findIndex(d => d.designationGuid === designationGuid)
    if (index === -1) return Promise.reject(new AuthError('not_found', 'Designation not found.'))
    mockDesignations.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/users/designations/${encodeURIComponent(designationGuid)}`)
}
