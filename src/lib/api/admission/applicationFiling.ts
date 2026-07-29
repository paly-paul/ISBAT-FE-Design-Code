import { apiDelete, apiGet, apiPost, apiPostForm } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// One row returned by GET /payment-search. The docs only describe this
// endpoint in prose ("search matches on student name, email, phone, or ref
// no") without giving an exact response shape — this is modeled defensively
// off the confirmed /lookup shape (appRefNo/intApplication/applicationGuid/
// status) plus the display fields implied by what it searches on. Verify
// against a real response and correct field names if they differ.
export interface FilingApplicationSearchResult {
  appRefNo: string
  intApplication: number
  applicationGuid: string
  status: string | null
  studentName: string | null
  email: string | null
  phone: string | null
}

interface FilingApplicationSearchResponse {
  items: FilingApplicationSearchResult[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Confirmed via the Application Filling API docs' "Dummy Payload" table for
// POST /general. countryGuid/spCountryGuid are deliberately NOT included —
// the docs say they must come from "the Identity module countries GET API,"
// but the only countries endpoint wired anywhere in this codebase
// (GET /api/v1/users/countries) has no guid field at all, only
// intCountryCode — same gap as countryGuid on the application-payments
// Create payload. Omit rather than guess until a real guid source exists.
export interface SaveGeneralInput {
  appRefNo: string
  enquiryGuid: string | null
  intakeCode: string | null
  emailId: string | null
  dob: string | null
  firstName: string | null
  lastName: string | null
  gender: number | null
  phone: string | null
  nationalId: string | null
  nationalIdFile: File | null
  passportNo: string | null
  passportFile: File | null
  vStartDate: string | null
  vEndDate: string | null
  visaFile: File | null
  spName: string | null
  spEmail: string | null
  spPhone: string | null
  campusGuid: string
  programGuid: string
  feeHdGuid: string
  semesterGuid: string | null
  batchTimeGuid: string | null
  batchGuid: string | null
  refugee: number
  refugeeId: string | null
  refugeeFile: File | null
}

export interface SaveGeneralResponse {
  intApplication: number
  applicationGuid: string
  isFirstSave: boolean
  saveStep: number
}

export interface SaveQualificationInput {
  appRefNo: string
  institution: string
  university: string
  passYear: number
  grade: string
  yearsTaken: number
  proofFile: File
}

export interface SaveQualificationResponse {
  intApplicationQual: number
  appRefNo: string
}

export interface SubmitApplicationResponse {
  intApplication: number
  appRefNo: string
}

const mockSearchResults: FilingApplicationSearchResult[] = [
  { appRefNo: 'APP2026/1', intApplication: 1, applicationGuid: 'mock-app-1', status: 'Paid', studentName: 'Nakato Sarah', email: 'nakato.s@example.com', phone: '700000001' },
]

export function searchApplicationsForFiling(searchTerm: string, pageNumber = 1, pageSize = 20): Promise<FilingApplicationSearchResponse> {
  if (MOCK_AUTH) {
    const items = searchTerm.trim()
      ? mockSearchResults.filter(r => `${r.appRefNo} ${r.studentName} ${r.email} ${r.phone}`.toLowerCase().includes(searchTerm.toLowerCase()))
      : mockSearchResults
    return Promise.resolve({ items, totalCount: items.length, pageNumber, pageSize })
  }
  return apiGet<FilingApplicationSearchResponse | null>(
    `/api/v1/admissions/application-filling/payment-search?searchTerm=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
  ).then(data => data ?? { items: [], totalCount: 0, pageNumber, pageSize })
}

export function saveGeneral(input: SaveGeneralInput): Promise<SaveGeneralResponse> {
  if (MOCK_AUTH) {
    return Promise.resolve({ intApplication: 1, applicationGuid: 'mock-app-1', isFirstSave: true, saveStep: 1 })
  }

  const formData = new FormData()
  formData.append('appRefNo', input.appRefNo)
  if (input.enquiryGuid) formData.append('enquiryGuid', input.enquiryGuid)
  if (input.intakeCode) formData.append('intakeCode', input.intakeCode)
  if (input.emailId) formData.append('emailId', input.emailId)
  if (input.dob) formData.append('dob', input.dob)
  if (input.firstName) formData.append('firstName', input.firstName)
  if (input.lastName) formData.append('lastName', input.lastName)
  if (input.gender != null) formData.append('gender', String(input.gender))
  if (input.phone) formData.append('phone', input.phone)
  if (input.nationalId) formData.append('nationalId', input.nationalId)
  if (input.nationalIdFile) formData.append('nationalIdFile', input.nationalIdFile)
  if (input.passportNo) formData.append('passportNo', input.passportNo)
  if (input.passportFile) formData.append('passportFile', input.passportFile)
  if (input.vStartDate) formData.append('vStartDate', input.vStartDate)
  if (input.vEndDate) formData.append('vEndDate', input.vEndDate)
  if (input.visaFile) formData.append('visaFile', input.visaFile)
  if (input.spName) formData.append('spName', input.spName)
  if (input.spEmail) formData.append('spEmail', input.spEmail)
  if (input.spPhone) formData.append('spPhone', input.spPhone)
  formData.append('campusGuid', input.campusGuid)
  formData.append('programGuid', input.programGuid)
  formData.append('feeHdGuid', input.feeHdGuid)
  if (input.semesterGuid) formData.append('semesterGuid', input.semesterGuid)
  if (input.batchTimeGuid) formData.append('batchTimeGuid', input.batchTimeGuid)
  if (input.batchGuid) formData.append('batchGuid', input.batchGuid)
  formData.append('refugee', String(input.refugee))
  if (input.refugeeId) formData.append('refugeeId', input.refugeeId)
  if (input.refugeeFile) formData.append('refugeeFile', input.refugeeFile)

  return apiPostForm<SaveGeneralResponse>('/api/v1/admissions/application-filling/general', formData)
}

export function saveQualification(input: SaveQualificationInput): Promise<SaveQualificationResponse> {
  if (MOCK_AUTH) {
    return Promise.resolve({ intApplicationQual: Math.floor(Math.random() * 100000), appRefNo: input.appRefNo })
  }

  const formData = new FormData()
  formData.append('appRefNo', input.appRefNo)
  formData.append('institution', input.institution)
  formData.append('university', input.university)
  formData.append('passYear', String(input.passYear))
  formData.append('grade', input.grade)
  formData.append('yearsTaken', String(input.yearsTaken))
  formData.append('proofFile', input.proofFile)

  return apiPostForm<SaveQualificationResponse>('/api/v1/admissions/application-filling/qualifications', formData)
}

export function deleteQualification(intApplicationQual: number): Promise<unknown> {
  if (MOCK_AUTH) return Promise.resolve({ success: true })
  return apiDelete<unknown>(`/api/v1/admissions/application-filling/qualifications/${intApplicationQual}`)
}

export function uploadPhoto(appRefNo: string, photo: File): Promise<unknown> {
  if (MOCK_AUTH) return Promise.resolve({ success: true })
  const formData = new FormData()
  formData.append('appRefNo', appRefNo)
  formData.append('photo', photo)
  return apiPostForm<unknown>('/api/v1/admissions/application-filling/photo', formData)
}

export function submitApplication(intApplication: number, appRefNo: string): Promise<SubmitApplicationResponse> {
  if (MOCK_AUTH) return Promise.resolve({ intApplication, appRefNo })
  return apiPost<SubmitApplicationResponse>(`/api/v1/admissions/application-filling/${intApplication}/submit`, {
    appRefNo,
    declarationAccepted: true,
  })
}
