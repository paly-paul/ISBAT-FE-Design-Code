// Browser-local index of learning-mode change requests, so
// /student/learning-mode-approval can list them.
//
// TEMPORARY (2026-10-01): apply/approve are real endpoints now, but there's
// no "list pending requests" endpoint (the report API isn't meant for this
// page). So when /student/learning-mode applies a change, it also records a
// small summary here; the approval page lists these and re-checks each one
// against the real GET /students/learning-mode/{studentGuid}, dropping any
// that are no longer pending. Only requests raised in THIS browser appear —
// not shared between users or machines. Replace with a real list endpoint
// when one exists; the hook and page only depend on these signatures.

export interface LearningModeRequestEntry {
  studentGuid: string
  studentName: string | null
  studentNum: string | null
  programName: string | null
  semesterName: string | null
  // The mode before the request — the detail endpoint doesn't return it
  // while a request is pending (learningMode already holds the requested one).
  currentModeLabel: string | null
  requestedModeLabel: string | null
  submittedAt: string
}

const STORAGE_KEY = 'isbat_learning_mode_requests'

export function getLocalLearningModeRequests(): LearningModeRequestEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LearningModeRequestEntry[]) : []
  } catch {
    return []
  }
}

function writeAll(entries: LearningModeRequestEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage blocked/full — the request itself is already saved server-side.
  }
}

// One entry per student (the backend allows only one pending request each).
export function addLocalLearningModeRequest(entry: LearningModeRequestEntry) {
  writeAll([...getLocalLearningModeRequests().filter(e => e.studentGuid !== entry.studentGuid), entry])
}

export function removeLocalLearningModeRequests(studentGuids: string[]) {
  if (studentGuids.length === 0) return
  writeAll(getLocalLearningModeRequests().filter(e => !studentGuids.includes(e.studentGuid)))
}
