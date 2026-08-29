import { apiGet, apiPost, apiPut, AuthError } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// students/student-discounts/*.md give no JSON response sample for
// GET /students/{studentGuid}/discount — only prose ("the discount
// reference, the assignment's own calcType/amtPer overrides, its status …,
// and the effective-from and cancelled-at semester GUIDs"). Field names
// below follow the same naming StudentDetailDto already uses for these same
// concepts (discountStatus, discountEffectiveFromSemesterGuid, etc. — see
// student.ts) rather than guessing a different convention; treat as
// unconfirmed until seen live, same caution as sponsor.ts's
// mandatoryFeeCheck note.
export interface StudentDiscountDto {
  discountGuid: string
  calcType: number | null
  amtPer: number | null
  cop: string | null
  discountStatus: string | null
  effectiveFromSemesterGuid: string | null
  cancelledAtSemesterGuid: string | null
  remarks: string | null
}

export interface AssignStudentDiscountRequest {
  discountGuid: string
  calcType?: number | null
  amtPer?: number | null
  cop?: string | null
  // Nullable and unvalidated per the docs, but "behaviour when omitted is
  // decided by resolution logic in Finance" — sent explicitly. There's no
  // program-scoped semester list available from StudentDto/StudentDetailDto
  // to build a picker from, so this defaults to the student's own
  // currentSemesterGuid (already on StudentDetailDto) rather than inventing
  // a semester dropdown with no real option source.
  effectiveFromSemesterGuid: string | null
  remarks?: string | null
}

export interface UpdateStudentDiscountRequest {
  calcType?: number | null
  amtPer?: number | null
  cop?: string | null
  remarks?: string | null
}

const mockDiscountAssignments: Record<string, StudentDiscountDto> = {}

// A student with no discount assignment is the common case (404 `not_found`
// per the docs) — resolve to null rather than throwing.
export function getStudentDiscount(studentGuid: string): Promise<StudentDiscountDto | null> {
  if (MOCK_AUTH) return Promise.resolve(mockDiscountAssignments[studentGuid] ?? null)
  return apiGet<StudentDiscountDto>(`/api/v1/students/${studentGuid}/discount`).catch(err => {
    if (err instanceof AuthError && err.code === 'not_found') return null
    throw err
  })
}

export function assignStudentDiscount(studentGuid: string, payload: AssignStudentDiscountRequest): Promise<StudentDiscountDto> {
  if (MOCK_AUTH) {
    const row: StudentDiscountDto = {
      discountGuid: payload.discountGuid,
      calcType: payload.calcType ?? null,
      amtPer: payload.amtPer ?? null,
      cop: payload.cop ?? null,
      discountStatus: 'Active',
      effectiveFromSemesterGuid: payload.effectiveFromSemesterGuid,
      cancelledAtSemesterGuid: null,
      remarks: payload.remarks ?? null,
    }
    mockDiscountAssignments[studentGuid] = row
    return Promise.resolve(row)
  }
  return apiPost<StudentDiscountDto>(`/api/v1/students/${studentGuid}/discount`, payload)
}

export function updateStudentDiscount(studentGuid: string, payload: UpdateStudentDiscountRequest): Promise<StudentDiscountDto> {
  if (MOCK_AUTH) {
    const existing = mockDiscountAssignments[studentGuid]
    if (!existing) throw new AuthError('not_found')
    const updated = { ...existing, ...payload }
    mockDiscountAssignments[studentGuid] = updated
    return Promise.resolve(updated)
  }
  return apiPut<StudentDiscountDto>(`/api/v1/students/${studentGuid}/discount`, payload)
}

// includeCurrentSemester sent explicitly per the docs' warning — omitting it
// silently defaults to false server-side, which is easy to get backwards
// when the intent was "stop it now".
export function cancelStudentDiscount(studentGuid: string, includeCurrentSemester: boolean): Promise<unknown> {
  if (MOCK_AUTH) {
    const existing = mockDiscountAssignments[studentGuid]
    if (existing) existing.discountStatus = includeCurrentSemester ? 'CancelledImmediate' : 'Cancelled'
    return Promise.resolve({ studentGuid, includeCurrentSemester })
  }
  return apiPost(`/api/v1/students/${studentGuid}/discount/cancel?includeCurrentSemester=${includeCurrentSemester}`, null)
}

// Keyed by discountGuid, not studentGuid — used by Finance's discount-delete
// flow (DELETE /finance/discounts/{guid}) to refuse deletion while active
// assignments exist. Exposed here since the referential data lives in the
// Students module; Finance's own discount.ts has no equivalent.
export function getActiveAssignmentCount(discountGuid: string): Promise<number> {
  if (MOCK_AUTH) {
    const count = Object.values(mockDiscountAssignments).filter(a => a.discountGuid === discountGuid && a.discountStatus === 'Active').length
    return Promise.resolve(count)
  }
  return apiGet<number>(`/api/v1/students/discounts/${discountGuid}/active-assignment-count`)
}
