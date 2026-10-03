import { apiGet, apiPost } from '@/lib/api/client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

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
  qs.set('academicIntakeGuid', academicIntakeGuid?.toUpperCase() || '')
  if (programGuid) qs.set('programGuid', programGuid.toUpperCase())
  
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
