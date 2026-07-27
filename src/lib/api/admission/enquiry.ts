import { apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface EnquiryInput {
  intakeGuid: string
  campusGuid: string
  // Hardcoded per page — this form is the public "Online Enquiry" channel;
  // on-desk/kiosk enquiry pages hardcode their own distinct value (2 for
  // On-Desk, unconfirmed against a spec — see ondesk-enquiry/page.tsx).
  enquirySource: number
  studentName: string
  enquiryDate: string
  mobile: string
  email: string | null
  countryCode: string
  dob: string
  remarks: string | null
  programGuid: string | null
  // Isbat Enquiry Source (enquirySource.ts) only exposes isbatSourceGuid —
  // no numeric field has been confirmed for it yet, so this is always sent
  // null from the create forms until that's resolved. (Real records do
  // carry this — see Enquiry.intIsbatSource below — just not sourced from
  // the isbatSourceGuid-keyed master yet.)
  intIsbatSource: number | null
  // enquirySourceName from the (separate) Enquiry Source master.
  sourceName: string | null
  enquiryTag: string | null
}

// Confirmed via a real GET /api/v1/admissions/enquiries response.
// enquirySource/enquiryStatus/followUpStatus are int-encoded enums with no
// label mapping confirmed anywhere yet — don't guess labels for these,
// display the raw numbers until confirmed (same caution as discount.ts's
// calcType). campusName/campusCode/programName/programCode come back null
// on every row seen so far — the backend isn't resolving them — so callers
// should resolve programGuid/campusGuid client-side instead of trusting
// these fields.
export interface Enquiry {
  enquiryGuid: string
  enquiryCode: string
  intakeGuid: string
  campusGuid: string
  enquirySource: number
  studentName: string
  enquiryDate: string
  mobile: string
  email: string
  countryCode: string
  dob: string
  remarks: string | null
  programGuid: string | null
  advisorGuid: string | null
  followUpStatus: number | null
  enquiryStatus: number | null
  nextFollowDate: string | null
  enquiryTag: string | null
  intIsbatSource: number | null
  sourceName: string | null
  campusName: string | null
  campusCode: string | null
  programName: string | null
  programCode: string | null
}

interface EnquiryListResult {
  items: Enquiry[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Confirmed via Update.bru — a materially different, narrower shape than
// EnquiryInput: "assign advisor, change status, assign program/campus."
// All fields optional except campusGuid per the docs. enquiryStatus is
// deliberately left out — it's a number with no confirmed source (the
// Enquiry Status master only exposes a guid) — until that's resolved.
export interface EnquiryUpdateInput {
  advisorGuid?: string | null
  programGuid?: string | null
  campusGuid: string
}

let mockEnquirySeq = 1

// In-memory list used only when mock auth is enabled, so the list query has
// something to show after a mock create.
const mockEnquiries: Enquiry[] = []

export function createEnquiry(input: EnquiryInput): Promise<unknown> {
  if (MOCK_AUTH) {
    const enquiry: Enquiry = {
      enquiryGuid: String(mockEnquirySeq),
      enquiryCode: `EQ-MOCK-${mockEnquirySeq++}`,
      ...input,
      email: input.email ?? '',
      advisorGuid: null,
      followUpStatus: null,
      enquiryStatus: null,
      nextFollowDate: null,
      campusName: null,
      campusCode: null,
      programName: null,
      programCode: null,
    }
    mockEnquiries.unshift(enquiry)
    return Promise.resolve(enquiry)
  }
  return apiPost<unknown>('/api/v1/admissions/enquiries', input)
}

// List query for the enquiry-list page. Real: paginated, page/pageSize
// passed straight through (confirmed via List.bru + a real sample response).
export function getEnquiries(page = 1, pageSize = 10): Promise<EnquiryListResult> {
  if (MOCK_AUTH) {
    return Promise.resolve({ items: mockEnquiries, totalCount: mockEnquiries.length, pageNumber: page, pageSize })
  }
  return apiGet<EnquiryListResult | null>(`/api/v1/admissions/enquiries?page=${page}&pageSize=${pageSize}`)
    .then(data => data ?? { items: [], totalCount: 0, pageNumber: page, pageSize })
}

// Fetch one enquiry by its GUID — same EnquiryDto shape as the list items.
export function getEnquiryById(guid: string): Promise<Enquiry> {
  if (MOCK_AUTH) {
    const existing = mockEnquiries.find(e => e.enquiryGuid === guid)
    if (!existing) return Promise.reject(new Error('Enquiry not found'))
    return Promise.resolve(existing)
  }
  return apiGet<Enquiry>(`/api/v1/admissions/enquiries/${guid}`)
}

// Assign advisor/programme/campus and (once confirmed) status on an
// existing enquiry.
export function updateEnquiry(guid: string, input: EnquiryUpdateInput): Promise<Enquiry> {
  if (MOCK_AUTH) {
    const existing = mockEnquiries.find(e => e.enquiryGuid === guid)
    if (!existing) return Promise.reject(new Error('Enquiry not found'))
    if (input.advisorGuid !== undefined) existing.advisorGuid = input.advisorGuid
    if (input.programGuid !== undefined) existing.programGuid = input.programGuid
    existing.campusGuid = input.campusGuid
    return Promise.resolve(existing)
  }
  return apiPut<Enquiry>(`/api/v1/admissions/enquiries/${guid}`, input)
}
