// Mock-only for now — the academic master endpoints aren't implemented on
// the real backend yet. Swap these for apiGet/apiPost calls (see
// src/lib/api/client.ts) once the API is available.

export interface Stream {
  id: string
  streamCode: string
  streamName: string
}

export type StreamInput = Omit<Stream, 'id'>

const mockStreams: Stream[] = [
  { id: '1', streamCode: 'SE',   streamName: 'Software Engineering' },
  { id: '2', streamCode: 'DS',   streamName: 'Data Science' },
  { id: '3', streamCode: 'NET',  streamName: 'Networking & Cybersecurity' },
  { id: '4', streamCode: 'FIN',  streamName: 'Financial Management' },
  { id: '5', streamCode: 'MKT',  streamName: 'Marketing Management' },
  { id: '6', streamCode: 'MECH', streamName: 'Mechanical Engineering' },
]

export function getStreams(): Promise<Stream[]> {
  return Promise.resolve(mockStreams)
}

export function createStream(input: StreamInput): Promise<Stream> {
  const stream: Stream = { id: String(mockStreams.length + 1), ...input }
  mockStreams.push(stream)
  return Promise.resolve(stream)
}

export function updateStream(id: string, input: StreamInput): Promise<Stream> {
  const existing = mockStreams.find(s => s.id === id)
  if (!existing) return Promise.reject(new Error('Stream not found'))
  Object.assign(existing, input)
  return Promise.resolve(existing)
}
