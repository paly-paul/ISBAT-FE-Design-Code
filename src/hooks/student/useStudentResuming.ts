import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getResumeCandidate,
  resumeStudent,
  ResumeCandidateMockSeed,
  ResumeStudentRequest,
} from '@/lib/api/student/studentResuming'

const RESUME_CANDIDATE_KEY = ['resume-candidate']

// Only enabled once a student is actually loaded, same convention as
// useIdCard/useSponsorDetails. mockSeed is only read in NEXT_PUBLIC_AUTH_MOCK
// mode (see getResumeCandidate) — harmless to pass unconditionally.
export function useResumeCandidate(studentGuid: string | null, mockSeed: ResumeCandidateMockSeed, enabled: boolean) {
  return useQuery({
    queryKey: [...RESUME_CANDIDATE_KEY, studentGuid],
    queryFn: () => getResumeCandidate(studentGuid as string, mockSeed),
    enabled: enabled && !!studentGuid,
  })
}

export function useResumeStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ studentGuid, payload }: { studentGuid: string; payload: ResumeStudentRequest }) => resumeStudent(studentGuid, payload),
    onSuccess: (_data, { studentGuid }) => queryClient.invalidateQueries({ queryKey: [...RESUME_CANDIDATE_KEY, studentGuid] }),
  })
}

export type { ResumeCandidateDto, ResumeSemesterOption, ResumeFeeHeadOption, ResumeBatchOption, ResumeStudentRequest, ResumeResultDto } from '@/lib/api/student/studentResuming'
