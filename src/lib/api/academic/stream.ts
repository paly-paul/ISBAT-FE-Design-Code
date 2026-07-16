import { apiDelete, apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Real backend shape returned by GET (list + by-guid)/POST/PUT/DELETE
// /api/v1/academic/specializations — id is now streamGuid.
export interface Stream {
  streamGuid: string
  streamCode: string
  streamName: string
}

export type StreamInput = Omit<Stream, 'streamGuid'>

interface StreamListResponse {
  items: Stream[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

const mockStreams: Stream[] = [
  { streamGuid: '1', streamCode: 'SE',   streamName: 'Software Engineering' },
  { streamGuid: '2', streamCode: 'DS',   streamName: 'Data Science' },
  { streamGuid: '3', streamCode: 'NET',  streamName: 'Networking & Cybersecurity' },
  { streamGuid: '4', streamCode: 'FIN',  streamName: 'Financial Management' },
  { streamGuid: '5', streamCode: 'MKT',  streamName: 'Marketing Management' },
  { streamGuid: '6', streamCode: 'MECH', streamName: 'Mechanical Engineering' },
]

export function getStreams(page = 1, pageSize = 10): Promise<Stream[]> {
  if (MOCK_AUTH) return Promise.resolve(mockStreams)
  return apiGet<StreamListResponse | null>(`/api/v1/academic/specializations?page=${page}&pageSize=${pageSize}`).then(data => data?.items ?? [])
}

export function createStream(input: StreamInput): Promise<Stream> {
  if (MOCK_AUTH) {
    const stream: Stream = { streamGuid: crypto.randomUUID(), ...input }
    mockStreams.push(stream)
    return Promise.resolve(stream)
  }
  return apiPost<Stream>('/api/v1/academic/specializations', input)
}

export function getStreamById(guid: string): Promise<Stream> {
  if (MOCK_AUTH) {
    const existing = mockStreams.find(s => s.streamGuid === guid)
    if (!existing) return Promise.reject(new Error('Stream not found'))
    return Promise.resolve(existing)
  }
  return apiGet<Stream>(`/api/v1/academic/specializations/${guid}`)
}

// Same payload shape as create (see StreamInput above).
export function updateStream(guid: string, input: StreamInput): Promise<Stream> {
  if (MOCK_AUTH) {
    const existing = mockStreams.find(s => s.streamGuid === guid)
    if (!existing) return Promise.reject(new Error('Stream not found'))
    Object.assign(existing, input)
    return Promise.resolve(existing)
  }
  return apiPut<Stream>(`/api/v1/academic/specializations/${guid}`, input)
}

// DELETE /api/v1/academic/specializations/{guid} — soft-delete (data: true on success).
export function deleteStream(guid: string): Promise<boolean> {
  if (MOCK_AUTH) {
    const index = mockStreams.findIndex(s => s.streamGuid === guid)
    if (index === -1) return Promise.reject(new Error('Stream not found'))
    mockStreams.splice(index, 1)
    return Promise.resolve(true)
  }
  return apiDelete<boolean>(`/api/v1/academic/specializations/${guid}`)
}
