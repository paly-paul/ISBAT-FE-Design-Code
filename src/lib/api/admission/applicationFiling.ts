import { apiDelete, apiGet, apiPost, apiPostForm } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed via a real GET /payment-search response — a genuinely different,
// much richer shape than first guessed (no intApplication/status/studentName
// fields at all; name is split firstName/lastName, email is emailId, and it
// carries the full set of fields SaveGeneral needs — intake/campus/program/
// semester/feeHd guids, dob, gender, nationalId, passportNo, countryGuid,
// refugee/refugeeId). saveStatus/action/studCategory/intRegistrar are
// int-encoded with no confirmed label mapping — display raw, don't guess,
// same caution as Enquiry's enquiryStatus. Used to prefill the Personal
// Info tab when an application is selected, since all this data is already
// known — the user can still edit anything afterward.
export interface FilingApplicationSearchResult {
  applicationGuid: string
  appRefNo: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  emailId: string | null
  whatsApp: string | null
  intakeCode: string | null
  yearCode: string | null
  intakeGuid: string | null
  campusGuid: string | null
  programGuid: string | null
  semesterGuid: string | null
  feeHdGuid: string | null
  action: number | null
  saveStatus: number | null
  refugee: number | null
  refugeeId: string | null
  studCategory: number | null
  gender: number | null
  nationalId: string | null
  passportNo: string | null
  countryGuid: string | null
  universityEmail: string | null
  dob: string | null
  justificationReg: string | null
  approveDateReg: string | null
  intRegistrar: number | null
  docVerified: boolean | null
  verifiedDate: string | null
  docRemarks: string | null
  admLetterSend: number | null
  provLetterSend: number | null
  accLetterSend: number | null
  createdDate: string
}

interface FilingApplicationSearchResponse {
  items: FilingApplicationSearchResult[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Confirmed via Application-Filling/SaveGeneral.bru — countryGuid/
// spCountryGuid ARE real fields ("countryGuid replaces old intCountry +
// countryCode fields", "spCountryGuid replaces old spCountryCode field").
// The dedicated Application-Filling/Countries.bru dropdown (GET
// .../application-filling/countries, see CountryDropdownDto below) turned
// out to have NO guid at all, only the legacy intCountry int — the real
// guid-bearing source is GET /api/v1/users/countries (lib/api/academic/
// country.ts, useCountries()), confirmed end-to-end: sending its
// countryGuid on Application-Payments' Create produced a real successful
// payment. Both this form and Application-Payments now source their
// Country dropdown from useCountries() instead.
export interface SaveGeneralInput {
  appRefNo: string
  enquiryGuid: string | null
  intakeCode: string | null
  emailId: string | null
  dob: string | null
  firstName: string | null
  lastName: string | null
  gender: number | null
  countryGuid: string | null
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
  spCountryGuid: string | null
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

// SUPERSEDED for countryGuid purposes — confirmed via a real response that
// this endpoint has no guid field at all, only the legacy intCountry int,
// despite SaveGeneral.bru/Create.bru both requiring a countryGuid. The real
// guid-bearing Country source is GET /api/v1/users/countries instead (see
// lib/api/academic/country.ts, useCountries()) — use that for any new
// country dropdown. Kept defined here (and still fetchable via
// getFilingCountries()) in case this endpoint's intCountry/dialCode data is
// useful for something else later, but no current caller uses it.
export interface CountryDropdownDto {
  intCountry: number
  countryName: string
  dialCode: string
  isDefault: boolean
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
  {
    applicationGuid: 'mock-app-1', appRefNo: 'APP2026/1', firstName: 'Nakato Sarah', lastName: null,
    phone: '700000001', emailId: 'nakato.s@example.com', whatsApp: null,
    intakeCode: '20261', yearCode: '2026', intakeGuid: null, campusGuid: null, programGuid: null, semesterGuid: null, feeHdGuid: null,
    action: 1, saveStatus: 4, refugee: 0, refugeeId: '', studCategory: 1, gender: 0,
    nationalId: 'NATIONAL ID', passportNo: '', countryGuid: null, universityEmail: null, dob: '2000-01-01T00:00:00',
    justificationReg: null, approveDateReg: null, intRegistrar: null, docVerified: null, verifiedDate: null, docRemarks: null,
    admLetterSend: null, provLetterSend: null, accLetterSend: null, createdDate: '2026-01-01T00:00:00',
  },
]

const mockCountries: CountryDropdownDto[] = [
  { intCountry: 1, countryName: 'Uganda', dialCode: 'UG', isDefault: true },
  { intCountry: 3, countryName: 'Kenya', dialCode: 'KEN', isDefault: false },
  { intCountry: 4, countryName: 'Tanzania', dialCode: 'TZ', isDefault: false },
]

export function getFilingCountries(): Promise<CountryDropdownDto[]> {
  if (MOCK_AUTH) return Promise.resolve(mockCountries)
  return apiGet<CountryDropdownDto[] | null>('/api/v1/admissions/application-filling/countries').then(data => data ?? [])
}

export function searchApplicationsForFiling(searchTerm: string, pageNumber = 1, pageSize = 20): Promise<FilingApplicationSearchResponse> {
  if (MOCK_AUTH) {
    const items = searchTerm.trim()
      ? mockSearchResults.filter(r => `${r.appRefNo} ${r.firstName} ${r.emailId} ${r.phone}`.toLowerCase().includes(searchTerm.toLowerCase()))
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
  formData.append('enquiryGuid', input.enquiryGuid ?? '')
  formData.append('intakeCode', input.intakeCode ?? '')
  formData.append('emailId', input.emailId ?? '')
  formData.append('dob', input.dob ?? '')
  formData.append('firstName', input.firstName ?? '')
  formData.append('lastName', input.lastName ?? '')
  formData.append('gender', input.gender != null ? String(input.gender) : '')
  formData.append('countryGuid', input.countryGuid ?? '')
  formData.append('phone', input.phone ?? '')
  formData.append('nationalId', input.nationalId ?? '')
  if (input.nationalIdFile) formData.append('nationalIdFile', input.nationalIdFile)
  formData.append('passportNo', input.passportNo ?? '')
  if (input.passportFile) formData.append('passportFile', input.passportFile)
  formData.append('vStartDate', input.vStartDate ?? '')
  formData.append('vEndDate', input.vEndDate ?? '')
  if (input.visaFile) formData.append('visaFile', input.visaFile)
  formData.append('spName', input.spName ?? '')
  formData.append('spEmail', input.spEmail ?? '')
  formData.append('spCountryGuid', input.spCountryGuid ?? '')
  formData.append('spPhone', input.spPhone ?? '')
  formData.append('campusGuid', input.campusGuid)
  formData.append('programGuid', input.programGuid)
  formData.append('feeHdGuid', input.feeHdGuid)
  formData.append('semesterGuid', input.semesterGuid ?? '')
  formData.append('batchTimeGuid', input.batchTimeGuid ?? '')
  formData.append('batchGuid', input.batchGuid ?? '')
  formData.append('refugee', String(input.refugee))
  formData.append('refugeeId', input.refugeeId ?? '')
  if (input.refugeeFile) formData.append('refugeeFile', input.refugeeFile)

  // Debug: log FormData entries
  console.log('📤 saveGeneral FormData entries:')
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`)
    } else {
      console.log(`  ${key}: ${value}`)
    }
  }

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
