import { apiGet, apiPost } from '@/lib/api/client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface HecDropdownItem {
  value: string
  label: string
}

export function getHecIntakesDropdown() {
  if (MOCK_AUTH) {
    return Promise.resolve([
      { value: 'intk-1', label: '2026 Intake A' },
      { value: 'intk-2', label: '2026 Intake B' }
    ] as HecDropdownItem[])
  }
  return apiGet<HecDropdownItem[]>('/api/v1/academic/intakes/hec-graduation-dropdown')
}

export function getHecProgramsDropdown() {
  if (MOCK_AUTH) {
    return Promise.resolve([
      { value: 'prog-1', label: 'BSc Information Technology' },
      { value: 'prog-2', label: 'BSc Computer Science' }
    ] as HecDropdownItem[])
  }
  return apiGet<HecDropdownItem[]>('/api/v1/academic/program-groups/hec-graduation-dropdown')
}

export interface GraduateTranscriptPendingRow {
  studentGuid: string
  studentNumber: string | null
  studentName: string | null
  programGuid: string | null
  programName: string | null
}

export interface GraduateTranscriptGenerateRequest {
  academicIntakeGuid: string
  examMonth: number
  examYear: number
  studentGuids: string[]
}

export interface GraduateTranscriptGenerateResponse {
  requested: number
  created: number
  refreshed: number
}

export function getGraduateTranscriptPending(academicIntakeGuid: string, programGuid?: string) {
  if (MOCK_AUTH) {
    return Promise.resolve([
      { studentGuid: 'st-1', studentNumber: '012221001', studentName: 'Alice Smith', programGuid: programGuid || 'p-1', programName: 'BSc IT' },
      { studentGuid: 'st-2', studentNumber: '012221002', studentName: 'Bob Jones', programGuid: programGuid || 'p-1', programName: 'BSc IT' },
      { studentGuid: 'st-3', studentNumber: '012221003', studentName: 'Charlie Brown', programGuid: programGuid || 'p-1', programName: 'BSc IT' },
    ] as GraduateTranscriptPendingRow[])
  }
  
  const qs = new URLSearchParams()
  qs.set('academicIntakeGuid', academicIntakeGuid || '')
  if (programGuid) qs.set('programGuid', programGuid)
  
  return apiGet<GraduateTranscriptPendingRow[]>(`/api/v1/assessment/graduate-transcript/pending?${qs.toString()}`)
}

export function generateGraduateTranscripts(req: GraduateTranscriptGenerateRequest) {
  if (MOCK_AUTH) {
    return new Promise<GraduateTranscriptGenerateResponse>(resolve => {
      setTimeout(() => {
        resolve({
          requested: req.studentGuids.length,
          created: req.studentGuids.length - 1,
          refreshed: 1
        })
      }, 1000)
    })
  }
  return apiPost<GraduateTranscriptGenerateResponse>(`/api/v1/assessment/graduate-transcript/generate`, req)
}

export interface GraduateTranscriptCollectionRow {
  transcriptGuid: string
  studentGuid: string | null
  studentNumber: string | null
  studentName: string | null
  programName: string | null
  collectionDate: string | null
  collectedByName: string | null
  phone: string | null
}

export function searchGraduateTranscriptCollection(searchTerm: string) {
  if (MOCK_AUTH) {
    return Promise.resolve([
      { transcriptGuid: 'tg-1', studentGuid: 'sg-1', studentNumber: '012221999', studentName: 'JANE DOE SAMPLE', programName: 'BSc IT', collectionDate: null, collectedByName: null, phone: null },
      { transcriptGuid: 'tg-2', studentGuid: 'sg-2', studentNumber: '012222000', studentName: 'JOHN SMITH', programName: 'BSc CS', collectionDate: '2026-10-01T10:00:00Z', collectedByName: 'SELF', phone: null }
    ].filter(x => x.studentNumber?.includes(searchTerm) || x.studentName?.toLowerCase().includes(searchTerm.toLowerCase())) as GraduateTranscriptCollectionRow[])
  }
  
  const qs = new URLSearchParams()
  qs.set('searchTerm', searchTerm)
  return apiGet<GraduateTranscriptCollectionRow[]>(`/api/v1/assessment/graduate-transcript/collection/search?${qs.toString()}`)
}

export interface RecordCollectionRequest {
  transcriptGuid: string
  collectedByName: string
  phone: string | null
}

export function recordGraduateTranscriptCollection(req: RecordCollectionRequest) {
  if (MOCK_AUTH) {
    return Promise.resolve(true)
  }
  return apiPost<boolean>(`/api/v1/assessment/graduate-transcript/${req.transcriptGuid}/collection`, {
    collectedByName: req.collectedByName,
    phone: req.phone
  })
}
