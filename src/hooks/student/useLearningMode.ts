import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getLearningModeOptions,
  getLearningModeReport,
  getStudentLearningModeDetail,
  updateStudentLearningMode,
  LearningModeReportFilters,
} from '@/lib/api/student/learningMode'
import {
  approveLearningModeRequest,
  createLearningModeRequest,
  getPendingLearningModeRequestForStudent,
  getPendingLearningModeRequests,
  rejectLearningModeRequest,
  CreateLearningModeRequestInput,
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

export function useStudentLearningModeDetail(studentGuid: string | null) {
  return useQuery({
    queryKey: [...LEARNING_MODE_KEY, 'detail', studentGuid],
    queryFn: () => getStudentLearningModeDetail(studentGuid as string),
    enabled: !!studentGuid,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateStudentLearningMode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentGuid, learningMode }: { studentGuid: string; learningMode: number }) =>
      updateStudentLearningMode(studentGuid, learningMode),
    onSuccess: (_result, { studentGuid }) => {
      queryClient.invalidateQueries({ queryKey: [...LEARNING_MODE_KEY, 'detail', studentGuid] })
      // The report roster may now show this student under a different mode
      // — cheap enough to invalidate broadly rather than track exactly
      // which campus/filter combination it currently sits in.
      queryClient.invalidateQueries({ queryKey: [...LEARNING_MODE_KEY, 'report'] })
    },
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

// Change requests — see learningModeRequests.ts for why these are
// browser-local for now.
const REQUESTS_KEY = [...LEARNING_MODE_KEY, 'requests']

export function usePendingLearningModeRequests() {
  return useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: getPendingLearningModeRequests,
    staleTime: 0,
  })
}

export function usePendingLearningModeRequestForStudent(studentGuid: string | null) {
  return useQuery({
    queryKey: [...REQUESTS_KEY, 'student', studentGuid],
    queryFn: () => getPendingLearningModeRequestForStudent(studentGuid as string),
    enabled: !!studentGuid,
    staleTime: 0,
  })
}

export function useCreateLearningModeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLearningModeRequestInput) => createLearningModeRequest(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_KEY }),
  })
}

export function useApproveLearningModeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestGuid, approverRemarks }: { requestGuid: string; approverRemarks: string; studentGuid: string }) =>
      approveLearningModeRequest(requestGuid, approverRemarks),
    onSuccess: (_result, { studentGuid }) => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...LEARNING_MODE_KEY, 'detail', studentGuid] })
      queryClient.invalidateQueries({ queryKey: [...LEARNING_MODE_KEY, 'report'] })
    },
  })
}

export function useRejectLearningModeRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestGuid, approverRemarks }: { requestGuid: string; approverRemarks: string }) =>
      rejectLearningModeRequest(requestGuid, approverRemarks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_KEY }),
  })
}

export type { LearningModeRequest, CreateLearningModeRequestInput } from '@/lib/api/student/learningModeRequests'
export type { LearningModeOption, StudentLearningModeDetail, LearningModeReportRow, LearningModeReportFilters, PagedResult } from '@/lib/api/student/learningMode'
