import { updateStudentLearningMode, StudentLearningModeDetail } from './learningMode'

// Learning-mode change requests: raised on /student/learning-mode (mode +
// remarks + optional document), reviewed on /student/learning-mode-approval.
//
// TEMPORARY (2026-09-30): no request/approval endpoints exist yet. Requests
// are kept in this browser's localStorage so both pages see the same queue
// and it survives a refresh — but they are NOT shared between users or
// machines. Approving is the only step that reaches the server, via the
// real PUT /students/learning-mode/{studentGuid}. When the endpoints land,
// replace the bodies below with apiGet/apiPostForm calls; the hooks and
// pages only depend on these function signatures.

export interface LearningModeRequestDocument {
  name: string
  type: string
  // Data URL, so the document survives a refresh without a server. Null
  // when the file was too big for localStorage (name is still kept).
  dataUrl: string | null
}

export interface LearningModeRequest {
  requestGuid: string
  studentGuid: string
  studentName: string
  studentRegNo: string | null
  programName: string | null
  semesterName: string | null
  currentModeLabel: string
  requestedMode: number
  requestedModeLabel: string
  remarks: string
  document: LearningModeRequestDocument | null
  submittedAt: string
}

export interface CreateLearningModeRequestInput {
  studentGuid: string
  studentName: string
  studentRegNo: string | null
  programName: string | null
  semesterName: string | null
  currentModeLabel: string
  requestedMode: number
  requestedModeLabel: string
  remarks: string
  document: File | null
}

const STORAGE_KEY = 'isbat_learning_mode_requests'
// localStorage is ~5MB per origin; keep any single document well under it.
const MAX_DOC_BYTES = 1.5 * 1024 * 1024

function readAll(): LearningModeRequest[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LearningModeRequest[]) : []
  } catch {
    return []
  }
}

function writeAll(requests: LearningModeRequest[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  } catch {
    throw new Error('Could not save the request — browser storage is full. Try a smaller document.')
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read the document.'))
    reader.readAsDataURL(file)
  })
}

export function getPendingLearningModeRequests(): Promise<LearningModeRequest[]> {
  // Oldest first — first come, first reviewed.
  return Promise.resolve(readAll().sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)))
}

export function getPendingLearningModeRequestForStudent(studentGuid: string): Promise<LearningModeRequest | null> {
  return Promise.resolve(readAll().find(r => r.studentGuid === studentGuid) ?? null)
}

export async function createLearningModeRequest(input: CreateLearningModeRequestInput): Promise<LearningModeRequest> {
  const all = readAll()
  if (all.some(r => r.studentGuid === input.studentGuid)) {
    throw new Error('This student already has a learning mode change awaiting approval.')
  }
  const document = input.document
    ? {
        name: input.document.name,
        type: input.document.type,
        dataUrl: input.document.size <= MAX_DOC_BYTES ? await readAsDataUrl(input.document) : null,
      }
    : null
  const { document: _file, ...rest } = input
  const request: LearningModeRequest = {
    ...rest,
    requestGuid: crypto.randomUUID(),
    document,
    submittedAt: new Date().toISOString(),
  }
  writeAll([...all, request])
  return request
}

// approverRemarks has nowhere to go until the approval endpoint exists —
// accepted here so callers don't change when it does.
export async function approveLearningModeRequest(requestGuid: string, _approverRemarks: string): Promise<StudentLearningModeDetail> {
  const request = readAll().find(r => r.requestGuid === requestGuid)
  if (!request) throw new Error('This request no longer exists.')
  const result = await updateStudentLearningMode(request.studentGuid, request.requestedMode)
  writeAll(readAll().filter(r => r.requestGuid !== requestGuid))
  return result
}

export function rejectLearningModeRequest(requestGuid: string, _approverRemarks: string): Promise<void> {
  writeAll(readAll().filter(r => r.requestGuid !== requestGuid))
  return Promise.resolve()
}
