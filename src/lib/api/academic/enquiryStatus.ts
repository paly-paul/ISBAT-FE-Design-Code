import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface EnquiryStatus {
  enquiryStatusGuid: string
  enquiryStatusName: string
  enquiryStatusCode: string
}

export type EnquiryStatusInput = Omit<EnquiryStatus, 'enquiryStatusGuid'>

// Backing store used only when NEXT_PUBLIC_AUTH_MOCK is on — GET, POST,
// PUT, and DELETE are all wired to the real endpoints otherwise.
const mockEnquiryStatuses: EnquiryStatus[] = [
  { enquiryStatusGuid: '98534236-3eeb-4fb6-8cb1-bfe6fdf03634', enquiryStatusName: 'Contact Attempted (CA)',      enquiryStatusCode: 'CA' },
  { enquiryStatusGuid: 'cce28b1c-17da-40b9-a036-57173d998190', enquiryStatusName: 'Meeting Scheduled (MS)',      enquiryStatusCode: 'MS' },
  { enquiryStatusGuid: '42fb47cc-a410-4b66-9c9a-be98541f40d5', enquiryStatusName: 'Proposal Sent (PS)',          enquiryStatusCode: 'PS' },
  { enquiryStatusGuid: 'cde44c6b-1f04-42fa-97ce-755fe0b13c7c', enquiryStatusName: 'Required Next Follow Up (RNF)', enquiryStatusCode: 'RNF' },
]

export function getEnquiryStatuses(): Promise<EnquiryStatus[]> {
  if (MOCK_AUTH) return Promise.resolve(mockEnquiryStatuses)
  return apiGet<EnquiryStatus[] | null>('/api/v1/admissions/enquiry-statuses').then(data => data ?? [])
}

export function createEnquiryStatus(input: EnquiryStatusInput): Promise<EnquiryStatus> {
  if (MOCK_AUTH) {
    const enquiryStatus: EnquiryStatus = { enquiryStatusGuid: crypto.randomUUID(), ...input }
    mockEnquiryStatuses.push(enquiryStatus)
    return Promise.resolve(enquiryStatus)
  }
  return apiPost<EnquiryStatus>('/api/v1/admissions/enquiry-statuses', input)
}

export function getEnquiryStatusById(guid: string): Promise<EnquiryStatus> {
  if (MOCK_AUTH) {
    const existing = mockEnquiryStatuses.find(s => s.enquiryStatusGuid === guid)
    if (!existing) return Promise.reject(new Error('Enquiry status not found'))
    return Promise.resolve(existing)
  }
  return apiGet<EnquiryStatus>(`/api/v1/admissions/enquiry-statuses/${guid}`)
}

// Same payload shape as create (see EnquiryStatusInput above).
export function updateEnquiryStatus(guid: string, input: EnquiryStatusInput): Promise<EnquiryStatus> {
  if (MOCK_AUTH) {
    const existing = mockEnquiryStatuses.find(s => s.enquiryStatusGuid === guid)
    if (!existing) return Promise.reject(new Error('Enquiry status not found'))
    Object.assign(existing, input)
    return Promise.resolve(existing)
  }
  return apiPut<EnquiryStatus>(`/api/v1/admissions/enquiry-statuses/${guid}`, input)
}

// DELETE /api/v1/admissions/enquiry-statuses/{guid} — soft-delete (data: true on success).
export function deleteEnquiryStatus(guid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockEnquiryStatuses.findIndex(s => s.enquiryStatusGuid === guid)
    if (index === -1) return Promise.reject(new Error('Enquiry status not found'))
    mockEnquiryStatuses.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/admissions/enquiry-statuses/${guid}`)
}
