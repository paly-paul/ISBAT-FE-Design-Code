import { apiDelete, apiGet, apiPost, apiPostForm } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// ODeL (Online & Distance e-Learning) application wizard — the 9 endpoints
// documented in /odel-application/*.md. The applicant is identified only by
// the application GUID (no OTP / token): staff open an application by its ref
// no. + registered email (POST /search) or create one with the first General
// save (POST /general, no GUID), and every later call carries that GUID.
//
// Gateway note (see post-odel-search.md): /api/v1/admissions/portal/odel/* is
// not routed anonymously yet, so these calls only work with a staff cookie —
// which is exactly how this page is used.
const BASE = '/api/v1/admissions/portal/odel'

// How far the applicant has got. Only ever moves up; used to unlock the tabs.
export const ODEL_SAVE_STATUS = { general: 1, qualification: 2, photo: 3, paymentSlip: 4 } as const

export interface OdelApplication {
  odelApplicationGuid: string
  appRefNo: string
  saveStatus: number            // 1 General, 2 Qualification, 3 Photo, 4 Payment slip
  status: number                // 0 in progress, 1 submitted (never returned here)
  email: string | null
  dob: string | null            // 2000-05-10T00:00:00
  firstName: string | null
  lastName: string | null
  gender: number | null         // 0 Male, 1 Female, 2 Other
  countryGuid: string | null
  phoneCode: string | null      // dial code without '+', e.g. "256"
  phone: string | null
  nationalId: string | null
  passportNo: string | null
  vStartDate: string | null
  vEndDate: string | null
  spName: string | null
  spEmail: string | null
  spCountryGuid: string | null  // the sponsor PHONE's dial-code country
  spPhone: string | null
  campusGuid: string | null
  programGuid: string | null
  semesterGuid: string | null
  batchTimeGuid: string | null  // GUID only — matched against the batch-time dropdown
  refugee: number               // 1 = refugee
  refugeeId: string | null
  countryName: string | null
  spCountryName: string | null
  campusName: string | null
  programName: string | null
  semesterName: string | null
}

export interface OdelSearchInput {
  appRefNo: string
  email: string
}

// Keys are camelCase to match the multipart field names one-to-one.
export interface OdelSaveGeneralInput {
  odelApplicationGuid: string | null   // null → create, set → update
  emailId: string
  dob: string                          // yyyy-mm-dd
  firstName: string
  lastName: string
  gender: number
  countryGuid: string
  phoneCode: string
  phone: string
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
  spCountryGuid: string | null
  campusGuid: string
  programGuid: string
  semesterGuid: string
  batchTimeGuid: string
  refugee: number
  refugeeId: string | null
}

export interface OdelSaveGeneralResponse {
  odelApplicationGuid: string
  appRefNo: string
  isFirstSave: boolean
  saveStatus: number
}

export interface OdelQualification {
  odelApplicationQualGuid: string
  institution: string
  university: string
  passYear: number
  grade: string
  yearsTaken: number
  proofUrl: string | null
}

export interface OdelQualificationInput {
  odelApplicationGuid: string
  odelApplicationQualGuid: string | null   // null → add, set → update
  institution: string
  university: string
  passYear: number
  grade: string
  yearsTaken: number
  proofFile: File | null                   // required on add, optional on update
}

export interface OdelQualificationSaveResponse {
  odelApplicationQualGuid: string
  saveStatus: number
  isNew: boolean
}

export interface OdelPhotoResponse {
  odelApplicationGuid: string
  saveStatus: number
  photoUrl: string
}

export interface OdelPaymentSlipResponse {
  odelApplicationGuid: string
  saveStatus: number
  slipUrl: string
}

// ---- Mock mode --------------------------------------------------------------
// In-memory only; files are kept as blob: URLs so the preview modal can open them.
const mockApps = new Map<string, OdelApplication & { photoUrl: string | null; slipUrl: string | null; quals: OdelQualification[] }>()
let mockSeq = 74

function mockGet(guid: string) {
  const app = mockApps.get(guid)
  if (!app) throw new Error('Application not found.')
  return app
}

// ---- Search -----------------------------------------------------------------
// The backend sometimes returns the literal text "null" for empty strings.
const orNull = (s: string | null | undefined) => (s && s !== 'null' ? s : null)

