import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  applyLearningModeChange,
  approveLearningModeChange,
  getLearningModeOptions,
  getLearningModeReport,
  getStudentLearningModeDetail,
  updateStudentLearningMode,
  ApplyLearningModeChangeInput,
  LearningModeReportFilters,
} from '@/lib/api/student/learningMode'
import {
  addLocalLearningModeRequest,
  getLocalLearningModeRequests,
  removeLocalLearningModeRequests,
  LearningModeRequestEntry,
} from '@/lib/api/student/learningModeRequests'

const LEARNING_MODE_KEY = ['learning-mode']

// Enum-backed, not a DB table (see the .md's own note) — cached like every
// other static master list in this app.
export function useLearningModeOptions() {
  return useQuery({
    queryKey: [...LEARNING_MODE_KEY, 'options'],
    queryFn: getLearningModeOptions,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// staleTime 0 — the change-request state on this record can be moved by
// someone else (apply on one page, approve on another), so always refetch
// on mount rather than trusting a cached "pending"/"not pending".
export function useStudentLearningModeDetail(studentGuid: string | null) {
  return useQuery({
    queryKey: [...LEARNING_MODE_KEY, 'detail', studentGuid],
    queryFn: () => getStudentLearningModeDetail(studentGuid as string),
    enabled: !!studentGuid,
    staleTime: 0,
  })
}

// Every write below can move a student in/out of the report (and the
// approval queue, which is the report filtered to status 1) — cheap enough
// to invalidate the whole report broadly rather than track exactly which
// campus/filter combination the student sits in.
function invalidateStudent(queryClient: ReturnType<typeof useQueryClient>, studentGuid: string) {
  queryClient.invalidateQueries({ queryKey: [...LEARNING_MODE_KEY, 'detail', studentGuid] })
  queryClient.invalidateQueries({ queryKey: [...LEARNING_MODE_KEY, 'report'] })
  queryClient.invalidateQueries({ queryKey: [...LEARNING_MODE_KEY, 'pending'] })
}

// Direct update (PUT) — still used by Student Master's row-menu modal.
export function useUpdateStudentLearningMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentGuid, learningMode }: { studentGuid: string; learningMode: number }) =>
      updateStudentLearningMode(studentGuid, learningMode),
    onSuccess: (_result, { studentGuid }) => invalidateStudent(queryClient, studentGuid),
  })
}

export function useApplyLearningModeChange() {
  const queryClient = useQueryClient()
  return useMutation({
    // currentModeLabel: the mode before this request, kept for the approval
    // list (the API stops returning it once the request is pending).
    mutationFn: ({ studentGuid, input }: { studentGuid: string; input: ApplyLearningModeChangeInput; currentModeLabel: string | null }) =>
      applyLearningModeChange(studentGuid, input),
    onSuccess: (result, { studentGuid, currentModeLabel }) => {
      addLocalLearningModeRequest({
        studentGuid,
        studentName: result.studentName,
        studentNum: result.studentNum || result.studentRegNo,
        programName: result.programName,
        semesterName: result.semesterName,
        currentModeLabel,
        requestedModeLabel: result.requestedLearningModeLabel ?? result.learningModeLabel,
        submittedAt: new Date().toISOString(),
      })
      // Seed the detail cache with the response straight away so the page
      // flips to "pending" without waiting on the refetch.
      queryClient.setQueryData([...LEARNING_MODE_KEY, 'detail', studentGuid], result)
      invalidateStudent(queryClient, studentGuid)
    },
  })
}

export function useApproveLearningModeChange() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (studentGuid: string) => approveLearningModeChange(studentGuid),
    onSuccess: (result, studentGuid) => {
      removeLocalLearningModeRequests([studentGuid])
      queryClient.setQueryData([...LEARNING_MODE_KEY, 'detail', studentGuid], result)
      invalidateStudent(queryClient, studentGuid)
    },
  })
}

// Approval list — the browser-local index (see learningModeRequests.ts),
// each entry re-checked against the real detail endpoint so anything
// approved elsewhere (or no longer pending) drops out and is pruned.
// Oldest first — first come, first reviewed. staleTime 0: always re-check
// on mount, the state can be moved from another page or user.
export function usePendingLearningModeRequests() {
  return useQuery({
    queryKey: [...LEARNING_MODE_KEY, 'pending'],
    queryFn: async (): Promise<LearningModeRequestEntry[]> => {
      const entries = getLocalLearningModeRequests()
      const checked = await Promise.all(entries.map(async entry => {
        try {
          const detail = await getStudentLearningModeDetail(entry.studentGuid)
          return { entry, detail, stale: detail.learningModeChangeStatus !== 1 }
        } catch {
          // Couldn't check (network blip) — keep it rather than lose it.
          return { entry, detail: null, stale: false }
        }
      }))
      removeLocalLearningModeRequests(checked.filter(c => c.stale).map(c => c.entry.studentGuid))
      return checked
        .filter(c => !c.stale)
        .map(({ entry, detail }) => detail ? {
          ...entry,
          studentName: detail.studentName ?? entry.studentName,
          studentNum: detail.studentNum || detail.studentRegNo || entry.studentNum,
          programName: detail.programName ?? entry.programName,
          semesterName: detail.semesterName ?? entry.semesterName,
          requestedModeLabel: detail.requestedLearningModeLabel ?? entry.requestedModeLabel,
        } : entry)
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    },
    staleTime: 0,
  })
}

export function useLearningModeReport(filters: LearningModeReportFilters | null, pageNumber: number, pageSize: number) {
  return useQuery({
    queryKey: [...LEARNING_MODE_KEY, 'report', filters, pageNumber, pageSize],
    queryFn: () => getLearningModeReport(filters as LearningModeReportFilters, pageNumber, pageSize),
    enabled: !!filters?.campusGuid,
    staleTime: 60 * 1000,
  })
}

export type { LearningModeRequestEntry } from '@/lib/api/student/learningModeRequests'
export type { LearningModeOption, StudentLearningModeDetail, LearningModeReportRow, LearningModeReportFilters, PagedResult, ApplyLearningModeChangeInput } from '@/lib/api/student/learningMode'
