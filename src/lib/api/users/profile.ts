import { apiGet, apiPutForm } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// GET /api/v1/users/employees/me (get-my-profile.md) — the signed-in staff
// member's own profile. Read-only; always the caller's own record, so every
// field (national ID, date of birth) comes back in full. Missing values are
// null, lists are [].

export interface MyProfile {
  employeeGuid: string
  shortCode: string                 // staff number, e.g. AC/00012
  empName: string
  title: string | null
  surname: string | null
  firstName: string | null
  otherName: string | null
  // Signed link to the photo; expires after ~1 hour. null = no photo.
  photoUrl: string | null
  personal: {
    birthDate: string | null
    sex: number | null              // 0 Male, 1 Female
    sexName: string | null
    maritalStatus: number | null    // 0 Single, 1 Married
    maritalStatusName: string | null
    placeOfBirth: string | null
    countryName: string | null
    nationality: string | null
  }
  // Two identity-number fields; many staff only have one.
  documents: { nationalId: string | null; natId: string | null }
  contact: { email: string | null; phone: string | null }
  account: {
    userName: string | null
    userTypeName: string | null     // Administrator, Lecturer, HR…
    lastLoginDate: string | null
    emailVerified: boolean
  }
  status: {
    status: number | null           // 0 Locked, 1 Pending, 2 Active, 4 Blocked
    statusName: string | null
    category: number | null         // code only, no name
  }
  campuses: { campusGuid: string; campusName: string | null }[]   // sorted by name
  skills: { skillName: string; proficiency: number; approvalStatus: 'Pending' | 'Approved' | 'Rejected' | string; isApproved: boolean }[]
}

export const PROFILE_STATUS_ACTIVE = 2

const MOCK_PROFILE: MyProfile = {
  employeeGuid: '7d095cf5-03d7-447e-9336-6e9f100b723a',
  shortCode: 'AC/00012',
  empName: 'JANE DOE',
  title: 'Ms',
  surname: 'DOE',
  firstName: 'JANE',
  otherName: null,
  photoUrl: null,
  personal: { birthDate: '1990-01-01T00:00:00', sex: 1, sexName: 'Female', maritalStatus: 1, maritalStatusName: 'Married', placeOfBirth: 'Kampala', countryName: 'Uganda', nationality: 'Ugandan' },
  documents: { nationalId: 'CM90012345678AB', natId: 'NAT-0012' },
  contact: { email: 'jane.doe@isbat.ac.ug', phone: '0700000000' },
  account: { userName: 'JANE', userTypeName: 'Lecturer', lastLoginDate: '2026-11-01T08:15:00', emailVerified: true },
  status: { status: 2, statusName: 'Active', category: 1 },
  campuses: [{ campusGuid: '19b1b516-166b-4855-991a-32b40261e765', campusName: 'ISBAT University - Main Campus' }],
  skills: [
    { skillName: 'Databases', proficiency: 4, approvalStatus: 'Approved', isApproved: true },
    { skillName: 'Networking', proficiency: 3, approvalStatus: 'Pending', isApproved: false },
  ],
}

// Errors: employee_required (400, account not linked to an employee),
// not_found (404, employee record gone), unauthorized (401).
export function getMyProfile(): Promise<MyProfile> {
  if (MOCK_AUTH) return new Promise(resolve => setTimeout(() => resolve(MOCK_PROFILE), 400))
  return apiGet<MyProfile>('/api/v1/users/employees/me')
}

// PUT /api/v1/users/employees/me/photo (put-my-photo.md) — add or replace the
// signed-in employee's own photo. multipart `photo`, JPG or PNG up to 2 MB.
// No Content-Type header is set, so the browser adds the boundary.
// Errors: validation_error (400, wrong type / too big), employee_required
// (400), not_found (404), unauthorized (401).
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png']

export function putMyPhoto(photo: File): Promise<{ photoUrl: string }> {
  if (MOCK_AUTH) return new Promise(resolve => setTimeout(() => resolve({ photoUrl: URL.createObjectURL(photo) }), 400))
  const fd = new FormData()
  fd.append('photo', photo)
  return apiPutForm<{ photoUrl: string }>('/api/v1/users/employees/me/photo', fd)
}