export function searchOdelApplication(input: OdelSearchInput): Promise<OdelApplication> {
  if (MOCK_AUTH) {
    const found = [...mockApps.values()].find(a => a.appRefNo === input.appRefNo.trim() && a.email === input.email.trim())
    if (!found) return Promise.reject(new Error('Application Reference number does not exist, please check again!'))
    return Promise.resolve(found)
  }
  return apiPost<OdelApplication>(`${BASE}/search`, { appRefNo: input.appRefNo.trim(), email: input.email.trim() }).then(a => ({
    ...a,
    email: orNull(a.email),
    nationalId: orNull(a.nationalId),
    passportNo: orNull(a.passportNo),
    spName: orNull(a.spName),
    spEmail: orNull(a.spEmail),
    spPhone: orNull(a.spPhone),
    refugeeId: orNull(a.refugeeId),
  }))
}

// ---- General ----------------------------------------------------------------
export function saveOdelGeneral(input: OdelSaveGeneralInput): Promise<OdelSaveGeneralResponse> {
  if (MOCK_AUTH) {
    const isFirstSave = !input.odelApplicationGuid
    const guid = input.odelApplicationGuid ?? `mock-odel-${++mockSeq}`
    const prev = mockApps.get(guid)
    mockApps.set(guid, {
      odelApplicationGuid: guid,
      appRefNo: prev?.appRefNo ?? `ODeL20261/${mockSeq}`,
      saveStatus: Math.max(prev?.saveStatus ?? 0, 1),
      status: 0,
      email: input.emailId, dob: input.dob, firstName: input.firstName, lastName: input.lastName, gender: input.gender,
      countryGuid: input.countryGuid, phoneCode: input.phoneCode.replace('+', ''), phone: input.phone,
      nationalId: input.nationalId, passportNo: input.passportNo, vStartDate: input.vStartDate, vEndDate: input.vEndDate,
      spName: input.spName, spEmail: input.spEmail, spCountryGuid: input.spCountryGuid, spPhone: input.spPhone,
      campusGuid: input.campusGuid, programGuid: input.programGuid, semesterGuid: input.semesterGuid, batchTimeGuid: input.batchTimeGuid,
      refugee: input.refugee, refugeeId: input.refugeeId,
      countryName: null, spCountryName: null, campusName: null, programName: null, semesterName: null,
      photoUrl: prev?.photoUrl ?? null, slipUrl: prev?.slipUrl ?? null, quals: prev?.quals ?? [],
    })
    const app = mockApps.get(guid)!
    return Promise.resolve({ odelApplicationGuid: guid, appRefNo: app.appRefNo, isFirstSave, saveStatus: app.saveStatus })
  }

  // Empty optional fields are left out of the form so they bind as real nulls
  // (same "omit, don't send 'null'" convention as application filing). A file
  // that isn't sent keeps the stored one; a file that is sent replaces it.
  const formData = new FormData()
  const appendOpt = (name: string, value: string | null | undefined) => { if (value) formData.append(name, value) }
  appendOpt('odelApplicationGuid', input.odelApplicationGuid)
  formData.append('emailId', input.emailId)
  formData.append('dob', input.dob)
  formData.append('firstName', input.firstName)
  formData.append('lastName', input.lastName)
  formData.append('gender', String(input.gender))
  formData.append('countryGuid', input.countryGuid)
  formData.append('phoneCode', input.phoneCode.replace(/^\+/, ''))
  formData.append('phone', input.phone)
  appendOpt('nationalId', input.nationalId)
  if (input.nationalIdFile) formData.append('nationalIdFile', input.nationalIdFile)
  appendOpt('passportNo', input.passportNo)
  if (input.passportFile) formData.append('passportFile', input.passportFile)
  appendOpt('vStartDate', input.vStartDate)
  appendOpt('vEndDate', input.vEndDate)
  if (input.visaFile) formData.append('visaFile', input.visaFile)
  appendOpt('spName', input.spName)
  appendOpt('spEmail', input.spEmail)
  appendOpt('spPhone', input.spPhone)
  appendOpt('spCountryGuid', input.spCountryGuid)
  formData.append('campusGuid', input.campusGuid)
  formData.append('programGuid', input.programGuid)
  formData.append('semesterGuid', input.semesterGuid)
  formData.append('batchTimeGuid', input.batchTimeGuid)
  formData.append('refugee', String(input.refugee))
  if (input.refugee === 1) appendOpt('refugeeId', input.refugeeId)

  return apiPostForm<OdelSaveGeneralResponse>(`${BASE}/general`, formData)
}

// ---- Qualifications ---------------------------------------------------------
export function getOdelQualifications(odelApplicationGuid: string): Promise<OdelQualification[]> {
  if (MOCK_AUTH) return Promise.resolve([...mockGet(odelApplicationGuid).quals].sort((a, b) => b.passYear - a.passYear))
  return apiGet<OdelQualification[] | null>(`${BASE}/${odelApplicationGuid}/qualifications`).then(rows => rows ?? [])
}

