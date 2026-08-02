import { apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Confirmed field-for-field against a real Create.bru sample payload —
// note there's no top-level `enquirySource` int on create (that field only
// appears on the read-side Enquiry DTO below); don't add it back in.
export interface EnquiryInput {
  intakeGuid: string
  campusGuid: string
  // Required — confirmed via a real validation_error ("'Request Enquiry
  // Source Guid' must not be empty.") when omitted. The guid of the
  // selected Enquiry Source master record (enquirySourceMaster.ts /
  // /config/enquiry-source-master), not the Isbat one below.
  enquirySourceGuid: string
  studentName: string
  enquiryDate: string
  mobile: string
  email: string | null
  countryCode: string
  dob: string
  remarks: string | null
  programGuid: string | null
  // Isbat Enquiry Source guid (enquirySource.ts's isbatSourceGuid) — a
  // genuinely different master from enquirySourceGuid above. Confirmed as
  // a guid field (not the previously-assumed unconfirmed int), but the
  // create forms don't have an Isbat Enquiry Source picker, so this is
  // still always sent null.
  isbatSourceGuid: string | null
  // enquirySourceName from the (separate) Enquiry Source master.
  sourceName: string | null
  enquiryTag: string | null
}

// Confirmed field-for-field against a real GET /api/v1/admissions/enquiries/:guid
// response — supersedes the earlier guess that enquirySource/enquiryStatus/
// followUpStatus/intIsbatSource were unconfirmed ints. They're all guids
// (or absent entirely, in enquirySource's case — there's no int on read
// either, only enquirySourceGuid). No label mapping exists client-side for
// followUpStatusGuid/enquiryStatusGuid yet — resolve via the
// FollowUpStatus/EnquiryStatus masters (useFollowUpStatuses/useEnquiryStatuses)
// rather than displaying the raw guid. campusName/campusCode/programName/
// programCode come back null on every row seen so far — the backend isn't
// resolving them — so callers should resolve programGuid/campusGuid
// client-side instead of trusting these fields.
export interface Enquiry {
  enquiryGuid: string
  enquiryCode: string
  intakeGuid: string
  campusGuid: string
  enquirySourceGuid: string | null
  studentName: string
  enquiryDate: string
  mobile: string
  email: string
  countryCode: string
  dob: string
  remarks: string | null
  programGuid: string | null
  advisorGuid: string | null
  followUpStatusGuid: string | null
  enquiryStatusGuid: string | null
  nextFollowDate: string | null
  enquiryTag: string | null
  isbatSourceGuid: string | null
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
      intakeGuid: input.intakeGuid,
      campusGuid: input.campusGuid,
      enquirySourceGuid: input.enquirySourceGuid,
      studentName: input.studentName,
      enquiryDate: input.enquiryDate,
      mobile: input.mobile,
      email: input.email ?? '',
      countryCode: input.countryCode,
      dob: input.dob,
      remarks: input.remarks,
      programGuid: input.programGuid,
      enquiryTag: input.enquiryTag,
      isbatSourceGuid: input.isbatSourceGuid,
      sourceName: input.sourceName,
      advisorGuid: null,
      followUpStatusGuid: null,
      enquiryStatusGuid: null,
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
