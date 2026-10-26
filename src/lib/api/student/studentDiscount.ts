import { apiGet, apiPost, apiPut, AuthError } from '../client'
import { getDiscounts } from '../finance/discount'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed via a real live GET /students/{studentGuid}/discount response
// (2026-09-02) — supersedes an earlier guessed shape (students/student-
// discounts/*.md gives no JSON sample for this DTO, only prose). Notably:
// - discountStatus is a NUMERIC enum, not a string label — a page that
//   compared it to 'Cancelled'/'CancelledImmediate' string literals would
//   silently never match and treat every assignment as still active. See
//   DISCOUNT_STATUS_VALUES/LABELS below.
// - discountCode/discountName come pre-resolved on this record, so no
//   separate Finance discount-catalogue lookup is needed just to show what
//   a student is assigned.
// - The two semester GUIDs are discountEffectiveFromSemesterGuid /
//   discountCancelledAtSemesterGuid (prefixed), not the bare
//   effectiveFromSemesterGuid/cancelledAtSemesterGuid guessed before.
export interface StudentDiscountDto {
  studentGuid: string
  discountGuid: string
  discountCode: string
  discountName: string
  calcType: number | null
  amtPer: number | null
  cop: string | null
  discountStatus: number
  discountEffectiveFromSemesterGuid: string | null
  discountCancelledAtSemesterGuid: string | null
  remarks: string | null
}

// Only "cancelled" is confirmed live so far — a second cancel call against
// an assignment already at status 3 was refused with "Discount is already
// cancelled." The 1/2 values below follow the same "start at 1, in the
// order the docs list the three states (Active / Cancelled /
// CancelledImmediate)" convention CALC_TYPE_VALUES uses elsewhere in this
// module, but aren't independently confirmed live — treat Active/Cancelled
// here with the same caution as any other unverified guess, and prefer
// `status !== DISCOUNT_STATUS_VALUES.Active` over comparing against a
// specific cancelled value when the only thing that matters is "is this
// still in force", since that check holds regardless of which of 2/3 is
// which.
export const DISCOUNT_STATUS_VALUES = { Active: 1, Cancelled: 2, CancelledImmediate: 3 } as const
export const DISCOUNT_STATUS_LABELS: Record<number, string> = {
  [DISCOUNT_STATUS_VALUES.Active]: 'Active',
  [DISCOUNT_STATUS_VALUES.Cancelled]: 'Cancelled',
  [DISCOUNT_STATUS_VALUES.CancelledImmediate]: 'Cancelled Immediately',
}

// A discount whose carryForward is false is stored as Cancelled with its
// cancelled-at semester equal to its effective-from semester — nobody
// cancelled it; that's how "one semester only" is saved
// (get-student-discount.md). It still applies to that semester, so it must
// not be read as "no discount". Takes the numeric status (StudentDiscountDto)
// or the string label (StudentDetailDto). A carry-forward discount cancelled
// "from next semester" in the semester it started looks identical — and it,
// too, applies to that one semester only, so the reading holds.
export function isOneSemesterDiscount(a: {
  discountStatus: number | string | null
  discountEffectiveFromSemesterGuid: string | null
  discountCancelledAtSemesterGuid: string | null
}) {
  const cancelled = a.discountStatus === DISCOUNT_STATUS_VALUES.Cancelled || a.discountStatus === 'Cancelled'
  return cancelled && !!a.discountEffectiveFromSemesterGuid
    && a.discountCancelledAtSemesterGuid === a.discountEffectiveFromSemesterGuid
}

// A one-semester discount is in force only while the student is still in
// that semester; after session movement it has ended. Unknown current
// semester → assume it's still the same one.
export function oneSemesterDiscountInForce(
  a: Parameters<typeof isOneSemesterDiscount>[0],
  currentSemesterGuid: string | null | undefined,
) {
  return isOneSemesterDiscount(a) && (!currentSemesterGuid || currentSemesterGuid === a.discountEffectiveFromSemesterGuid)
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
    // Mirrors the backend: a non-carry-forward discount is saved Cancelled,
    // ending in the semester it starts in.
    return getDiscounts().then(catalogue => {
      const discount = catalogue.find(d => d.discountGuid === payload.discountGuid)
      const oneSemester = discount?.carryForward === false
      const row: StudentDiscountDto = {
        studentGuid,
        discountGuid: payload.discountGuid,
        discountCode: discount?.discountCode ?? '',
        discountName: discount?.discountName ?? '',
        calcType: payload.calcType ?? null,
        amtPer: payload.amtPer ?? null,
        cop: payload.cop ?? null,
        discountStatus: oneSemester ? DISCOUNT_STATUS_VALUES.Cancelled : DISCOUNT_STATUS_VALUES.Active,
        discountEffectiveFromSemesterGuid: payload.effectiveFromSemesterGuid,
        discountCancelledAtSemesterGuid: oneSemester ? payload.effectiveFromSemesterGuid : null,
        remarks: payload.remarks ?? null,
      }
      mockDiscountAssignments[studentGuid] = row
      return row
    })
  }
  return apiPost<StudentDiscountDto>(`/api/v1/students/${studentGuid}/discount`, payload)
}

export function updateStudentDiscount(studentGuid: string, payload: UpdateStudentDiscountRequest): Promise<StudentDiscountDto> {
  if (MOCK_AUTH) {
    const existing = mockDiscountAssignments[studentGuid]
    if (!existing) throw new AuthError('not_found')
    if (existing.discountStatus !== DISCOUNT_STATUS_VALUES.Active) return Promise.reject(new Error('A cancelled discount cannot be updated.'))
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
    if (existing) existing.discountStatus = includeCurrentSemester ? DISCOUNT_STATUS_VALUES.CancelledImmediate : DISCOUNT_STATUS_VALUES.Cancelled
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
    const count = Object.values(mockDiscountAssignments).filter(a => a.discountGuid === discountGuid && a.discountStatus === DISCOUNT_STATUS_VALUES.Active).length
    return Promise.resolve(count)
  }
  return apiGet<number>(`/api/v1/students/discounts/${discountGuid}/active-assignment-count`)
}