export function saveOdelQualification(input: OdelQualificationInput): Promise<OdelQualificationSaveResponse> {
  if (MOCK_AUTH) {
    const app = mockGet(input.odelApplicationGuid)
    const guid = input.odelApplicationQualGuid ?? `mock-qual-${Date.now()}`
    const existing = app.quals.find(q => q.odelApplicationQualGuid === guid)
    const row: OdelQualification = {
      odelApplicationQualGuid: guid, institution: input.institution, university: input.university,
      passYear: input.passYear, grade: input.grade, yearsTaken: input.yearsTaken,
      proofUrl: input.proofFile ? URL.createObjectURL(input.proofFile) : existing?.proofUrl ?? null,
    }
    app.quals = existing ? app.quals.map(q => (q.odelApplicationQualGuid === guid ? row : q)) : [...app.quals, row]
    app.saveStatus = Math.max(app.saveStatus, 2)
    return Promise.resolve({ odelApplicationQualGuid: guid, saveStatus: app.saveStatus, isNew: !existing })
  }

  const formData = new FormData()
  formData.append('odelApplicationGuid', input.odelApplicationGuid)
  if (input.odelApplicationQualGuid) formData.append('odelApplicationQualGuid', input.odelApplicationQualGuid)
  formData.append('institution', input.institution)
  formData.append('university', input.university)
  formData.append('passYear', String(input.passYear))
  formData.append('grade', input.grade)
  formData.append('yearsTaken', String(input.yearsTaken))
  if (input.proofFile) formData.append('proofFile', input.proofFile)
  return apiPostForm<OdelQualificationSaveResponse>(`${BASE}/qualifications`, formData)
}

// Soft delete — the proof file stays stored and saveStatus is not lowered.
export function deleteOdelQualification(odelApplicationGuid: string, qualificationGuid: string): Promise<unknown> {
  if (MOCK_AUTH) {
    const app = mockGet(odelApplicationGuid)
    app.quals = app.quals.filter(q => q.odelApplicationQualGuid !== qualificationGuid)
    return Promise.resolve({})
  }
  return apiDelete<unknown>(`${BASE}/${odelApplicationGuid}/qualifications/${qualificationGuid}`)
}

// ---- Photo ------------------------------------------------------------------
export function getOdelPhoto(odelApplicationGuid: string): Promise<string | null> {
  if (MOCK_AUTH) return Promise.resolve(mockGet(odelApplicationGuid).photoUrl)
  return apiGet<string | null>(`${BASE}/${odelApplicationGuid}/photo`).then(url => url ?? null)
}

export function uploadOdelPhoto(odelApplicationGuid: string, photo: File): Promise<OdelPhotoResponse> {
  if (MOCK_AUTH) {
    const app = mockGet(odelApplicationGuid)
    app.photoUrl = URL.createObjectURL(photo)
    app.saveStatus = Math.max(app.saveStatus, 3)
    return Promise.resolve({ odelApplicationGuid, saveStatus: app.saveStatus, photoUrl: app.photoUrl })
  }
  const formData = new FormData()
  formData.append('odelApplicationGuid', odelApplicationGuid)
  formData.append('photo', photo)
  return apiPostForm<OdelPhotoResponse>(`${BASE}/photo`, formData)
}

// ---- Payment slip -----------------------------------------------------------
// Offline (slip) payment only — online (DPO) payment is not built.
export function getOdelPaymentSlip(odelApplicationGuid: string): Promise<string | null> {
  if (MOCK_AUTH) return Promise.resolve(mockGet(odelApplicationGuid).slipUrl)
  return apiGet<string | null>(`${BASE}/${odelApplicationGuid}/payment-slip`).then(url => url ?? null)
}

export function uploadOdelPaymentSlip(odelApplicationGuid: string, slip: File): Promise<OdelPaymentSlipResponse> {
  if (MOCK_AUTH) {
    const app = mockGet(odelApplicationGuid)
    app.slipUrl = URL.createObjectURL(slip)
    app.saveStatus = Math.max(app.saveStatus, 4)
    return Promise.resolve({ odelApplicationGuid, saveStatus: app.saveStatus, slipUrl: app.slipUrl })
  }
  const formData = new FormData()
  formData.append('odelApplicationGuid', odelApplicationGuid)
  formData.append('slip', slip)
  return apiPostForm<OdelPaymentSlipResponse>(`${BASE}/payment-slip`, formData)
}


